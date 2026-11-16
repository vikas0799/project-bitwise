---
title: Scaling and Performance, Part 2
description: Scaling the infrastructure around your code. Stateless servers, load balancer algorithms and health checks, read replicas and replication lag, partitioning, sharding and consistent hashing, distributed databases, CDNs and the speed of light, edge computing, async processing, monoliths vs microservices, serverless and cold starts, and a scaling playbook, with tested examples.
author: Bitwise School
---

[Part 1](/system-design/18-scaling-and-performance-part-1/) was about measuring and about making one server and one database faster. This part zooms out to the architecture: how to run many servers, how the database itself scales, how to beat the speed of light with CDNs and edge code, how to move work out of the request, and when microservices or serverless are actually worth it.

The experiments here ran for real: two Express servers sharing sessions, a Postgres primary with a streaming replica, Postgres partitioning, a consistent-hashing comparison and an edge auth function.

## Statelessness: what makes scaling out possible

Horizontal scaling assumes that **any server can handle any request**. The moment a server keeps something the others can't see (a login session in memory, an uploaded file on its disk, a background job in its process), that server becomes special. Send the user somewhere else and things break; restart that server and the data is gone.

I tested this with two Express servers behind the same client. The user logs in on server A, then the next request lands on server B:

```js
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

app.use(session({
  store: new RedisStore({ client: redis, prefix: "sess:" }),   // leave this out and sessions live in process memory
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, sameSite: "lax" },
}));
```

```text
memory store: log in on server A -> /me on A: 200, /me on B: 401
redis store : log in on server A -> /me on A: 200, /me on B: 200
```

![With sessions in server memory, a second request routed to another server fails; with sessions in Redis, any server can answer](/images/system-design/stateful-vs-stateless.svg "Same code, same servers. Only the session store changed.")

With the default in-memory store, server B has never heard of the user. With a shared Redis store, it doesn't matter which server answers. (Tokens such as JWTs avoid the shared store entirely, with the trade-offs from [Chapter 4](/system-design/04-authentication-and-authorization/).)

### What has to move out of the server

| State | Inside the server (breaks scaling) | Outside the server (scales) |
| --- | --- | --- |
| Sessions | in-memory store | Redis, the database, or signed tokens |
| Uploaded files | local disk | object storage: S3, Cloudflare R2, MinIO |
| Cache that must be consistent | a `Map` in the process | Redis, Memcached, Valkey |
| Data | a SQLite file on the server | a database server (Postgres, MySQL) |
| Background jobs | a `setTimeout` or in-process loop | a job queue (BullMQ, RabbitMQ, Kafka) |
| Scheduled jobs | `setInterval` on every server | one scheduler, or a queue's repeatable jobs |

The last row catches people out: if every server runs the nightly report with `setInterval`, ten servers send ten reports. Use a queue scheduler ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)) or a lock so it runs once.

> **The test:** could you delete any one server at random, right now, without users noticing anything except maybe a retried request? If not, something is still stored on that server.

Process-local caches are fine as long as they're only a speed-up (the L1 cache from Part 1), never the only copy.

## Load balancer algorithms

Part 1 introduced load balancers and Nginx. A few more details matter at scale.

**Round robin** sends requests to each server in turn. It's fair when servers are identical and requests cost about the same. When some requests are expensive (a report, a big upload), round robin can stack several of them on one server by bad luck while others sit idle.

**Weighted round robin** gives bigger servers a bigger share: a server with twice the CPUs gets twice the requests. It's also how you send 5% of traffic to a new version during a canary release. It still ignores how long each request takes.

**Least connections** sends each new request to the server with the fewest requests in progress. A server stuck on slow requests has more open connections, so it automatically gets less new work. It's the best general choice for APIs.

Others you'll meet:

- **Least response time**: prefers servers that have been answering fastest, so a struggling server gets less traffic.
- **Power of two choices**: pick two servers at random and send the request to the less busy one. Almost as good as checking every server, and it works well when there are many load balancers that can't share exact counts. Nginx supports it as `random two least_conn`.
- **Resource-based**: servers report CPU or memory use and the balancer routes by that.
- **IP hash / sticky sessions**: pins a client to one server. It's a workaround for stateful servers, and it spreads load unevenly; making the servers stateless is the real fix.

