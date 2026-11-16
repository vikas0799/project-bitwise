---
title: Caching
description: Keep the right subset of data somewhere faster. Cache hits and misses, what to cache, CDNs and DNS caching, CPU caches and why RAM beats disk, Redis and in-memory stores, cache-aside and write-through, invalidation, eviction policies, stampedes, and real use cases with Node.js and Redis code.
author: Bitwise School
---

> **Caching** means keeping a **subset** of data in a place that's **faster** to read than its original source, so that repeated work takes less time and effort.

Every high-traffic system leans on caching. When people say an app "feels instant", there's almost always a cache behind it. This chapter covers where caches live, how to use one correctly, and the traps that make caches serve wrong data.

The code examples use **Redis** with the official `redis` npm package. They were run against a real Redis server.

## The important word is "subset"

A cache holds a **chosen portion** of your data, never all of it:

- **Fast storage is expensive.** Caches usually live in RAM, which costs far more per gigabyte than disk.
- **Fast storage is small.** A server might have 64 GB of RAM and many terabytes of disk.
- **Caching everything defeats the point.** You'd just be paying twice to store the same data.

So for each piece of data, ask:

| Question | Good cache candidate | Poor candidate |
| --- | --- | --- |
| How often is it read? | thousands of times a minute | once a day |
| Was it used recently? | yes (recent data tends to be reused) | not for weeks |
| How expensive is it to recompute? | a heavy query, an ML model, a paid API call | a primary-key lookup |
| How often does it change? | rarely: course details, a user's profile | constantly: a live cricket score, stock ticks |
| Is it the same for everyone? | the homepage course list | a user's private dashboard (cache per user, carefully) |

## Two situations where caching always appears

1. **Heavy computation.** Producing the result costs a lot of CPU, memory or money: ranking search results, running a trending-topics model, a dashboard query that joins millions of rows. Compute it once, then serve the stored result to everyone who asks for the same thing.
2. **Heavy data transfer.** The data is big and requested by many people far away: videos, images, JavaScript bundles. Keep copies close to users instead of shipping everything from one origin.

Spot either situation in a design discussion and caching is almost certainly part of the answer.

Three examples:

- **Search results.** Ranking pages for a query is expensive, and queries like "weather today" are typed millions of times a day. Search engines keep recent results for popular queries in a distributed in-memory cache. If the answer is there, it's returned instantly; if not, the full pipeline runs once and the result is stored for the next person.
- **Trending lists.** "Trending this week" might be computed from millions of events. Recomputing it for every page view would melt the servers, and trends don't change second to second. So a job recomputes it every few minutes and stores the result in Redis, and every request just reads it.
- **Live streaming.** During a big cricket match, millions of people in India watch the same stream. Serving all of them from one origin data centre would be impossible. Video chunks are cached on **CDN** servers in Indian cities, so each viewer downloads from a nearby copy.

### Hits, misses and hit ratio

- **Cache hit**: the data is in the cache. Fast path.
- **Cache miss**: it isn't. Fetch from the source (database, API, computation), store it in the cache, return it.
- **Hit ratio** = hits ÷ total lookups. A 95% hit ratio means only 1 request in 20 touches the slow source. Monitor it: a low hit ratio means you're caching the wrong things or expiring them too early.

## Where caches live

Caches exist at every level of a system:

| Level | Examples | Who manages it |
| --- | --- | --- |
| Browser and HTTP | browser cache, `Cache-Control`, ETags ([Chapter 01](/system-design/01-http-and-cors/)) | the browser, guided by your headers |
| Network | CDNs, DNS caches | providers like Cloudflare, Akamai, CloudFront; ISPs |
| Hardware | CPU L1/L2/L3 caches, RAM | the CPU and operating system |
| Application | Redis, Memcached, Valkey, an in-process `Map` | you |

## Network caching: CDNs

A **CDN (content delivery network)** stores copies of your content on servers spread around the world, close to users.

- **Origin**: your real server, where the original files live.
- **Edge server**: a CDN server near users. "Edge" always means "close to the user, far from the centre".
- **PoP (point of presence)**: a location, such as a city, with a cluster of edge servers.
- **TTL (time to live)**: how long an edge may serve its copy before checking the origin for a fresh one.

