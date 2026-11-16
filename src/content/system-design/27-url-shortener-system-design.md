---
title: Designing a URL Shortener
description: A complete system design case study that ties the series together. Requirements and estimates, API design, 301 vs 302, data model and storage choices, generating short codes with base62, block-allocated ids and a shuffle, custom aliases without races, multi-level caching, request coalescing for viral links, expiry, async click analytics, scaling and failure handling, built and load-tested in Node.js with Postgres and Redis.
author: Bitwise School
---

A URL shortener takes a long link like `https://www.bitwiseschool.com/system-design/27-url-shortener-system-design/` and gives back something like `https://bit.example/27DYaFl`. Visiting the short link redirects to the long one. Think TinyURL or Bitly.

It looks like a weekend project, and the happy path is: one table, two endpoints. That's exactly why it's such a popular interview question and such a good final chapter. Doing it well at scale touches almost everything in this series: API design, databases, caching, id generation, concurrency, queues, analytics, CDNs and failure handling.

- **It's extremely read-heavy.** A link is created once and may be clicked millions of times.
- **Codes must be unique, short and hard to guess**, without one central bottleneck.
- **Some links go viral**, sending thousands of requests per second to a single key.
- **Links expire**, and expired ones must stop working.
- **Every click is analytics data**, but recording it mustn't slow the redirect.
- **An outage breaks every link ever shared**, in emails, printed posters and QR codes.

I built the design in this chapter as a working Express service with Postgres and Redis, then load-tested it. Every number quoted below comes from those runs.

## 1. Requirements

Always start by pinning down what you're building.

**Functional requirements**

- Create a short link for a long URL, optionally with a custom alias (`/sd-batch-2026`) and an expiry date.
- Redirect a short link to its long URL.
- Show the owner basic analytics: total clicks, and ideally clicks over time, referrers and countries.
- Let the owner delete a link.

**Non-functional requirements**

- **Fast redirects**: a few milliseconds at the server, p99 well under 50 ms.
- **High availability**: redirects should keep working even when parts of the system are down. Aim for 99.99%.
- **Durability**: a created link must never be lost.
- **Read-your-writes**: a link must work the moment it's created.
- **Scale**: handle viral traffic and years of growth.
- **Abuse resistance**: don't become a tool for spreading malware or phishing.

Asking about **out of scope** items matters just as much: user accounts and billing, link editing, QR codes and bulk import can be left for later.

## 2. Back-of-the-envelope estimates

Rough numbers decide the architecture. Assume **100 million new links per month** and **100 redirects for every link created**:

| Quantity | Calculation | Result |
| --- | --- | --- |
| Writes (average) | 100M ÷ (30 × 86,400 s) | ~40 per second |
| Writes (peak, 5×) | | ~200 per second |
| Redirects (average) | 40 × 100 | ~4,000 per second |
| Redirects (peak) | | ~20,000 per second |
| Storage per link | URL, code, owner, timestamps, index overhead | ~500 bytes |
| Storage per year | 1.2B links × 500 B | ~600 GB |
| Storage for 5 years | 6B links | ~3 TB |
| Click events | 4,000/s × ~200 bytes | ~70 GB per day, raw |

What these tell us:

- **Writes are easy**; 200 per second is nothing for a single Postgres primary.
- **Reads dominate**, so caching is the core of the design.
- **3 TB of links** over five years is large but manageable: one big Postgres instance can hold it, or you partition later.
- **Click data is the biggest data set by far**, so it belongs in its own pipeline and store, not in the links table.

How long must codes be? With 62 characters (`0-9`, `a-z`, `A-Z`), 6 characters give 62⁶ ≈ 57 billion codes and 7 give 62⁷ ≈ **3.5 trillion**. Six would technically fit five years of links, but 7 leaves huge headroom and makes random guessing hopeless.

## 3. API design

Following the REST conventions from [Chapter 7](/system-design/07-api-design-rest/):