**Layer 4 vs layer 7.** A layer 4 balancer (AWS NLB, HAProxy in TCP mode) forwards TCP connections without reading them, so it's extremely fast but can't route by URL. A layer 7 balancer (Nginx, AWS ALB, Envoy) reads the HTTP request, so it can route `/api` and `/images` to different services, terminate TLS, add headers and retry. Most web apps use layer 7.

## Health checks

Without health checks, a round-robin balancer keeps sending traffic to a crashed server, and every third user sees a `502 Bad Gateway`. With them, the balancer probes each server (usually `GET /health`) every few seconds:

- after a set number of failures in a row, the server is **taken out** of rotation
- the balancer keeps probing it, and after a set number of successes in a row it's **put back**
- some balancers then **slow-start** it, sending traffic gradually so a cold server isn't flooded

Requiring several failures before removal stops one slow response from flapping a healthy server in and out. Part 1 showed a `/health` endpoint that checks the database with a timeout, and [Chapter 16](/system-design/16-graceful-shutdown/) explained how failing readiness during shutdown lets the balancer drain a server before it stops.

## Scaling the database: read replicas

Once the app servers are stateless, adding more of them is easy. The database is the hard part, because it **is** the state. The first step is almost always **read replicas**.

One **primary** handles every write. One or more **replicas** receive a continuous copy of the primary's changes and serve **reads only**. Most web apps read far more than they write (browsing courses vs buying one), so replicas take most of the load. Replicas in other regions also make reads faster for users there, and a replica can be promoted if the primary fails.

![App servers send writes to the primary and reads to replicas, which receive changes from the primary through asynchronous replication](/images/system-design/read-replicas.svg "The primary takes every write; replicas serve reads and are always slightly behind.")

I set up a real Postgres 16 primary with a streaming replica on the same machine. First, a replica refuses writes:

```text
write to replica: cannot execute UPDATE in a read-only transaction
```

### Replication lag

Replication is usually **asynchronous**: the primary confirms a write as soon as it's saved locally, then streams it to the replicas. So replicas are always a little behind. I updated a row on the primary 200 times and read it back from the replica immediately each time:

```text
read right after write was stale: 157/200 times
time until visible: p50 0.40 ms, max 4.61 ms
```

Even with both databases on the **same machine** and lag under half a millisecond, 157 of 200 immediate reads returned the **old** value. Across regions, or with a busy replica, lag is often tens of milliseconds and can reach seconds or minutes during heavy writes.

The classic bug: a user changes their name, the page reloads, the read goes to a replica, and they see their old name. They assume the save failed and try again.

### Read-after-write consistency

Common fixes:

- **Route a user's reads to the primary for a short time after they write.**
- **Track the write position**: after a write, remember the primary's WAL position (`pg_current_wal_lsn()`), and only read from a replica that has replayed past it (`pg_last_wal_replay_lsn()`).
- **Use the response**: return the updated object from the write request and show that, instead of re-reading.
- **Read critical data from the primary**: balances, permissions, anything where stale data causes real harm.

Here's the first approach. To make lag easy to see, I configured the replica with `recovery_min_apply_delay = '2s'`, a real Postgres setting that keeps a replica deliberately two seconds behind:

```js
import pg from "pg";

const primary = new pg.Pool({ connectionString: process.env.PRIMARY_URL });
const replica = new pg.Pool({ connectionString: process.env.REPLICA_URL });

// A user who just wrote reads from the primary for a few seconds.
const RECENT_WRITE_MS = 5_000;
const lastWriteAt = new Map();   // userId -> timestamp; keep this in Redis or a cookie when you run several servers

export const db = {
  async write(userId, sql, params) {
    const result = await primary.query(sql, params);
    lastWriteAt.set(userId, Date.now());
    return result;
  },
  async read(userId, sql, params) {
    const recent = Date.now() - (lastWriteAt.get(userId) ?? 0) < RECENT_WRITE_MS;
    return (recent ? primary : replica).query(sql, params);
  },
};
```

```text
replica right after the update: Asha
same user, routed read:         Asha V.
another user (replica):         Asha
replica 2.5 s later:            Asha V.
```