![An origin server far away and three CDN points of presence in Delhi, Mumbai and Chennai serving nearby users from cache](/images/system-design/cdn-edge.svg "Most requests are answered a few milliseconds away. Only misses travel to the origin.")

When a user requests a file, DNS points them to a nearby PoP. On a **hit**, the edge answers immediately. On a **miss**, the edge fetches the file from the origin once, caches it for its TTL, and serves everyone else in that region from the copy. CDNs also route around overloaded servers and pick a good PoP for each user's network conditions.

Big platforms don't cache everything everywhere. They use popularity and regional trends to decide what each PoP keeps: regional-language shows in one city, different titles in another.

CDNs aren't only for video. Hosting platforms like Vercel and Netlify serve HTML, JavaScript, CSS and images from their edge networks. That's why a static site loads quickly from anywhere, and it's how this website is served.

## Network caching: DNS

Browsers need an IP address, not a name like `bitwiseschool.com`. A full **DNS** lookup is a chain of questions: your device asks a **recursive resolver** (your ISP's, or public ones like `8.8.8.8` and `1.1.1.1`), which asks a **root server** where `.com` is, then the **TLD server** where `bitwiseschool.com` is, then the domain's **authoritative server** for the actual IP.

Doing that for every request would be slow, so every step caches the answer for the record's TTL:

1. the **browser's** DNS cache,
2. the **operating system's** cache,
3. the **router** and the **recursive resolver**,
4. and only if all of those miss, the full root → TLD → authoritative walk.

This is also why DNS changes "take time to propagate": old answers stay cached around the internet until their TTL runs out. Lower the TTL a day before you migrate servers.

## Hardware caching: why RAM beats disk

The CPU doesn't read from RAM for every instruction. It keeps the hottest data in tiny, extremely fast caches built into the chip: **L1** (fastest, smallest, per core), **L2**, then **L3** (shared between cores).

![Latency of CPU caches, RAM, SSD, hard disk and an India to US network round trip, with the same times scaled so an L1 read takes one second](/images/system-design/latency-ladder.svg "Reading RAM is about 1,000 times faster than an SSD and 100,000 times faster than a spinning disk.")

A practical consequence: looping through an **array** is very fast, because array elements sit next to each other in memory. When you read one, the CPU loads its neighbours into cache too and prefetches what comes next. Scattered structures like linked lists don't get that benefit.

**Why RAM is so much faster than disk:**

- A **hard disk** has a spinning platter and a mechanical arm that must physically move to the right track. That takes milliseconds, which is an eternity for a CPU. Random reads, jumping around the disk, are especially slow.
- An **SSD** has no moving parts, so it's far faster than a hard disk, but reading flash memory still takes tens of microseconds.
- **RAM** reaches any address with an electrical signal in about 100 nanoseconds, and every address takes about the same time. That's what *random access* means.

The trade-off: RAM is **volatile** (it loses everything when the power goes) and **limited**. That's why databases keep their data on disk ([Chapter 08](/system-design/08-databases/)) and caches keep a subset in RAM.

## In-memory key-value stores: Redis and friends

**Redis**, **Memcached** and **Valkey** (an open-source fork of Redis), and managed services like **AWS ElastiCache**, are called *in-memory key-value NoSQL databases*. Each word means something:

- **In-memory**: data lives in RAM, so reads and writes take microseconds.
- **Key-value**: no tables or schema. You store a value under a key and fetch it by that key. Redis values can be strings, hashes, lists, sets, sorted sets and streams.
- **NoSQL**: no SQL, joins or query planner. The basic API is `SET key value` and `GET key`.
- **Database**: still a real database, with expiry (TTL), persistence options, replication, clustering and pub/sub.

That simplicity is the performance. A `GET` is a hash-table lookup in memory: no parsing a SQL query, no planning, no disk. One Redis server can handle on the order of 100,000 simple operations per second or more.

### How Redis survives a restart

Reads and writes always happen in RAM. Disk is only used to save state for recovery:

- **RDB snapshots**: every few minutes (or after N writes), Redis writes the whole dataset to a `.rdb` file. Restarts are fast, but you can lose the last few minutes of writes.
- **AOF (append-only file)**: every write is appended to a log, which is replayed on restart. Almost no data loss, but the file is bigger and restarts are slower. Redis compacts it in the background.
- **Both together** is the usual production setup when the data matters. For a pure cache that can be rebuilt from the database, you may not need persistence at all.

### Connecting from Node.js

```js
// redis.js
import { createClient } from "redis";

export const redis = createClient({ url: process.env.REDIS_URL });   // e.g. redis://localhost:6379
redis.on("error", (err) => console.error("Redis error:", err));
await redis.connect();
```

Name keys with a prefix and a colon: `course:42`, `session:9f2c…`, `ratelimit:1.2.3.4:29384`. It keeps keys readable and avoids clashes between features.

## Caching strategies

### Cache-aside (lazy caching)

The most common pattern. The cache is filled **only when data is requested**:

1. Look for the key in Redis.
2. **Hit**: return it.
3. **Miss**: read from the database, store it in Redis with a TTL, return it.

![Cache-aside: the app checks Redis, falls back to the database on a miss, stores the result with a TTL, and serves later requests from Redis](/images/system-design/cache-aside.svg "Only data someone actually asked for ends up in the cache.")

```js
const COURSE_TTL = 600;   // 10 minutes

export async function getCourse(id) {
  const key = `course:${id}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);              // hit

  const course = await Course.findById(id);           // miss: go to the database
  if (course) await redis.set(key, JSON.stringify(course), { EX: COURSE_TTL });
  return course;
}
```

- **Pros**: simple; only requested data uses memory; if Redis goes down, the app still works (just slower).
- **Cons**: the first request for each key is slow; cached data can be **stale** until it expires or is invalidated.

### Keeping the cache correct: invalidate on write

When data changes, the cached copy is wrong. The simplest reliable approach: **update the database, then delete the cache key**. The next read misses and loads the fresh value.

```js
export async function updateCourse(id, changes) {
  const course = await Course.update(id, changes);   // 1. write the source of truth
  await redis.del(`course:${id}`);                    // 2. drop the stale copy
  return course;
}
```

Deleting is safer than writing the new value into the cache: if two updates race, a "set" can leave the older value in the cache, while a delete just forces a fresh read. Always keep a TTL too, as a safety net for any invalidation you forget.

### Write-through

Every write updates the **database and the cache together**, in the same request, so reads always find fresh data in the cache.

- **Pro**: the cache is always warm and up to date.
- **Con**: every write does extra work and gets slower, and you fill the cache with data nobody may read.

A third variant, **write-behind**, writes to the cache first and flushes to the database later. It makes writes very fast but risks losing data if the cache dies before the flush, so it's only for data you can afford to lose (like view counters).

| Situation | Strategy |
| --- | --- |
| read-heavy, rarely changes (course pages, profiles) | cache-aside + TTL + delete on update |
| reads must never be stale (inventory shown at checkout) | write-through, or skip the cache for that read |
| unsure about access patterns | start with cache-aside |
| very write-heavy (logs, events) | don't use write-through |

### Cache stampede: when a hot key expires

Your homepage's "trending courses" key expires, and in that same instant 2,000 requests miss and all run the expensive query together. The database falls over. This is a **cache stampede** (or thundering herd). Defences:

- **Coalesce requests**: only one caller recomputes; the others wait for its result.
- **Add jitter to TTLs**, so thousands of keys don't all expire at the same second.
- **Refresh hot keys in the background** before they expire.
- Across many servers, use a short Redis lock (`SET lock:key 1 NX EX 10`) so only one server recomputes.

A reusable wrapper with the first two defences built in:

```js
const inFlight = new Map();