```text
POST   /api/links            create   {url, alias?, expiresInDays?} → 201 {code, shortUrl, expiresAt}
GET    /:code                redirect → 302 Location: <long url>, 404 or 410
GET    /api/links/:code      details and click stats (owner only)
DELETE /api/links/:code      delete (owner only) → 204
```

Redirects live at the root (`/abc1234`), so reserve every path your app needs (`api`, `admin`, `login`, `docs`, …) so nobody can claim them as aliases.

### 301 or 302?

The redirect status is a real design decision:

- **301 Moved Permanently**: browsers and proxies may cache it indefinitely. Repeat visits skip your servers entirely, which is cheaper, but you lose those clicks from your analytics, and you can't ever change or disable the link for someone who has it cached.
- **302 Found** (or 307): a temporary redirect. Every visit comes to you, so you see every click and can expire or delete links reliably.

The cache headers matter as much as the status code: some large shorteners answer with a 301 but add `Cache-Control: private, max-age=90`, which limits caching to 90 seconds. The design here uses **302 with that same short private cache**: a user who clicks twice in a minute doesn't hit the server twice, but expiry and deletion take effect within 90 seconds.

## 4. Data model and storage

One table is enough for the core:

```sql
CREATE TABLE links (
  code        text PRIMARY KEY,                  -- the short code is the lookup key
  long_url    text NOT NULL CHECK (length(long_url) <= 2048),
  owner_id    bigint NOT NULL,
  is_custom   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,
  deleted_at  timestamptz,
  clicks      bigint NOT NULL DEFAULT 0
);
CREATE INDEX links_owner ON links (owner_id, created_at DESC);
CREATE INDEX links_expiry ON links (expires_at) WHERE expires_at IS NOT NULL AND deleted_at IS NULL;
```

The primary key on `code` makes every redirect lookup a single index probe, and its uniqueness settles alias races (below). A partial index on `expires_at` keeps the cleanup job cheap ([Chapter 8](/system-design/08-databases/)).

**Which database?** The access pattern is a key-value lookup by `code`, which almost anything handles well:

| Option | Strengths | Trade-offs |
| --- | --- | --- |
| **Postgres** (with replicas, later partitioning) | transactions, unique constraints, familiar SQL, easy analytics joins | you manage scaling beyond one primary |
| **DynamoDB / Cassandra** | built-in horizontal scaling, automatic TTL, multi-region | weaker uniqueness guarantees; ad-hoc queries are harder |

At 200 writes per second and with a cache absorbing reads, **Postgres is plenty**, and its unique constraint makes custom aliases trivial. Add read replicas for availability and read capacity, and hash-partition by `code` (or move to a distributed store) if you ever outgrow one primary ([Chapter 19](/system-design/19-scaling-and-performance-part-2/)). Both are valid answers in an interview; what matters is explaining the trade-off.

## 5. Generating short codes

This is the heart of the problem. We need codes that are **unique**, **short**, ideally **not guessable**, and generated without one server becoming the bottleneck.

### Options

| Approach | How | Problem |
| --- | --- | --- |
| **Hash the URL** (MD5/SHA, take 7 chars) | same URL → same code | truncated hashes collide; you still need a uniqueness check |
| **UUID** | 128 random bits | 22+ characters in base62: not short |
| **Random 7 chars** | pick random base62 characters | needs an insert-and-retry on collision |
| **Counter + base62** | a global counter, encoded in base62 | sequential codes are guessable; the counter must scale |
| **Snowflake-style ids** | timestamp + machine id + sequence | no central counter, but ~11 characters |

**Random codes** are underrated. With a unique constraint, a collision just means "insert failed, try another code". Even with a billion links stored, a new random 7-character code collides with probability 10⁹ ÷ 3.5×10¹² ≈ **0.03%**, so retries are rare. And random codes can't be enumerated.

**Counter + base62** never collides and needs no retries. The design here uses it, with two improvements that fix its weaknesses.

### Base62