The user who made the change sees it immediately. Other users may see the old value for a moment, which is usually fine. Monitor lag on the primary with `SELECT replay_lag FROM pg_stat_replication`, and stop sending reads to a replica that falls too far behind.

ORMs and drivers often support this split directly (Prisma's read-replicas extension, Sequelize's `replication` option, separate primary and reader endpoints on Amazon RDS and Aurora).

## Partitioning and sharding

Replicas multiply **read** capacity, but every write still goes to one primary, and every replica still stores **all** the data. When one machine can't hold the data or absorb the writes, you split the data.

### Partitioning: splitting a table inside one database

Postgres can split one big logical table into smaller physical tables, for example one per month:

```sql
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id int NOT NULL,
  created_at timestamptz NOT NULL,
  total numeric(10,2) NOT NULL,
  PRIMARY KEY (id, created_at)          -- the partition key must be part of the primary key
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2026_09 PARTITION OF orders FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE orders_2026_10 PARTITION OF orders FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE orders_2026_11 PARTITION OF orders FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
```

Your code still queries `orders`. With 300,000 rows spread over three months, a query for the first half of November only touched one partition:

```text
 Aggregate
   ->  Seq Scan on orders_2026_11 orders
         Filter: ((created_at >= '2026-11-01 ...') AND (created_at < '2026-11-15 ...'))
```

That's **partition pruning**. It also makes deleting old data cheap: `DETACH PARTITION` plus `DROP TABLE` removed a whole month in a few milliseconds, where `DELETE` would have rewritten 100,000 rows and left the table bloated. Partitioning still runs on one server, so it helps with big tables, not with outgrowing the machine.

### Sharding: splitting data across databases

**Sharding** puts different rows on different database servers. Each shard holds a slice of the data and takes a slice of the writes, so capacity grows with every shard you add.

The most important decision is the **shard key**, the column that decides which shard a row lives on:

| Strategy | Example | Watch out for |
| --- | --- | --- |
| **By range** | orders by month, users by ID range | new data all lands on the newest shard (a hot shard) |
| **By hash** | `hash(user_id)` | range queries have to ask every shard |
| **By geography** | Indian users in Mumbai, EU users in Frankfurt | uneven regions; users who move |
| **By tenant** | each school's data on one shard | one huge customer can outgrow a shard |

A good shard key spreads load evenly **and** matches your most common queries. If every query includes `user_id`, shard by `user_id`, and each request touches one shard. A query that needs *all* shards ("top 10 courses across every user") becomes slow and complicated.

Sharding costs a lot: joins and transactions across shards are hard or impossible, unique constraints only hold within a shard, and moving data between shards is a project of its own. It's the last step of database scaling, not the first.

### Consistent hashing

The obvious hash scheme is `shard = hash(key) % numberOfShards`. It works until you add a shard: changing `% 4` to `% 5` changes the answer for most keys, so most of the data must move. Consistent hashing fixes that.

Shards are placed at points on a circle (the "ring") by hashing their names. A key is hashed onto the same ring and belongs to the **next shard clockwise**. Each shard gets many points (**virtual nodes**) so the ring is evenly divided.

```js
import { createHash } from "node:crypto";

const hash = (s) => createHash("md5").update(String(s)).digest().readUInt32BE(0);   // stable 32-bit number

function buildRing(shards, vnodes = 100) {
  const ring = [];
  for (const shard of shards) for (let v = 0; v < vnodes; v++) ring.push({ point: hash(`${shard}#${v}`), shard });
  return ring.sort((a, b) => a.point - b.point);
}

function ringShard(ring, key) {
  const h = hash(key);
  let lo = 0, hi = ring.length;                 // binary search for the first point >= h
  while (lo < hi) { const mid = (lo + hi) >> 1; if (ring[mid].point < h) lo = mid + 1; else hi = mid; }
  return ring[lo % ring.length].shard;          // wrap around to the start of the ring
}
```

I assigned 100,000 keys to 4 shards, added a fifth, and counted how many keys changed shard:

```text
4 -> 5 shards, keys that move:
  modulo:             79.7%
  consistent hashing: 19.8%
