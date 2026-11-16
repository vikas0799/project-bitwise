---
title: Scaling and Performance, Part 1
description: How to measure speed and make a backend faster. Latency percentiles, throughput, utilization and queueing, finding the real bottleneck, profiling and flame graphs, event-loop blocking in Node.js, N+1 queries, composite and covering indexes, connection pooling, tiered caching and hit rate, vertical vs horizontal scaling, the cluster module and load balancing with Nginx, all with measured results.
author: Bitwise School
---

"Make it faster" is one of the most common requests a backend engineer gets, and one of the easiest to get wrong. Teams add Redis, buy bigger servers or rewrite services, and the system is still slow because they fixed something that wasn't the problem.

This chapter is about doing it properly: **define what fast means, measure where the time goes, fix the biggest cost, then measure again.** Every number in this chapter comes from a real run: load tests with autocannon, a blocked event loop, a Node cluster, Postgres query plans and an Nginx load balancer.

## What does "fast" mean?

"The API feels slow" isn't something you can fix. You need numbers, and there are three that matter:

| Metric | Question it answers | Unit |
| --- | --- | --- |
| **Latency** | How long does one request take? | milliseconds |
| **Throughput** | How many requests can the system finish per second? | requests/second |
| **Utilization** | How busy are the resources (CPU, connections, disk)? | percent |

They're linked. Push throughput up and utilization rises; push utilization too high and latency explodes. Most of performance engineering is understanding that relationship.

## Latency: why averages lie

Latency is the time from the client sending a request to receiving the full response. It includes the network, any queueing, your code, the database and serialising the response.

The obvious way to summarise latency is the average. It's also misleading. Here are 1,000 simulated requests where most take around 40 ms but 2% hit a slow path (a cold cache, a lock, a garbage-collection pause):

```js
// pct.mjs: why the average hides the slow requests
function percentile(samples, p) {
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;   // nearest-rank method
  return sorted[Math.max(0, index)];
}

// 1,000 requests: most take ~40 ms, 2% hit a slow path
const latencies = Array.from({ length: 1000 }, (_, i) => (i % 50 === 0 ? 2000 : 35 + (i % 11)));
const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

console.log("average:", Math.round(avg), "ms");
for (const p of [50, 90, 95, 99]) console.log(`p${p}:`, percentile(latencies, p), "ms");
```

```text
average: 79 ms
p50: 40 ms
p90: 45 ms
p95: 45 ms
p99: 2000 ms
```

The average says 79 ms, a number that **no request actually took**. Typical users see 40 ms, and one user in fifty waits two full seconds. The average blurs both facts into one useless number.

### Percentiles: P50, P90, P99

A percentile tells you what fraction of requests were at least that fast:

- **P50 (the median)**: half the requests were faster than this. It's the "typical" experience.
- **P90**: 90% were faster; 1 in 10 was slower.
- **P99**: 99% were faster; 1 in 100 was slower. This is your **tail latency**.

Teams usually set targets on P95 or P99, for example "P99 under 300 ms". Why care about 1%?

- **1% is a lot of people.** At 1,000 requests per second, 1% is 600 slow requests every minute.
- **Your heaviest users hit the tail most.** The customer with 5,000 orders or the biggest cart triggers the slowest queries, and they're often your most valuable users.
- **Tails multiply.** If one page load makes 10 backend calls in parallel, the page is as slow as the slowest call. The chance that at least one of the 10 lands in its P99 is `1 − 0.99¹⁰ ≈ 10%`. With 100 calls it's 63%. The rare slow request becomes the common slow page.

### Measuring percentiles

You don't compute percentiles by hand in production. Two common ways:

- **In the service**: record every request duration in a **histogram** metric (the `http_request_duration_seconds` histogram from [Chapter 15](/system-design/15-logging-and-observability/)), and let Prometheus calculate `histogram_quantile(0.99, ...)` across all instances.
- **In a load test**: tools like [autocannon](https://github.com/mcollina/autocannon) and [k6](https://k6.io/) report P50/P90/P99 for you.

```bash
npx autocannon -c 50 -d 10 http://localhost:3000/courses
```

`-c 50` keeps 50 connections busy and `-d 10` runs for 10 seconds. Never average percentiles across servers ("the mean of each server's P99" isn't a P99); merge the histograms instead.

## Throughput and the latency curve

Throughput is how many requests the system completes per second. Latency and throughput look independent, but they aren't. To see how they interact, I load-tested two Express endpoints on one Node process:

```js
const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };   // pure CPU work
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

app.get("/io", async (req, res) => { await sleep(20); res.json({ ok: true }); });   // waiting on "the database"
app.get("/cpu", (req, res) => { busy(5); res.json({ ok: true }); });                  // 5 ms of computation
```

`/io` waits 20 ms the way a database call does: the process is idle while it waits. `/cpu` keeps the CPU busy for 5 ms, like hashing a password or building a big report. I ran autocannon for 4 seconds at increasing concurrency:

| Connections | `/io` req/s | `/io` P50 | `/io` P99 | `/cpu` req/s | `/cpu` P50 | `/cpu` P99 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 48 | 20 ms | 21 ms | 188 | 5 ms | 5 ms |
| 10 | 469 | 21 ms | 24 ms | 191 | 52 ms | 58 ms |
| 50 | 2,260 | 21 ms | 27 ms | 188 | 207 ms | 2,744 ms |
| 200 | 8,056 | 23 ms | 36 ms | 182 | 204 ms | 3,199 ms |

Two very different shapes:

- **`/io` scales almost perfectly.** More connections means more throughput while latency stays near 20 ms, because Node handles thousands of requests that are all *waiting* at the same time.
- **`/cpu` hits a wall at about 190 req/s.** One core can do 5 ms of work about 200 times a second, and no amount of extra traffic changes that. Once the core is saturated, throughput stops growing and the extra requests **queue**. P50 jumps from 5 ms to 200 ms and P99 to over 3 seconds.

That's the general rule for every system: throughput grows with load until some resource saturates, then it flattens and **latency climbs steeply**. The point where that happens is your real capacity.

### Little's law

A useful formula connects the three numbers:

> **requests in flight = throughput × latency**

At 200 connections, `/io` had about 200 requests in flight with a latency of about 25 ms, so the throughput has to be `200 / 0.025 s = 8,000 req/s`, which is almost exactly what autocannon measured. For `/cpu`, 50 requests in flight at 188 req/s means each one spends about `50 / 188 ≈ 0.27 s` in the system, mostly waiting in the queue.

You can use it backwards too. If you need 2,000 req/s and each request takes 50 ms, you need at least 100 requests in flight at once, so 100 database connections or worker slots somewhere.

## Utilization and queueing

Why does latency explode instead of growing gently? Because of **queueing**.

Picture a chai stall with one person making tea. Each cup takes one minute. If a customer arrives every two minutes, the stall is 50% busy and nobody waits. If customers arrive every 70 seconds, it's 85% busy, and any small burst (three people arriving together) creates a line that takes a long time to clear. At 100% busy, the line only grows.

Roads work the same way. A highway at half capacity flows at full speed. Add cars until it's 90% full and one driver tapping the brakes causes a jam that lasts long after the cause is gone.

Queueing theory puts a number on it. For a simple single-server queue with random arrivals, the average time a request spends in the system is:

> **time = service time / (1 − utilization)**

![Average time per request rising slowly up to about 70 percent utilization and then sharply as utilization approaches 100 percent](/images/system-design/utilization-curve.svg "The work stays 10 ms. Everything above that is waiting.")

With 10 ms of real work, 50% utilization gives about 20 ms, 90% gives 100 ms and 95% gives 200 ms. The request didn't get more expensive; it spent longer in the line.

That's why experienced teams **don't run servers at 95% CPU to save money**. A target of roughly **60–80% utilization** at peak leaves room for bursts, deploys and a server failing. When a dashboard shows CPU creeping above 80%, it's time to add capacity, before the latency graph goes vertical.

## Finding the real bottleneck

When a system is slow, one specific thing is usually responsible: the **bottleneck**. Making anything else faster barely helps. If a request spends 500 ms in one call and 10 ms everywhere else, halving the 10 ms saves 5 ms.

### Guessing is expensive

Here's a story that plays out in real teams. `GET /courses/:id` is slow. Everyone agrees "it must be the database", so someone spends a week adding a Redis cache in front of the query. It ships. The endpoint is still slow.

Then someone finally measures each step. The database query took 10 ms. The new Redis lookup takes 2 ms. But the handler also sends an audit log **synchronously** to a remote logging service and waits for its reply, and that takes 300 ms. The database was never the problem; a week went into the wrong fix.

> **Never guess. Measure, then fix the biggest number.**

Bottlenecks that hide well:

- synchronous calls to remote services (logging, analytics, emails) inside the request
- external API calls in a loop
- serialising or compressing very large JSON responses
- N+1 queries and missing indexes
- middleware that runs on every request and does more than it should
- CPU-heavy work (hashing, image resizing, PDF generation) on the request path

### Timing middleware

The first measurement to add is a per-request timer, so you know *which* endpoints are slow:

```js
// Log how long every request took, from start to the last byte sent.
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const line = { method: req.method, route: req.route?.path ?? req.path, status: res.statusCode, ms: +ms.toFixed(1) };
    if (ms > 200) console.warn("slow request", line);
    else console.log("request", line);
  });
  next();
});
```

```text
slow request { method: 'GET', route: '/products/:id', status: 200, ms: 314.1 }
```

Log the **route pattern** (`/products/:id`), not the raw URL, so all product requests group together. In production this line goes to your structured logger and the duration into a histogram.

### Timing the stages inside a request

Knowing an endpoint takes 314 ms isn't enough; you need to know which step inside it. The standard [`Server-Timing`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing) header lets you send a breakdown that browser DevTools display in the Network tab:

```js
app.get("/products/:id", async (req, res) => {
  const stages = [];
  const timed = async (name, fn) => {
    const t = performance.now();
    try { return await fn(); } finally { stages.push(`${name};dur=${(performance.now() - t).toFixed(1)}`); }
  };

  const product = await timed("db", () => db.findProduct(req.params.id));
  await timed("log", () => auditLog.send({ productId: req.params.id }));
  res.set("Server-Timing", stages.join(", ")).json(product);
});
```

```text
server-timing: db;dur=10.5, log;dur=299.9
```

There's the culprit: the audit log, not the database. The fix is to stop waiting for it: write logs to stdout and let a log shipper send them, or push the event onto a queue ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)). Expose detailed timings only to internal users, since they reveal how your backend works.

## Profiling and flame graphs

Timers tell you *which step* is slow. When the slow step is your own code, a **profiler** tells you *which function*.

A sampling profiler interrupts your program thousands of times per second and records the current call stack each time. Functions that show up in many samples are where the time goes. The results are drawn as a **flame graph**:

- each bar is a function; the bars above it are the functions it called
- the **width** of a bar is the share of samples it appeared in, so wide means expensive
- the x-axis isn't time order; bars are sorted alphabetically or by size

Look for **wide plateaus near the top**: functions that use a lot of CPU themselves rather than through children.

### Profiling Node.js

Node has a CPU profiler built in:

```bash
node --cpu-prof --cpu-prof-dir=profiles server.js
```

When the process exits, it writes a `.cpuprofile` file. Drag it into the **Performance** panel of Chrome DevTools, or onto [speedscope.app](https://www.speedscope.app/), to see the flame graph. Profiling a small script that slugifies 200,000 course titles gave this self-time breakdown:

```text
slugify: 136 ms
(garbage collector): 104 ms
buildReport: 18 ms
RegExp: [^\w\s-]: 11 ms
```

Nearly half the time was the garbage collector cleaning up temporary strings, which is a hint to create fewer intermediate objects. Other options: `node --inspect server.js` and open `chrome://inspect` to profile a running server while you send load at it, or `npx 0x server.js` to get an interactive flame graph as an HTML file.

Profile under realistic load, and profile a production build: a profile of an idle server shows nothing useful.

### CPU-bound vs I/O-bound

Before optimising anything, work out which kind of slow you have:

| | CPU-bound | I/O-bound |
| --- | --- | --- |
| Time goes to | computing (loops, hashing, parsing, compression) | waiting (database, network, disk) |
| CPU usage | high | low, even though requests are slow |
| Profiler shows | wide bars in your own functions | mostly idle |
| Fix | better algorithms, less work, more cores | fewer round trips, indexes, caching, parallel calls |

### Why CPU-bound work hurts Node.js so much

Node runs your JavaScript on **one thread**. While a handler is computing, the event loop can't do anything else: it can't accept connections, run other handlers or even fire timers. One slow synchronous request makes **every** request slow.

To measure this honestly, I ran the server in its own process and timed a trivial endpoint while an 800 ms synchronous report was running:

```js
import express from "express";
import { monitorEventLoopDelay } from "node:perf_hooks";

const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };
const loopDelay = monitorEventLoopDelay({ resolution: 10 });
loopDelay.enable();

const app = express();
app.get("/fast", (req, res) => res.json({ ok: true }));
app.get("/report", (req, res) => { busy(800); res.json({ ok: true }); });   // heavy synchronous work
app.get("/loop-delay", (req, res) => { res.json({ maxMs: Math.round(loopDelay.max / 1e6) }); loopDelay.reset(); });
app.listen(3000);
```

```text
/fast alone: 4 ms
/fast while /report is running: 753 ms
/report took: 803 ms
```

A request that does nothing took 753 ms because it had to wait for the report to finish. `monitorEventLoopDelay` makes this visible in production: it measures how late the event loop is running. In a standalone test, a 500 ms block showed up as a maximum delay of 510 ms. Export it as a metric and alert when the P99 delay goes above, say, 100 ms.

The fixes: break big jobs into chunks, move them to a background queue ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)), or run them on another thread with `worker_threads` ([Chapter 20](/system-design/20-concurrency-and-parallelism/)). Using all your CPU cores is covered later in this chapter.

## Distributed tracing

In a system with several services, the slow part might not be in the service you're looking at. A **trace** follows one request across every service, queue and database it touches and shows each step as a bar on a timeline. You can see at a glance that `orders` waited 400 ms on `payments`, which waited 380 ms on a third-party API.

Setting up OpenTelemetry and reading trace waterfalls is covered in [Chapter 15](/system-design/15-logging-and-observability/). For performance work, traces are often the fastest way to find the bottleneck, because they show both the slow span and the N+1 pattern of many small spans in a row.

## Database bottlenecks

In most web backends, the database is where the time goes. Three problems cause most of the pain.

### The N+1 query problem

Loading a list, then running one more query per item: 1 query for 50 courses, then 50 queries for their instructors. Each query is fast, but 51 round trips add up, and the number grows with the data. On a trace it looks like a staircase of tiny identical spans.

The fix is to fetch related rows in **one** query, with a `JOIN` or `WHERE instructor_id = ANY($1)`, then match them up in code. ORMs do this with eager loading (`include`, `with`, `populate`). The full example is in [Chapter 8](/system-design/08-databases/).

### Indexes and query plans

Without an index, the database has to read every row to find matches: a **sequential scan**. An index is a sorted structure (usually a B-tree) that lets it jump straight to the rows it needs, like the index at the back of a textbook instead of reading every page.

To see it in action, I loaded 200,000 orders into Postgres and asked for one user's 10 most recent paid orders:

```sql
SELECT created_at, total FROM orders
WHERE user_id = 42 AND status = 'paid'
ORDER BY created_at DESC LIMIT 10;
```

`EXPLAIN ANALYZE` runs the query and shows what the database actually did. With no index:

```text
Limit (actual time=15.223..15.239 rows=10 loops=1)
  ->  Sort (actual time=15.218..15.224 rows=10 loops=1)
        Sort Key: created_at DESC
        ->  Seq Scan on orders (actual time=0.127..15.043 rows=96 loops=1)
              Filter: ((user_id = 42) AND (status = 'paid'::text))
              Rows Removed by Filter: 199904
Execution Time: 15.327 ms
```

It read all 200,000 rows, threw away 199,904, then sorted the rest. Fifteen milliseconds sounds fine until this runs 500 times a second, or the table has 50 million rows.

**A composite index** covers several columns in a chosen order. Put the equality filters first and the sort column last:

```sql
CREATE INDEX orders_user_status_created ON orders (user_id, status, created_at DESC);
```

```text
Limit (actual time=0.168..0.194 rows=10 loops=1)
  ->  Index Scan using orders_user_status_created on orders
        Index Cond: ((user_id = 42) AND (status = 'paid'::text))
Execution Time: 0.220 ms
```

About 70× faster, and the `Sort` step disappeared: the index already stores the rows in `created_at DESC` order, so Postgres reads the first 10 entries and stops.

Column order matters. This index also helps queries on `user_id` alone or on `user_id` and `status`, but not a query on `status` alone, just as a phone book sorted by surname can't find everyone called "Asha".

**A covering index** also stores the columns the query *returns*, so Postgres doesn't need to visit the table at all:

```sql
CREATE INDEX orders_covering ON orders (user_id, status, created_at DESC) INCLUDE (total);
```

```text
Limit (actual time=0.154..0.166 rows=10 loops=1)
  ->  Index Only Scan using orders_covering on orders
        Index Cond: ((user_id = 42) AND (status = 'paid'::text))
        Heap Fetches: 0
```

`Index Only Scan` with `Heap Fetches: 0` means the answer came straight from the index. It's worth it for very hot queries; for most, a plain composite index is enough.

**Indexes aren't free.** Every insert, update and delete has to update every index on the table. Inserting the same 200,000 rows took about 860 ms with just the primary key and about 2,300–2,800 ms with three extra indexes, roughly three times slower. Indexes also take disk space and memory. Index the queries you actually run (your slow-query log and `pg_stat_statements` will tell you which), and drop indexes nothing uses.

When reading a plan, look for:

- `Seq Scan` on a large table with a selective `Filter`
- a big gap between estimated `rows` and actual `rows` (stale statistics; run `ANALYZE`)
- `Rows Removed by Filter` far larger than the rows returned
- `Sort` or `Hash` steps that spill to disk

### Connection pooling

Opening a database connection is slow and expensive: a TCP handshake, TLS negotiation, authentication, and a new backend process on the Postgres server using several megabytes of memory. Doing that for every query costs tens of milliseconds each time.

It also runs into a hard limit. Postgres allows `max_connections` (100 by default). Under a traffic spike, an app that opens a connection per request runs out, and new requests start failing.

A **connection pool** opens a set of connections once and lends them out: a request borrows one, runs its query and gives it back. With `pg` in Node.js:

```js
import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                          // per process; see the maths below
  idleTimeoutMillis: 30_000,        // close connections nobody has used for 30 s
  connectionTimeoutMillis: 2_000,   // if no connection is free within 2 s, fail instead of hanging
  maxLifetimeSeconds: 30 * 60,      // replace each connection every 30 min
});

pool.on("error", (err) => console.error("idle client error", err));   // don't crash on a dropped idle connection
```

The trap is **multiplication**. A pool lives inside each process. Six instances with `max: 20` can open 120 connections, already over the default limit of 100, and autoscaling or a cluster of workers per machine can multiply that again. Always calculate:

> **instances × processes per instance × pool size < database connection limit** (with room for migrations, admin tools and cron jobs)

Two places a pool can live:

| | Internal pool (in each process) | External pool (PgBouncer, PgCat, RDS Proxy) |
| --- | --- | --- |
| Where | inside your app, e.g. `pg.Pool` | a separate service between apps and the database |
| Total connections | grows with every instance you add | capped in one place, shared by everyone |
| Setup | none, comes with the driver | another component to run and monitor |
| Good for | a few instances | many instances, autoscaling, serverless |

Most production setups use both: a small pool in each process talking to PgBouncer, which keeps a fixed number of real connections to Postgres. In PgBouncer's **transaction mode**, a real connection is only held for the length of a transaction, so session-level features such as `SET` or advisory locks don't carry over between queries.

More connections isn't faster. Past a certain point, Postgres spends its time switching between connections instead of running queries. A pool of a few dozen real connections often serves thousands of requests per second.

## Caching for performance

The fastest query is the one you don't run. [Chapter 9](/system-design/09-caching/) covers caching in depth; here's what matters for performance.

### Local vs distributed caches

- A **local cache** lives in the process's memory. Reads take microseconds, with no network involved. But each server has its own copy, so servers can disagree, and the cache is empty after every restart or deploy.
- A **distributed cache** (Redis, Memcached) is shared by every server. It's consistent across the fleet and survives deploys, but every read is a network round trip of roughly a millisecond.

### Tiered caching

You can combine them: check process memory first, then Redis, then the database.

```js
import { LRUCache } from "lru-cache";
import { createClient } from "redis";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();
const local = new LRUCache({ max: 5_000, ttl: 30_000 });   // L1: this process only, 30 s

// Tiered read: process memory first, then Redis, then the database.
async function getCourse(id) {
  const key = `course:${id}`;
  const hot = local.get(key);
  if (hot) return hot;

  const cached = await redis.get(key);
  if (cached) { const value = JSON.parse(cached); local.set(key, value); return value; }

  const value = await loadCourseFromDb(id);
  await redis.set(key, JSON.stringify(value), { EX: 300 });   // L2: shared, 5 min
  local.set(key, value);
  return value;
}
```

Running a short sequence of reads, then clearing the local cache to simulate a second server, gave `{ l1: 4, l2: 1, db: 2 }`: the "new server" got its data from Redis instead of the database. Keep the local TTL **short**, because you can't easily invalidate the copies in every process. Use L1 for data that's read constantly and can be a few seconds stale, such as configuration, feature flags or a popular course page.

### Invalidation

Cached data goes stale when the source changes. Two ways to handle it:

- **Time-based (TTL)**: every entry expires after a set time. Simple and self-healing, but data can be stale for up to one TTL.
- **Event-based**: when data changes, delete or update its cache keys right away (in the same code that writes, or from a change event). Fresher, but you must find every key affected by a change, and missing one causes confusing bugs.

Most systems combine them: delete on write for correctness, plus a TTL as a safety net for anything the invalidation missed.

### Patterns

- **Cache-aside (lazy loading)**: the app checks the cache, loads from the database on a miss and fills the cache. The most common pattern, and what the code above does.
- **Write-through**: every write goes to the database and the cache together. Reads are always warm, but writes are slower, and you cache data nobody may read.
- **Write-behind (write-back)**: writes go to the cache and are saved to the database later in batches. Very fast writes, but if the cache dies before flushing, the data is lost. Only use it for data you can afford to lose, like view counters.

### Hit rate

The number that tells you whether a cache is earning its keep:

> **hit rate = hits / (hits + misses)**

A 90% hit rate means only 1 request in 10 reaches the database. For typical web workloads, **70–95%** is healthy. Below about 50%, the cache is adding a network hop to most requests without saving much, so revisit your keys and TTLs.

What moves the hit rate:

- **TTL**: longer TTLs mean more hits but staler data.
- **Size**: a cache too small for the hot data evicts entries before they're reused.
- **Access pattern**: caching works brilliantly when a small set of items gets most of the traffic (popular courses, the home page) and poorly when every request asks for something different.
- **Key design**: putting a timestamp or a full query string in a key can make every key unique, giving a 0% hit rate.
- **Eviction policy**: LRU suits most workloads; LFU is better when a stable set of items stays popular for a long time.

Track hits and misses as metrics. A sudden drop in hit rate usually means a deploy changed key formats or someone flushed the cache, and the database is about to feel it.

## Vertical vs horizontal scaling

When a well-optimised system still can't keep up, you need more hardware. There are two directions.

![Vertical scaling replaces a small server with a bigger one, while horizontal scaling puts several stateless servers behind a load balancer](/images/system-design/scale-up-vs-out.svg "Scaling up buys a bigger box. Scaling out adds more boxes.")

**Vertical scaling (scaling up)** means a bigger machine: more CPU cores, more RAM, faster disks. It's attractive because nothing in your code changes, there's nothing new to operate, and a single large database server can go remarkably far. But there's always a biggest machine you can buy, prices climb steeply near the top, upgrading often means downtime, and it's still **one machine**: when it fails, everything fails.

**Horizontal scaling (scaling out)** means more machines of a normal size working together. There's no fixed ceiling, one server failing just lowers capacity, and you can place servers in several regions close to users. The price is distributed-systems complexity:

- **Something must spread the requests**: a load balancer.
- **State must live outside the servers.** If a login session is stored in server 1's memory, server 2 doesn't know about it. Keep sessions in Redis or use tokens ([Chapter 4](/system-design/04-authentication-and-authorization/)), store uploads in object storage, and keep caches that must be consistent in a shared cache.
- **Failures are partial.** A server can be slow rather than dead, or the network between two servers can fail while both keep running.
- **You need health checks** to notice a broken server and stop sending it traffic.

| | Vertical | Horizontal |
| --- | --- | --- |
| Code changes | none | servers must be stateless |
| Ceiling | the biggest machine available | very high |
| Failure | one machine takes everything down | absorbs individual failures |
| Operations | simple | load balancer, health checks, deploys across many machines |
| Typical use | databases, early-stage apps | stateless API servers, workers |

The usual path: scale up first because it's simple, make your API servers stateless early, then scale those out. Databases are harder to scale out; that's the subject of [Part 2](/system-design/19-scaling-and-performance-part-2/).

### Scaling out on one machine: Node's cluster module

A single Node process uses one CPU core for your JavaScript. On an 8-core server, that wastes seven cores. The built-in `cluster` module starts one worker process per core, all sharing the same port:

```js
// cluster.mjs: one Node process per CPU core, all sharing port 3000.
import cluster from "node:cluster";
import os from "node:os";
import http from "node:http";

const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };
const workers = Number(process.env.WORKERS ?? os.availableParallelism());

if (cluster.isPrimary) {
  for (let i = 0; i < workers; i++) cluster.fork();
  cluster.on("exit", (worker, code) => {
    console.log(`worker ${worker.process.pid} exited (${code}), starting a new one`);
    cluster.fork();   // keep the pool full if a worker crashes
  });
} else {
  http.createServer((req, res) => { busy(5); res.end("ok"); }).listen(3000);   // 5 ms of CPU per request
}
```

The same CPU-heavy endpoint as before, load-tested with 50 connections:

| Workers | Throughput | P50 | P99 |
| ---: | ---: | ---: | ---: |
| 1 | 190 req/s | 167 ms | 3,168 ms |
| 4 | 757 req/s | 64 ms | 123 ms |

Four workers gave four times the throughput, and P99 fell from over 3 seconds to 123 ms because requests no longer queued behind each other. The workers are separate processes, so they **share nothing in memory**: in-process caches, counters and sessions exist once per worker, which is another reason to keep state in Redis or the database.

In practice you rarely write this by hand. **PM2** does it with `pm2 start server.js -i max`, and in containers the usual approach is one Node process per container and more containers ([Chapter 21](/system-design/21-docker-k8s-and-ci-cd/)).

## Load balancing

Once there's more than one server, a **load balancer** sits in front of them, receives every request and forwards each one to a healthy backend. It's also where you terminate TLS and the one address clients need to know.

### Algorithms

| Algorithm | How it picks | Good for |
| --- | --- | --- |
| **Round robin** | next server in the list, in turn | servers of equal size, similar requests |
| **Weighted round robin** | like round robin, but bigger servers get proportionally more | mixed server sizes, gradual rollouts |
| **Least connections** | the server with the fewest active requests | requests of very different lengths |
| **IP hash** | a hash of the client's IP, so the same client gets the same server | "sticky sessions" when servers hold state |

Least connections is a good default for APIs, because one slow request doesn't cause a pile-up on one server. Avoid relying on IP hash: it spreads load unevenly (a whole office can share one IP), and every server you add or remove moves clients around. Make servers stateless instead.

### Nginx as a load balancer

This configuration balances three Node instances. I tested it with three servers on ports 4001–4003:

```nginx
upstream course_api {
    least_conn;
    server 127.0.0.1:4001 max_fails=2 fail_timeout=10s;
    server 127.0.0.1:4002 max_fails=2 fail_timeout=10s;
    server 127.0.0.1:4003 max_fails=2 fail_timeout=10s;
    keepalive 32;                      # reuse connections to the backends
}

server {
    listen 80;

    location / {
        proxy_pass http://course_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";          # needed for upstream keepalive
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 2s;
        proxy_read_timeout 30s;
        proxy_next_upstream error timeout http_502 http_503;   # retry another server on failure
    }
}
```

Requests went to 4001, 4002 and 4003 in turn. Then I killed the server on 4002 in the middle of the test: **every request still returned 200**. Nginx got a connection error from 4002, retried the request on another server (`proxy_next_upstream`), and after two failures (`max_fails=2`) stopped sending traffic there for 10 seconds before trying again.

Behind a proxy, your app sees Nginx's IP instead of the user's. Tell Express to trust the proxy so `req.ip` and `req.protocol` use the forwarded headers: `app.set("trust proxy", 1)`. Rate limiting by IP ([Chapter 17](/system-design/17-backend-security/)) depends on this.

Be careful with automatic retries: retrying a request that timed out can run it **twice**. Nginx doesn't retry `POST` and other non-idempotent requests by default for this reason. Idempotency keys ([Chapter 1](/system-design/01-http-and-cors/)) make retries safe.

### Health checks

Nginx's `max_fails` is a **passive** check: it notices failures in real traffic, which means some real requests fail first. **Active** checks send a probe, typically `GET /health`, to every server every few seconds and remove a server as soon as it stops answering. Cloud load balancers, HAProxy, NGINX Plus and Kubernetes readiness probes all do active checks.

A useful health endpoint checks the dependencies the server can't work without, and answers quickly even when they hang:

```js
// Reject if a promise takes longer than `ms`, so a hung dependency can't hang the health check.
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms).unref())]);

app.get("/health", async (req, res) => {
  try {
    await withTimeout(pool.query("SELECT 1"), 1000);
    res.json({ status: "ok" });
  } catch (err) {
    res.status(503).json({ status: "unavailable", reason: err.message });
  }
});
```

```text
/health 200 {"status":"ok"}
/health 503 {"status":"unavailable","reason":"timed out after 1000 ms"}   ← database not responding
```

Keep health checks cheap, since they run constantly on every server. Be careful what you include: if every server reports unhealthy because a shared dependency is down, the load balancer may remove all of them at once and turn a partial outage into a total one. That's why Kubernetes separates **liveness** (restart me if I'm stuck) from **readiness** (don't send me traffic right now), as described in [Chapter 16](/system-design/16-graceful-shutdown/).

## Key principles

1. **Measure before you change anything.** Guessed fixes waste weeks.
2. **Track percentiles, not averages.** Set targets on P95 or P99.
3. **Latency explodes near saturation.** Plan for 60–80% utilization at peak.
4. **Find the single biggest cost** with timers, traces and profilers, fix it, then measure again.
5. **Keep CPU-heavy work off Node's event loop**, and use every core.
6. **Fix the database first**: N+1 queries, missing indexes and connection limits cause most slowness.
7. **Cache what's read often and changes rarely**, and watch the hit rate.
8. **Scale up while it's simple; scale out stateless services** behind a load balancer with health checks.

## Quick revision

| Topic | Remember |
| --- | --- |
| Latency | report P50/P95/P99; averages hide the slow tail |
| Tail at scale | a page making many calls hits someone's P99 often |
| Throughput | grows with load until a resource saturates, then flattens |
| Little's law | in flight = throughput × latency |
| Utilization | time ≈ service time / (1 − utilization); aim for 60–80% |
| Bottlenecks | never guess; timing middleware, `Server-Timing`, traces |
| Profiling | `node --cpu-prof`, DevTools, flame graph width = cost |
| Event loop | sync work blocks every request; watch `monitorEventLoopDelay` |
| N+1 | batch with `JOIN` or `ANY($1)` |
| Indexes | composite (equality first, sort last), covering with `INCLUDE`, slower writes |
| Pooling | instances × pool size < `max_connections`; PgBouncer for many instances |
| Caching | tiered L1/L2, TTL + delete on write, hit rate 70–95% |
| Scaling | vertical = simple with a ceiling; horizontal = stateless + load balancer |
| Load balancing | least connections; `proxy_next_upstream`; active health checks |

## Interview questions

1. Why is average latency a poor metric? What do P50 and P99 tell you?
2. A page makes 20 parallel backend calls. Why does it feel slow even though each service's P99 looks fine?
3. Explain the relationship between throughput and latency as load increases.
4. Why does latency rise sharply as utilization approaches 100%? What utilization would you target?
5. State Little's law and use it to estimate how many database connections you need for 1,000 req/s at 40 ms per request.
6. An endpoint is slow. Walk through how you'd find the cause before changing any code.
7. What is a flame graph and how do you read it?
8. What's the difference between CPU-bound and I/O-bound work? Why is CPU-bound work especially harmful in Node.js?
9. What is the N+1 query problem and how do you detect and fix it?
10. How would you design an index for `WHERE user_id = ? AND status = ? ORDER BY created_at DESC`? What is a covering index?
11. Why not index every column?
12. Why use a connection pool? How can a pool size of 20 still exhaust the database?
13. Compare local, distributed and tiered caching. What's a healthy cache hit rate?
14. Compare vertical and horizontal scaling. What must change in an app before you can scale it horizontally?
15. How does Node's `cluster` module help, and what doesn't it share between workers?
16. Compare round robin, least connections and IP hash load balancing.
17. What should a health check endpoint check? What can go wrong if it checks too much?

## Further reading

- [Brendan Gregg: Flame Graphs](https://www.brendangregg.com/flamegraphs.html)
- [Node.js: Flame graphs](https://nodejs.org/en/learn/diagnostics/flame-graphs) and [Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/) by Jeffrey Dean and Luiz André Barroso
- [Use The Index, Luke](https://use-the-index-luke.com/), a free guide to SQL indexing
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) and [PgBouncer](https://www.pgbouncer.org/)
- [NGINX: HTTP load balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [autocannon](https://github.com/mcollina/autocannon) and [k6](https://k6.io/) for load testing

Next: [Chapter 19, Scaling and Performance, Part 2](/system-design/19-scaling-and-performance-part-2/).