```js
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LENGTH = 7;
const N = 62n ** BigInt(LENGTH);                 // 3,521,614,606,208 possible 7-character codes

export function toBase62(n) {
  let s = "";
  do { s = ALPHABET[Number(n % 62n)] + s; n /= 62n; } while (n > 0n);
  return s.padStart(LENGTH, "0");
}
```

BigInt keeps the arithmetic exact far beyond JavaScript's safe integer range.

### Improvement 1: reserve ids in blocks

A Redis `INCR` per link works, but every new link then needs a network round trip to one Redis key. Instead, each server reserves a **block** of ids at once with `INCRBY` and hands them out locally:

```js
// ids.js: unique ids from a shared counter, reserved in blocks so most ids need no network call.
export function createIdAllocator(redis, { blockSize = 1000, key = "links:id" } = {}) {
  let next = 0n, end = -1n, pending = null;
  async function refill() {
    const top = BigInt(await redis.incrBy(key, blockSize));   // atomically reserve [top - blockSize + 1, top]
    next = top - BigInt(blockSize) + 1n;
    end = top;
  }
  return async function nextId() {
    while (next > end) {
      pending ??= refill().finally(() => { pending = null; });   // one refill at a time, even under concurrency
      await pending;
    }
    return next++;
  };
}
```

```text
INCR per id:        21,134 ids/s
blocks of 1,000:    494,624 ids/s, 20,000 unique, Redis calls: 20
```

About 23× faster, with 1,000× fewer calls to the shared counter. If a server restarts, the rest of its block is simply skipped; gaps in ids don't matter. The same idea works with a Postgres sequence or a dedicated "ticket server", and Redis must be persistent (AOF) so the counter never goes backwards ([Chapter 9](/system-design/09-caching/)).

### Improvement 2: shuffle the ids

Sequential ids give sequential codes: `00000g8`, `00000g9`, `00000ga`. Anyone can walk through every link, including ones shared privately. So before encoding, apply an **invertible shuffle** of the id space:

```js
// f(x) = (A·x + B) mod N, with A coprime to N, so every id maps to a different code
const A = 2_176_477_519_273n;                    // about 0.618·N, odd and not a multiple of 31, so gcd(A, 62^7) = 1
const B = 911_382_323n;
export const encodeId = (id) => toBase62((A * BigInt(id) + B) % N);
```

```text
plain codes for ids 1000..1003:    00000g8 00000g9 00000ga 00000gb
shuffled codes for ids 1000..1003: 27DYaFl ErmM2mE gL5zU3X T4OnLLg
200,000 ids round-trip: true
```

Because `A` shares no factor with 62⁷, the map is one-to-one: no two ids give the same code, and the original id can be recovered. My first choice of `A` was small, and consecutive codes all started with the same letters, still a hint; a multiplier near 0.618 × N spreads them out.

Be honest about what this is: **obfuscation, not encryption**. Someone with a few consecutive codes could work out `A` and `B`. If unguessable links are a real requirement (private documents), use random codes or a keyed cipher over the id space, and never rely on an unlisted link for security.

![Ids are reserved from a Redis counter in blocks, shuffled with an invertible formula, and encoded as seven base62 characters](/images/system-design/id-to-code.svg "Counter → block → shuffle → base62.")

### Custom aliases without races

When two people claim `sd-batch-2026` at the same moment, exactly one must win. Some designs reach for a distributed lock in Redis. There's no need: the **primary key** already guarantees uniqueness, atomically.

```js
const { rowCount } = await db.query(
  `INSERT INTO links (code, long_url, owner_id, is_custom, expires_at) VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (code) DO NOTHING`, [code, url, ownerId, alias !== undefined, expiresAt]);
if (rowCount === 0) return res.status(409).json({ error: "that alias is taken" });   // the unique key settles races
```

Twenty simultaneous requests for the same alias:

```text
20 concurrent claims of one alias  {"201":1,"409":19}
```