keys per shard on the 5-shard ring: { s1: 20615, s0: 18123, s4: 19761, s2: 20420, s3: 21081 }
```

![A hash ring with four shards and a new fifth shard; only the keys in the arc before the new shard move to it](/images/system-design/consistent-hash-ring.svg "Adding s4 only takes keys from its neighbour on the ring.")

With modulo, four out of five keys moved. With consistent hashing, only about a fifth moved (the minimum possible, since the new shard should own a fifth), and each shard ended up with roughly 20%. The same idea is used by distributed caches, DynamoDB, Cassandra and many load balancers.

## Distributed databases: let someone else do it

Running your own replicas, failover and sharding is specialist work. Managed and distributed databases do much of it for you:

| Database | Built on | Known for |
| --- | --- | --- |
| **Amazon Aurora / RDS** | Postgres or MySQL | managed replicas, automatic failover, reader endpoints |
| **Neon** | Postgres | serverless Postgres that scales to zero, database branching |
| **PlanetScale** | MySQL with Vitess (also offers Postgres) | horizontal sharding, schema changes without downtime |
| **Citus** | a Postgres extension | sharding Postgres tables across nodes |
| **CockroachDB** | Postgres-compatible | multi-region, survives zone and region failures |
| **YugabyteDB** | Postgres-compatible | geo-distributed with tunable consistency |

Unless you have database specialists, **use a managed service** rather than building replication and sharding yourself. Your job is to understand the ideas well enough to choose replica regions, backup settings and shard keys correctly, and to know what consistency you're getting.

## CDNs and the speed of light

Some latency can't be optimised away. Light in optical fibre travels at about 200,000 km per second. Mumbai to the AWS `us-east-1` region in Virginia is about 12,900 km in a straight line, so a round trip takes at least:

> **2 × 12,900 km ÷ 200,000 km/s ≈ 130 ms**

That's the floor before any server work, and real cables don't run in straight lines, so measured round trips are higher. A new HTTPS connection needs several round trips (TCP and TLS handshakes) before the first byte of data. Physics alone can make a page feel slow for an Indian user of a US-hosted app.

| From Mumbai to | Distance | Minimum round trip |
| --- | ---: | ---: |
| Singapore | ~3,900 km | ~39 ms |
| Frankfurt | ~6,600 km | ~66 ms |
| Virginia (us-east-1) | ~12,900 km | ~129 ms |
| A CDN edge in Mumbai | a few km | ~1 ms |

A **content delivery network** keeps copies of your content in data centres (edge locations, or PoPs) close to users. The Mumbai user gets files from Mumbai; only cache misses travel to your origin. [Chapter 9](/system-design/09-caching/) covers how CDN caching works; the key is the `Cache-Control` header you send:

```js
// Fingerprinted build files (app.3f9a1c.js) never change: let browsers and CDNs keep them for a year.
app.use("/assets", express.static("dist/assets", { immutable: true, maxAge: "1y" }));

// Public API data that can be a minute old: CDN caches 60 s, may serve stale for 5 min while refreshing.
app.get("/api/courses", (req, res) => {
  res.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
  res.json(courses);
});