export function cached(keyFn, ttlSeconds, fn) {
  return async (...args) => {
    const key = keyFn(...args);
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);

    if (inFlight.has(key)) return inFlight.get(key);   // someone is already computing it: wait for them
    const promise = (async () => {
      try {
        const value = await fn(...args);
        const jitter = Math.floor(Math.random() * ttlSeconds * 0.1);   // spread out expiry times
        await redis.set(key, JSON.stringify(value), { EX: ttlSeconds + jitter });
        return value;
      } finally {
        inFlight.delete(key);
      }
    })();
    inFlight.set(key, promise);
    return promise;
  };
}

// Usage: 20 requests arriving together run the query once
export const getTrendingCourses = cached(() => "trending:courses", 300, () => courseRepo.trendingThisWeek());
```

In a test, 20 parallel calls triggered exactly **one** computation.

## Eviction: what to throw out when memory is full

RAM runs out eventually. Set a limit with `maxmemory`, and choose what Redis does when it's reached with `maxmemory-policy`:

| Policy | When memory is full, Redis… | Good for |
| --- | --- | --- |
| `noeviction` (default) | **rejects new writes** with an error | data you must never silently lose; not for a cache |
| `allkeys-lru` | removes the key **least recently used** | most caches: the usual choice |
| `allkeys-lfu` | removes the key **least frequently used** | a stable set of always-popular items |
| `volatile-lru` / `volatile-lfu` | the same, but only among keys that have a TTL | mixing cache keys and keys that must stay |
| `volatile-ttl` | removes the key **closest to expiring** | when TTLs reflect value |
| `allkeys-random` | removes a random key | uniform access patterns |

**LRU vs LFU**, with four keys and a fifth arriving:

- **LRU** looks at *when* each key was last used. Keys 1 to 3 were read a minute ago, key 4 yesterday. Key 4 goes.
- **LFU** looks at *how often*. Key 1 was read 5 times, others 10, 6 and 23. Key 1 goes, even if it was read a second ago. LFU protects long-term favourites that LRU might drop after a quiet minute.

Redis approximates LRU and LFU by sampling a few keys instead of tracking every key perfectly, which keeps it fast. Separately from eviction, **TTL expiry** removes keys on its own: `SET weather:delhi "31°C" EX 3600` disappears after an hour with no cleanup code.

## Real uses of Redis in a backend

### 1. Caching expensive database queries

A dashboard or landing page runs a heavy query with joins and aggregations over millions of rows, and monitoring shows it's hit constantly. Cache the result for a few minutes (cache-aside), and delete the key when the underlying data changes.

During a big sale, a product page might get millions of views, but its name, images and specs change maybe once a month. Caching them lets the database spend its effort on what actually matters: checkouts, payments and stock updates. Popular profiles work the same way: read constantly, edited rarely.

> **Rule of thumb:** read-heavy + rarely changing + expensive to produce = cache it.

### 2. Sessions

Every request from a logged-in user must check their session ([Chapter 04](/system-design/04-authentication-and-authorization/)). With 100,000 active users making several requests a minute, that's millions of identical lookups. In Redis, each check is a sub-millisecond `GET`, and the TTL expires old sessions automatically:

```js
import crypto from "node:crypto";