One winner, nineteen clean `409 Conflict` responses, and no lock to manage ([Chapter 20](/system-design/20-concurrency-and-parallelism/)).

### Validating what users submit

A shortener that accepts anything becomes a tool for attackers:

```text
javascript: URL                    400 {"error":"only http and https URLs are allowed"}
our own domain                     400 {"error":"can't shorten our own links"}
reserved alias                     400 {"error":"alias must be 4-32 letters, digits, - or _, and not reserved"}
```

- Allow only `http:` and `https:`. A `javascript:` or `data:` URL behind a trusted-looking short link is an attack.
- Refuse your own domain, or someone can build redirect loops.
- Limit URL length, rate-limit creation per user and IP ([Chapter 17](/system-design/17-backend-security/)), and check new URLs against a malware and phishing list (such as Google Safe Browsing), asynchronously if it's slow, disabling links that turn out to be bad.

## 6. The redirect path

This is where almost all traffic goes, so every layer is about avoiding work:

![A redirect checks the code format, then the local cache, Redis and finally Postgres with request coalescing, returns 404, 410 or 302, and streams the click event asynchronously](/images/system-design/redirect-path.svg "Most redirects end in memory; the database sees only misses.")

```js
async function lookup(code) {
  const hot = local.get(code);                                    // L1: in-process LRU, 10 s
  if (hot) return hot === MISSING ? null : hot;
  const cached = await redis.get(`link:${code}`);                 // L2: Redis, shared by all servers
  if (cached) {
    const value = cached === MISSING ? MISSING : JSON.parse(cached);
    local.set(code, value);
    return value === MISSING ? null : value;
  }
  // Cache miss: let only one request per code go to the database.
  if (!inflight.has(code)) {
    inflight.set(code, (async () => {
      try {
        const link = await loadFromDb(code);
        await redis.set(`link:${code}`, link ? JSON.stringify(link) : MISSING, { EX: link ? 3600 : 60 });   // cache "not found" briefly too
        local.set(code, link ?? MISSING);
        return link;
      } finally { inflight.delete(code); }
    })());
  }
  return inflight.get(code);
}

app.get("/:code", async (req, res) => {
  const { code } = req.params;
  if (!ALIAS_RE.test(code)) return res.status(404).send("Not found");          // cheap rejection before any lookup
  const link = await lookup(code);
  if (!link) return res.status(404).send("Not found");
  if (link.expiresAt && link.expiresAt < Date.now()) return res.status(410).send("This link has expired");
  redis.xAdd("clicks", "*", { code, ref: req.get("referer") ?? "", ua: (req.get("user-agent") ?? "").slice(0, 200), at: String(Date.now()) },
    { TRIM: { strategy: "MAXLEN", strategyModifier: "~", threshold: 1_000_000 } }).catch(() => {});   // never block or fail the redirect
  res.set("Cache-Control", "private, max-age=90").redirect(302, link.url);
});
```

The ideas in it:

- **Reject junk early.** Scanners hammer random paths; a regex check costs nothing.
- **Two cache levels** ([Chapter 9](/system-design/09-caching/), [Chapter 18](/system-design/18-scaling-and-performance-part-1/)). Redis is shared, so a link cached by one server helps all of them. The small in-process LRU protects Redis itself when one key goes viral.
- **Negative caching.** "This code doesn't exist" is cached for 60 seconds, so bots probing random codes don't reach the database. Creating a custom alias deletes any cached "missing" marker for it.
- **Request coalescing (single-flight).** When a link that isn't cached suddenly gets traffic, a thousand requests could all miss the cache and all query the database at once: a **cache stampede**. The `inflight` map makes them share one query:

```text
1,000 concurrent first visits      database reads: 1
```

- **Different statuses for different situations**: `404` for unknown or deleted links, `410 Gone` for expired ones.

```text
redirect                           302 https://example.org/course
unknown code                       404 Not found
expired link                       410 This link has expired
```

### Measured