// Anything personal must never be stored by a shared cache.
app.get("/api/me", (req, res) => { res.set("Cache-Control", "private, no-store"); res.json(user); });
```

```text
/assets/app.js 200 public, max-age=31536000, immutable
/api/courses 200 public, max-age=0, s-maxage=60, stale-while-revalidate=300
/api/me 200 private, no-store
```

`s-maxage` applies only to shared caches like CDNs, so browsers re-check while the CDN absorbs the traffic. When data changes before the TTL ends, most CDNs let you **purge** by URL or by cache tag.

**What to put on a CDN:** all static files (JavaScript, CSS, images, fonts, video), and public API responses that are the same for everyone (course catalogue, blog posts, public config). Never cache responses that depend on who's asking unless the cache key includes it.

**CDNs as a shield.** A CDN also sits between attackers and your origin. A DDoS flood hits a network spread across hundreds of cities with enormous capacity instead of your three servers, and the CDN's firewall can challenge or block suspicious traffic before it reaches you. Lock the origin down so it only accepts traffic from the CDN; otherwise attackers just go around it.

## Edge computing

A classic CDN can only return stored files. **Edge computing** runs *your code* at those edge locations, so some decisions happen a few milliseconds from the user instead of a long round trip away.

Good jobs for the edge:

- **Rejecting bad requests early**: verify a token at the edge and return `401` without bothering the origin.
- **Redirects, A/B test assignment and localisation**: pick the language or experiment group from the user's country.
- **Routing**: send each user to the nearest healthy region.
- **Adding security headers** or rewriting URLs.

Here's an auth check written for Cloudflare Workers. It uses only web-standard APIs (`Request`, `Response`, Web Crypto via `jose`), so I could test it in Node by calling `fetch()` directly:

```js
// worker.js: runs at the edge. Rejects bad tokens before they reach the origin.
import { jwtVerify } from "jose";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return fetch(request);           // static files: pass through

    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return Response.json({ error: "missing token" }, { status: 401 });

    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"], issuer: "bitwise" });
      const headers = new Headers(request.headers);
      headers.set("x-user-id", String(payload.sub));                        // origin trusts this header only from the edge
      headers.set("x-country", request.cf?.country ?? "unknown");            // Cloudflare adds request.cf
      return fetch(new Request(request, { headers }));                       // forward to the origin
    } catch {
      return Response.json({ error: "invalid token" }, { status: 401 });
    }
  },
};
```

```text
no token       401 {"error":"missing token"}
forged token   401 {"error":"invalid token"}
valid token    200 {"origin":true,"user":"42"}
requests that reached the origin: 1
```

Two of the three requests never reached the origin. If the origin trusts `x-user-id`, it must only accept traffic from the edge, or anyone could send that header themselves.

Edge runtimes have limits: small memory (128 MB per Worker on Cloudflare), CPU-time limits per request, no local filesystem, and only some Node.js APIs. Platforms like Cloudflare Workers use V8 isolates, which start in milliseconds instead of booting a container. Your database usually still lives in one region, so edge code that queries it on every request can end up *slower*. Use the edge for fast decisions and caching; keep business logic and heavy data work at the origin.

## Asynchronous processing

The fastest work is work the user doesn't wait for. Take "invite a teammate": validating and saving the invitation takes about 100 ms, and sending the email through a provider takes about 300 ms more. The user only needs to know the invite was **saved**.

```js
import { Queue } from "bullmq";

const emails = new Queue("emails", { connection: { url: process.env.REDIS_URL } });

app.post("/teams/:id/invites", async (req, res) => {
  const invite = await invites.create(req.params.id, req.body.email);     // ~100 ms, must succeed now
  await emails.add("invite", { inviteId: invite.id }, {                   // ~1 ms, the email happens later
    attempts: 5,
    backoff: { type: "exponential", delay: 2_000 },
  });
  res.status(201).json(invite);
});
```

The response goes out after about 100 ms instead of 400 ms, and a separate worker process sends the email, retrying if the provider is down. If the email provider has an outage, invites still work.

Good candidates for background work: emails and notifications, image and video processing, report and export generation, webhook delivery, deleting an account's data, and anything calling a slow third-party API. The rule: **if the user doesn't need the result in this response, do it in the background.** [Chapter 10](/system-design/10-task-queues-and-background-jobs/) covers queues, workers, retries and idempotency in depth.

## Monoliths vs microservices

A **monolith** is one codebase deployed as one application: users, courses, payments and notifications all together. That's not a dirty word. A monolith is easy to develop, test, debug and deploy, a function call between modules takes nanoseconds and can't time out, and a database transaction can cover any operation. You can still scale it horizontally by running many copies behind a load balancer.

**Microservices** split the system into separately deployed services, each owning its own data. Their main benefit is **organisational**: many teams can work and deploy independently.

### When a monolith starts to hurt

- **Deploys get coupled.** With hundreds of engineers in one codebase, one team's broken change blocks everyone's release.
- **Scaling is all-or-nothing.** If video processing needs 40 machines and everything else needs 4, you still deploy the whole app 40 times.
- **One stack for everything.** Every part must use the same language and runtime, even where another would be much better.
- **One bug can take down everything**, because it all runs in the same process.

### What microservices cost

- **Network calls instead of function calls**: slower, and they fail in new ways (timeouts, partial failure, retries). See [Chapter 12](/system-design/12-error-handling-and-fault-tolerance/) and [Chapter 13](/system-design/13-grpc-and-inter-service-communication/).
- **Harder debugging**: one user action can cross many services, so you need distributed tracing ([Chapter 15](/system-design/15-logging-and-observability/)).
- **Data consistency**: no more single transaction across services; you need patterns such as sagas, outbox tables and eventual consistency.
- **Operations**: every service needs its own pipeline, monitoring, alerts, on-call and versioned API.

| Prefer a monolith when | Consider microservices when |
| --- | --- |
| a small or medium team (up to dozens of engineers) | many teams with clear, stable boundaries |
| you're building a new product and still learning the domain | the domain is well understood |
| scaling needs are similar across the app | one part needs very different scaling or technology |
| you want to move fast | coupled deploys are slowing teams down |
| | you have people experienced in running distributed systems |

> **Microservices are not a performance optimisation.** They add network hops. They solve a people-scaling problem. A well-built monolith running on several servers can serve millions of users.

A good middle path is the **modular monolith**: one deployable app, but split into modules with clear boundaries, where each module owns its tables and other modules only call its public functions. If one module later needs to become its own service, the boundary is already there.

```text
src/
  modules/
    courses/    index.ts (public API)  service.ts  repo.ts  routes.ts
    payments/   index.ts               service.ts  repo.ts  routes.ts
    users/      index.ts               ...
  shared/       db.ts  logger.ts  config.ts