const SESSION_TTL = 7 * 24 * 60 * 60;   // 7 days

export async function createSession(user) {
  const sid = crypto.randomBytes(32).toString("hex");
  await redis.set(`session:${sid}`, JSON.stringify({ userId: user.id, role: user.role }), { EX: SESSION_TTL });
  return sid;   // send it to the browser in an HttpOnly cookie
}

export async function getSession(sid) {
  const data = await redis.get(`session:${sid}`);
  return data ? JSON.parse(data) : null;
}

export const destroySession = (sid) => redis.del(`session:${sid}`);   // logout is instant
```

### 3. Caching third-party API responses

Calling a weather, currency or maps API on every request is slow (an extra network round trip), expensive (many APIs charge per call) and fragile (you'll hit their **rate limits**). If the data changes slower than your traffic, cache it with a TTL that matches how fresh it must be:

| Data | Changes about every… | Sensible TTL |
| --- | --- | --- |
| weather | hour | 30 to 60 minutes |
| currency rates | few minutes | 1 to 5 minutes |
| news headlines | hour | 10 to 30 minutes |
| live stock prices | second | don't cache (or a second or two) |

```js
export const getWeather = cached((city) => `weather:${city.toLowerCase()}`, 1800, async (city) => {
  const res = await fetch(`https://api.weather.example/v1/current?city=${encodeURIComponent(city)}`, {
    headers: { Authorization: `Bearer ${process.env.WEATHER_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
  return res.json();
});
```

### 4. Rate limiting

A rate limiter is middleware that counts requests per client in a time window and rejects the excess with **429 Too Many Requests**. It runs on *every* request, so the counter must be fast and shared across all your servers. A database would add latency and load to every call. Redis's `INCR` increments atomically, so concurrent requests never lose a count:

```js
export const rateLimit = ({ limit = 50, windowSeconds = 60 } = {}) => async (req, res, next) => {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `ratelimit:${req.ip}:${window}`;
  const [count] = await redis.multi().incr(key).expire(key, windowSeconds).exec();

  res.set("RateLimit-Limit", String(limit));
  res.set("RateLimit-Remaining", String(Math.max(0, limit - count)));
  if (count > limit) {
    res.set("Retry-After", String(windowSeconds));
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }
  next();
};

app.use("/api", rateLimit({ limit: 100, windowSeconds: 60 }));
```

With a limit of 3, five quick requests returned `200 200 200 429 429`. The key includes the window number and expires with it, so counters reset with no cleanup code. Use `req.ip` with Express's `trust proxy` setting rather than reading `X-Forwarded-For` yourself: clients can fake that header ([Chapter 01](/system-design/01-http-and-cors/)). This is a **fixed window** limiter; sliding windows and token buckets smooth out bursts at window edges ([Chapter 17](/system-design/17-backend-security/)).

## Common caching mistakes

- **Leaking private data through shared keys.** Caching `/api/me` under the key `me` serves one user's data to everyone. Per-user data needs the user id in the key, and should be marked `Cache-Control: private` at the HTTP level.
- **No TTL.** Forgotten invalidation then means stale data forever. Always set an expiry.
- **Caching misses badly.** If a non-existent id is requested repeatedly, every request hits the database. Cache "not found" for a short time too.
- **Treating the cache as the source of truth.** Redis can lose data or be flushed. The database is the truth; the cache must always be rebuildable.
- **Caching too early.** Fix slow queries with indexes first ([Chapter 08](/system-design/08-databases/)). A cache adds a second copy of data that can go wrong.

## Quick revision

| Idea | One line |
| --- | --- |
| Caching | a subset of data in a faster place, to save time and effort |
| When | heavy computation or heavy data transfer, read often, changes rarely |
| Hit / miss / ratio | found / not found / share of lookups served by the cache |
| CDN | copies near users; edge, PoP, origin, TTL |
| DNS caching | browser → OS → resolver caches before a full lookup |
| RAM vs disk | electrical, constant-time access vs mechanical or flash; RAM is volatile and small |
| Redis | in-memory key-value database; RDB/AOF for persistence |
| Cache-aside | read cache → on miss read DB, store with TTL |
| Invalidation | write the DB, then delete the cache key; keep a TTL as a net |
| Write-through | write DB and cache together; fresh reads, slower writes |
| Stampede | coalesce requests, jitter TTLs, refresh hot keys |
| Eviction | `allkeys-lru` for most caches; `noeviction` is the default |
| Rate limiting | `INCR` + `EXPIRE` per client per window → 429 |

## Interview questions

1. What is caching? Why do we cache only a subset of data?
2. How do you decide whether something is worth caching?
3. Explain cache hit, miss and hit ratio.
4. How does a CDN work? What are edge servers, PoPs and TTL?
5. Walk through a DNS lookup. Where is the answer cached?
6. Why is RAM faster than an SSD or a hard disk? Why not keep everything in RAM?
7. What makes Redis fast? How does it persist data?
8. Cache-aside vs write-through vs write-behind.
9. How do you keep a cache consistent with the database? Why delete the key rather than update it?
10. What is a cache stampede and how do you prevent it?
11. Explain LRU and LFU. What happens in Redis when memory is full by default?
12. Why are sessions and rate-limit counters usually kept in Redis instead of Postgres?
13. Design a rate limiter of 100 requests per minute per user.

## Further reading

- [Redis documentation](https://redis.io/docs/latest/): [data types](https://redis.io/docs/latest/develop/data-types/), [key eviction](https://redis.io/docs/latest/develop/reference/eviction/), [persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
- [node-redis (the `redis` npm package)](https://github.com/redis/node-redis)
- [Cloudflare: what is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) and [what is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)

Next: [Chapter 10, Task Queues and Background Jobs](/system-design/10-task-queues-and-background-jobs/).