I loaded 10,000 links and drove traffic at them with autocannon (50 connections, 80% of requests to 100 popular links and 20% to the rest, as real traffic is skewed), with the server in its own process:

| Configuration | Requests/s | p50 | p99 | Database queries/s |
| --- | ---: | ---: | ---: | ---: |
| database every time, click counted in the database | 6,595 | 6 ms | 14 ms | ~12,500 |
| database every time, click sent to a stream | 6,919 | 6 ms | 14 ms | ~6,400 |
| Redis cache, click sent to a stream | 9,744 | 4 ms | 13 ms | ~900 |
| local LRU + Redis, click sent to a stream | 9,777 | 3 ms | 22 ms | ~960 |

With caching and streamed clicks, throughput rose about 50% and **database load fell by more than 90%**. The remaining queries were first visits to the long tail of links. Honest caveats: everything ran on one 4-core machine, so the load generator competed for CPU; the database was local and the whole table fit in memory, which makes the uncached version look better than it would across a network under real load. The in-process LRU added almost nothing here because Redis was local and nothing was viral; its job is protecting Redis when a single key gets thousands of requests per second.

### The CDN layer

In front of everything, a CDN or edge layer ([Chapter 19](/system-design/19-scaling-and-performance-part-2/)) can serve popular redirects from locations near users, with a short TTL so deletion still works, and an API purge when a link is deleted. Edge functions can even look up codes in an edge key-value store. Remember the trade-off: redirects served from the edge never reach your servers, so count those clicks from the CDN's logs.

## 7. Click analytics without slowing redirects

Counting clicks with `UPDATE links SET clicks = clicks + 1` on every redirect puts a database write on the hottest path, and for a viral link, every request fights over the same row's lock. In the load test, it doubled the database queries per redirect.

Instead, the redirect appends an event to a **Redis stream** (`XADD`) without waiting for it, and a worker processes the stream in batches ([Chapter 10](/system-design/10-task-queues-and-background-jobs/), [Chapter 23](/system-design/23-message-brokers-and-kafka/)):

```js
// analytics.js: a worker that turns the click stream into counts, in batches.
export async function drainClicks(redis, db, { group = "counters", consumer = "worker-1", batch = 1000 } = {}) {
  await redis.xGroupCreate("clicks", group, "0", { MKSTREAM: true }).catch(() => {});   // already exists: fine
  let total = 0;
  for (;;) {
    const res = await redis.xReadGroup(group, consumer, { key: "clicks", id: ">" }, { COUNT: batch });
    const messages = res?.[0]?.messages ?? [];
    if (messages.length === 0) return total;
    const perCode = new Map();
    for (const m of messages) perCode.set(m.message.code, (perCode.get(m.message.code) ?? 0) + 1);
    await db.query(
      `UPDATE links AS l SET clicks = l.clicks + c.n
       FROM unnest($1::text[], $2::int[]) AS c(code, n) WHERE l.code = c.code`,
      [[...perCode.keys()], [...perCode.values()]]);                 // one UPDATE per batch, not one per click
    await redis.xAck("clicks", group, messages.map((m) => m.id));     // acknowledge only after the update committed
    total += messages.length;
  }
}
```

```text
analytics worker                   processed 1001 click events; viral link clicks = 1000
```

A thousand clicks on one link became one `UPDATE`. If the worker crashes between the update and the acknowledgement, those events are delivered again: at-least-once. For exact counts, record processed event ids; for analytics, a tiny overcount after a crash is usually acceptable.

Click counts on the links table are fine for a dashboard number. Detailed analytics (clicks per hour, referrers, countries from IP, devices from user agents) belong in a store built for big aggregations: **ClickHouse**, BigQuery or a data warehouse fed from Kafka. At ~70 GB of raw events per day, keep them out of the transactional database.

## 8. Expiry and deletion

Two complementary approaches:

- **Lazy checks**: the redirect checks `expires_at` and returns `410`. Expiry is exact even if cleanup hasn't run yet.
- **Background cleanup**: a scheduled job deletes rows that expired long ago, in small batches so it never locks the table for long:

```js
export async function purgeExpired({ batch = 5000, pauseMs = 50 } = {}) {
  let total = 0, rounds = 0;
  for (;;) {
    const { rowCount } = await db.query(
      `DELETE FROM links WHERE code IN (
         SELECT code FROM links
         WHERE expires_at < now() - interval '30 days'
         LIMIT $1 FOR UPDATE SKIP LOCKED)`, [batch]);   // short transactions; safe to run on several workers
    total += rowCount; rounds++;
    if (rowCount < batch) return { total, rounds };
    await new Promise((r) => setTimeout(r, pauseMs));     // give normal traffic room between batches
  }
}
```

```text
{ total: 50000, rounds: 11 } in 700 ms
```

Deletion by an owner sets `deleted_at` (a soft delete keeps history and lets you undo abuse reports) and removes the Redis entry. Other servers' 10-second local copies expire on their own; if you need instant removal everywhere, publish an invalidation message to all servers. Should deleted or expired codes ever be reused? **No.** Old links live forever in emails and printed material; reusing a code could send someone's old link to a stranger's page. With 3.5 trillion codes, there's no shortage.

## 9. The whole system

![Browsers reach a CDN, a load balancer and stateless app servers with local caches; the servers use Redis for cache, ids and a click stream, and Postgres for links; a worker turns clicks into counts](/images/system-design/shortener-architecture.svg "Stateless app servers, a shared cache, one source of truth, and an asynchronous analytics pipeline.")

- **App servers are stateless** ([Chapter 19](/system-design/19-scaling-and-performance-part-2/)), so you add more behind the load balancer as traffic grows. Each holds only a local cache and its current id block.
- **Redis** holds the shared cache, the id counter and the click stream. Run it with replication and persistence; for very large caches, Redis Cluster.
- **Postgres** is the source of truth, with replicas for failover and reads.
- **Workers** process clicks and cleanup; they can lag behind without affecting redirects.

### When things fail

| Failure | What happens | Mitigation |
| --- | --- | --- |
| Redis down | cache misses go to the database; new ids can't be reserved | read from Postgres with a timeout on Redis calls; servers keep using their current id block; fall back to random codes for creation |
| Database primary down | redirects for cached links keep working; creating links fails | promote a replica; serve redirects from replicas and caches |
| A link goes viral | thousands of requests per second for one key | local LRU, request coalescing, CDN caching |
| Click pipeline backs up | analytics fall behind | the stream buffers; scale workers; redirects are unaffected |
| A whole region fails | users in that region can't reach you | multi-region deployment with replicated data, DNS failover |
| Abuse (phishing links) | your domain gets blocklisted | URL scanning, rate limits, fast takedown, reporting |

The principle throughout: **protect the redirect.** Everything else (creating links, analytics, cleanup) can degrade or fall behind; redirects are what millions of people already depend on.

### Scaling further

- **Partition the links table** by a hash of `code` when one primary isn't enough; every query includes the code, so each touches one partition ([Chapter 19](/system-design/19-scaling-and-performance-part-2/)).
- **Go multi-region**: each region runs the full stack with locally replicated data; creates can go to one primary region, and because codes come from separate id blocks, regions never clash.
- **Push redirects to the edge** for the most popular links.

## 10. What this chapter used from the series

| Part of the design | Chapter |
| --- | --- |
| HTTP redirects, status codes, caching headers | [1](/system-design/01-http-and-cors/), [7](/system-design/07-api-design-rest/) |
| Input validation | [5](/system-design/05-validations-and-transformations/) |
| Schema, primary keys, partial indexes, batch deletes | [8](/system-design/08-databases/) |
| Cache-aside, negative caching, TTLs | [9](/system-design/09-caching/) |
| Background workers | [10](/system-design/10-task-queues-and-background-jobs/) |
| Graceful degradation | [12](/system-design/12-error-handling-and-fault-tolerance/) |
| Abuse prevention, rate limiting | [17](/system-design/17-backend-security/) |
| Estimates, percentiles, load testing | [18](/system-design/18-scaling-and-performance-part-1/) |
| Stateless servers, replicas, partitioning, CDN | [19](/system-design/19-scaling-and-performance-part-2/) |
| Unique constraints instead of locks, single-flight | [20](/system-design/20-concurrency-and-parallelism/) |
| Event streams, at-least-once processing | [23](/system-design/23-message-brokers-and-kafka/) |