```

## Serverless

With traditional servers you pay for machines all the time, whether they handle 500 requests per second or none, and you have to guess capacity in advance. **Serverless** platforms (AWS Lambda, Google Cloud Run functions, Vercel and Netlify functions, Cloudflare Workers) run your function only when a request or event arrives, scale the number of copies automatically, and bill for actual execution time.

### How it works

An API gateway or event source invokes your function. If no copy is ready, the platform starts one: it boots an isolated environment, loads the runtime and your code, then runs the handler. The copy stays warm for a while and handles later requests directly, until the platform shuts it down.

Code **outside** the handler runs once per copy, which is where you create database clients and load config:

```js
// handler.mjs: an AWS Lambda-style function. Code outside the handler runs once per cold start.
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });   // one connection per copy

export async function handler(event) {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM users");
  return { statusCode: 200, body: JSON.stringify({ users: rows[0].n }) };
}
```

Invoking it locally, the first call took 36 ms (loading the module and opening a database connection) and the next ones about 1 ms. On a real platform, a **cold start** also includes creating the environment and starting the runtime.

### Cold starts

Cold-start time depends heavily on the platform and language:

| Platform | How it isolates code | Typical cold start |
| --- | --- | --- |
| Cloudflare Workers | V8 isolates | a few milliseconds |
| AWS Lambda, Node.js or Python | Firecracker micro-VMs | usually a few hundred milliseconds |
| AWS Lambda, Java or .NET | micro-VM plus a heavier runtime | can exceed a second (snapshot features help) |

Smaller bundles, fewer dependencies loaded at startup, and keeping some copies warm ("provisioned concurrency") all reduce cold starts.

### The database connection trap

Every function copy opens its own connections. A traffic spike that starts 1,000 copies means 1,000 connections, far above Postgres's default limit of 100. Use a pool size of 1 per copy, put a pooler in front (RDS Proxy, PgBouncer, Supabase's pooler), or use a driver that talks over HTTP (like Neon's serverless driver).

### When serverless fits

| Good fit | Poor fit |
| --- | --- |
| event-driven jobs: file uploads, queue consumers, webhooks | latency-critical APIs where cold starts hurt |
| spiky or unpredictable traffic | long jobs (AWS Lambda stops at 15 minutes) |
| scheduled tasks | long-lived WebSocket connections |
| image and video pipelines | apps needing many persistent database connections |
| low-traffic APIs, prototypes | steady high traffic, where always-on servers cost less |

Serverless is a great tool for the right workload, not a replacement for servers. For a typical SaaS product with steady traffic, a few always-on containers with autoscaling are often simpler and cheaper.

## Scaling mental models

1. **Start with the problem, not the solution.** Every technique here solves a specific bottleneck. Measure first so you know which one you have.
2. **Prefer the simple option.** An index beats a cache. A bigger machine beats a sharded cluster. Every component you add is something else that can fail and that people must understand.
3. **Build for the scale you have, with headroom.** Most products never reach a million users. Designing for Netflix-scale on day one slows you down for traffic that may never come.
4. **Measure from day one.** Observability is the exception to "keep it simple": logs, metrics and traces pay off from the first deploy.
5. **Treat performance as a habit.** Systems change and traffic grows; keep watching, keep measuring, and fix what the data shows.

### A scaling playbook, in order

1. **Measure**: logs, metrics, traces and percentiles in place.
2. **Fix the database**: indexes, N+1 queries, connection pooling.
3. **Cache** hot reads.
4. **Move work to the background**: emails, uploads, reports.
5. **Use a CDN** for static files and public responses.
6. **Scale up**: a bigger machine, no code changes.
7. **Scale out**: stateless servers behind a load balancer with health checks.
8. **Scale the database**: read replicas, then partitioning, then sharding.
9. **Only then** reach for microservices, serverless or edge computing, if the problem calls for them.

## Quick revision

| Topic | Remember |
| --- | --- |
| Stateless | sessions, files, caches, jobs live outside the server |
| Algorithms | round robin, weighted, least connections, power of two, IP hash |
| L4 vs L7 | TCP forwarding vs HTTP-aware routing |
| Health checks | remove after N failures, re-add after N successes, slow start |
| Read replicas | primary writes, replicas read; async lag causes stale reads |
| Read-after-write | route recent writers to the primary, or track the WAL position |
| Partitioning | split a table inside one database; pruning; cheap drops |
| Sharding | split rows across databases; choose the shard key carefully |
| Consistent hashing | adding a shard moves ~1/n of keys instead of most |
| CDN | the speed of light is a hard floor; cache close to users |
| Edge | fast decisions near users; limited runtime; data still central |
| Async | if the user doesn't need it now, queue it |
| Microservices | for team scaling, not speed; consider a modular monolith |
| Serverless | pay per use, cold starts, connection limits, 15-minute cap on Lambda |

## Interview questions

1. Why must servers be stateless to scale horizontally? Name five kinds of state that need to move out.
2. You run a nightly report with `setInterval` and scale to 10 servers. What happens, and how do you fix it?
3. Compare round robin, least connections and IP hash. Which would you choose for an API with very uneven request costs?
4. What is the difference between layer 4 and layer 7 load balancing?
5. How do health checks work, and why require several failures before removing a server?
6. How do read replicas help? What is replication lag and what bug does it cause?
7. Describe two ways to give users read-after-write consistency with replicas.
8. What is the difference between partitioning and sharding?
9. How would you choose a shard key for an e-commerce orders table? What makes a shard "hot"?
10. Explain consistent hashing. Why is it better than `hash(key) % n` when adding shards?
11. Why does a CDN help even if your servers are fast? What should and shouldn't be cached on one?
12. What does `s-maxage` do, and how is it different from `max-age`?
13. What kinds of logic suit edge computing, and what are its limits?
14. Which tasks would you move to a background queue, and why?
15. When would you choose microservices over a monolith? What is a modular monolith?
16. What is a cold start? How do serverless functions cause database connection problems, and how do you avoid them?
17. Walk through the order in which you'd scale a growing web app.

## Further reading

- [Designing Data-Intensive Applications](https://dataintensive.net/) by Martin Kleppmann (replication, partitioning, consistency)
- [PostgreSQL: Table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) and [High availability and replication](https://www.postgresql.org/docs/current/high-availability.html)
- [AWS Builders' Library](https://aws.amazon.com/builders-library/) (load balancing, timeouts, retries)
- [Cloudflare Learning Center: What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- [Martin Fowler: Monolith first](https://martinfowler.com/bliki/MonolithFirst.html) and [Microservice trade-offs](https://martinfowler.com/articles/microservice-trade-offs.html)
- [Cloudflare Workers docs](https://developers.cloudflare.com/workers/) and [AWS Lambda docs](https://docs.aws.amazon.com/lambda/)

Next: [Chapter 20, Concurrency and Parallelism](/system-design/20-concurrency-and-parallelism/).