That's the real lesson of system design: there are few new ideas in any one system. Good designs combine well-understood building blocks, chosen with numbers and justified with trade-offs.

## How to present this in an interview

1. **Clarify requirements** (5 minutes): features, scale, latency, what's out of scope.
2. **Estimate** (5 minutes): writes and reads per second, storage, code length.
3. **Sketch the API and data model.**
4. **Draw the high-level design**: clients, load balancer, app servers, cache, database.
5. **Go deep on the hard parts**: code generation, caching and hot keys, analytics.
6. **Discuss failures and scaling**: what breaks first, and what you'd do about it.
7. **State your trade-offs out loud**: 301 vs 302, counter vs random codes, SQL vs NoSQL. Interviewers care more about your reasoning than about a "right" answer.

## Quick revision

| Topic | Remember |
| --- | --- |
| Workload | ~100:1 reads to writes; caching is the core |
| Estimates | 40 writes/s, 4,000 redirects/s, ~600 GB/year (at 100M links/month) |
| Code length | 62⁷ ≈ 3.5 trillion codes |
| Redirect status | 302 keeps analytics and control; 301 is cached by browsers forever |
| Storage | key-value access pattern; Postgres is plenty at this write rate |
| Code generation | counter + base62 (no collisions) or random (unguessable) |
| Block allocation | `INCRBY 1000` per server: ~23× faster than `INCR` per id |
| Shuffle | invertible `(A·x + B) mod N` hides sequences; not encryption |
| Custom aliases | `INSERT ... ON CONFLICT DO NOTHING`; the primary key settles races |
| Validation | http/https only, no own domain, reserved words, rate limits, malware checks |
| Caching | local LRU + Redis + negative caching; CDN at the edge |
| Stampede | single-flight: 1,000 misses → 1 query |
| Analytics | stream events, aggregate in batches, store in an analytics database |
| Expiry | lazy `410` + batched background cleanup; never reuse codes |
| Failure | protect the redirect; everything else can degrade |

## Interview questions

1. Design a URL shortener. What questions would you ask first?
2. Estimate the reads, writes and storage for 100 million new links a month.
3. How long should short codes be, and why?
4. Compare hashing, random codes, a counter with base62, and Snowflake ids for generating codes.
5. How would you stop people from guessing other users' short links?
6. How do you make sure two users can't claim the same custom alias?
7. Should redirects use 301 or 302? What changes for analytics and deletion?
8. Describe the caching layers for redirects. What is negative caching?
9. A link goes viral and gets 50,000 requests per second. What happens, and how do you handle it?
10. How would you record clicks without slowing down redirects?
11. How do you handle link expiry? Should expired codes be reused?
12. What happens if Redis goes down? If the database primary goes down?
13. How would you prevent abuse such as phishing links?
14. How would you scale this design to multiple regions?

## Further reading

- [Designing Data-Intensive Applications](https://dataintensive.net/) by Martin Kleppmann
- *System Design Interview, Volume 1* by Alex Xu (the URL shortener chapter), also on [ByteByteGo](https://bytebytego.com/)
- [Twitter: Announcing Snowflake](https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake)
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [Google Safe Browsing](https://developers.google.com/safe-browsing)
- [MDN: Redirections in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections)

This is the last chapter of the series. Go back to the [system design index](/system-design/) to revisit any part, or start again from [Chapter 1](/system-design/01-http-and-cors/) with fresh eyes: it will read differently now.
