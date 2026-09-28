---
title: System Design Basics
description: A framework for system design interviews, plus scaling, load balancing, caching, databases, sharding, queues, rate limiting and a full URL-shortener walkthrough.
author: Bitwise School
---

System design interviews test whether you can turn a vague problem ("design Instagram") into a system that works at scale, and explain the trade-offs. There is rarely one right answer. Clear thinking matters more than buzzwords.

## A framework for the interview

1. **Clarify requirements (5 min)**
   - Functional: what must the system do? ("users can shorten a URL and get redirected")
   - Non-functional: scale, latency, availability, consistency, durability.
2. **Estimate (5 min)**: users, requests per second, storage and bandwidth.
3. **Define the API**: the main endpoints and their inputs and outputs.
4. **Design the data model**: entities, relationships, and SQL or NoSQL.
5. **Draw the high-level design**: clients, load balancer, services, cache, database, queues.
6. **Deep dive**: pick two or three hard parts (hot keys, consistency, fan-out) and go deeper.
7. **Discuss trade-offs and bottlenecks**: single points of failure, what breaks at 10x scale, and what you would monitor.

## Back-of-the-envelope estimates

- 1 day ≈ 86,400 seconds, roughly **10^5 s** for quick maths.
- Average QPS = requests per day ÷ 86,400. Peak is often 2–3 times the average.
- Example: 10 million users, each posting once a day, 1 KB per post, gives 10 GB per day, about **3.65 TB per year**.

Latency numbers worth knowing (orders of magnitude):

| Operation | Time |
| --- | --- |
| Main memory reference | ~100 ns |
| Random read from SSD | ~100 µs |
| Round trip within a data centre | ~0.5 ms |
| Disk seek (HDD) | ~10 ms |
| Round trip India ↔ US | ~200 ms |

The lesson: memory is much faster than disk, and network round trips across the world are slow. Cache aggressively and keep data close to users.

## Scaling

- **Vertical scaling (scale up)**: a bigger machine. Simple, but there is a ceiling and it is a single point of failure.
- **Horizontal scaling (scale out)**: more machines behind a load balancer. Needs **stateless** servers, so sessions move to a shared store such as Redis, or into tokens.

## Load balancing

A load balancer spreads requests across servers and removes unhealthy ones using **health checks**.

- **L4** (transport level) balances by IP and port; fast.
- **L7** (application level) can route by URL, headers or cookies; more flexible.
- **Algorithms**: round robin, weighted round robin, least connections, and IP hash (sticky sessions).

## Caching

Caches keep frequently read data in fast memory.

**Where**: browser, **CDN** (static files near users), application cache (Redis, Memcached) and the database's own buffer cache.

| Strategy | How it works | Good for |
| --- | --- | --- |
| Cache-aside (lazy loading) | App reads the cache; on a miss, reads the DB and fills the cache | Read-heavy apps; the most common pattern |
| Write-through | Write to the cache and the DB together | Reads right after writes |
| Write-back (write-behind) | Write to the cache, flush to the DB later | Very write-heavy workloads; risk of loss |
| Write-around | Write only to the DB; cache on read | Data that is written once and rarely read |

- **Eviction**: LRU, LFU and TTL-based expiry.
- **Pitfalls**: stale data (invalidate or keep a short TTL), a **cache stampede** when a hot key expires (use locks or staggered TTLs), and hot keys.

## Databases at scale

- **Replication**: a leader handles writes, and followers (read replicas) handle reads. It improves read throughput and availability. Replicas may lag, which is eventual consistency.
- **Sharding (partitioning)**: split data across machines.
  - **Range-based**: by user ID range; simple, but can create hot spots.
  - **Hash-based**: hash(key) mod N; even spread, but resharding is painful.
  - **Consistent hashing**: keys and servers sit on a ring, so adding a server moves only a small share of keys. Used by caches and distributed databases.
- **Indexes** speed up reads; **denormalization** avoids expensive joins in read-heavy systems.
- **SQL or NoSQL?** Choose SQL for relationships, transactions and strong consistency (payments, orders). Choose NoSQL for huge scale, flexible schemas and simple access patterns (feeds, logs, sessions).

## CAP theorem and consistency

In a distributed system that suffers a **network partition**, you must choose:

- **CP** (consistency): refuse some requests rather than return stale data (e.g. a bank balance).
- **AP** (availability): always answer, possibly with stale data that syncs later (e.g. a like counter).

**Strong consistency** means every read sees the latest write. **Eventual consistency** means replicas converge over time.

## Asynchronous processing with queues

A message queue (Kafka, RabbitMQ, Amazon SQS) decouples producers from consumers.

- Absorbs traffic spikes: requests queue up instead of crashing the service.
- Moves slow work (emails, video processing, notifications) out of the request path.
- **Pub/sub** lets many services react to one event ("order placed").
- Design consumers to be **idempotent**, because messages can be delivered more than once. Use retries with backoff and a **dead-letter queue** for failures.

## Rate limiting

Rate limiting protects services from abuse and overload.

| Algorithm | Idea |
| --- | --- |
| Token bucket | Tokens refill at a fixed rate; each request uses one; allows short bursts |
| Leaky bucket | Requests leave at a constant rate; smooths traffic |
| Fixed window counter | Count requests per minute; simple, but allows bursts at window edges |
| Sliding window | Smooths the edge problem using a rolling window |

Rate limits are usually enforced at the API gateway, with counters in Redis. Return **HTTP 429 Too Many Requests** when a client goes over.

## API design

- **REST** for most CRUD APIs; **GraphQL** when clients need flexible queries; **gRPC** for fast service-to-service calls.
- **Pagination**: offset/limit is simple but slow on deep pages; **cursor-based** pagination (`?after=<id>`) is stable and fast.
- **Idempotency keys** make retries of payment-like requests safe.
- Version your APIs (`/v1/...`) so you can change them without breaking clients.

## Real-time communication

| Technique | How it works | Use |
| --- | --- | --- |
| Short polling | Client asks every few seconds | Simple dashboards |
| Long polling | Server holds the request until there is data | Older chat systems |
| Server-Sent Events | Server pushes over one HTTP connection, one way | Live scores, notifications |
| WebSockets | Full-duplex persistent connection | Chat, multiplayer games, collaboration |

## Reliability and observability

- Remove **single points of failure** with redundancy across servers and availability zones.
- Use **timeouts, retries with exponential backoff** and **circuit breakers** so one slow service does not take everything down.
- Monitor with **logs, metrics and traces**, and alert on error rate, latency (p95/p99) and saturation.

## Worked example: design a URL shortener

**Requirements**

- Functional: create a short link for a long URL; redirect short link to long URL; optional custom alias and expiry.
- Non-functional: very low redirect latency, high availability, and a read-heavy workload (about 100 reads per write).

**Estimates** (example): 100 million new links per month is about 40 writes per second, and at 100:1 about 4,000 redirects per second. At about 500 bytes per record, that is roughly 50 GB of new data per month.

**API**

```text
POST /api/v1/links     { "longUrl": "...", "alias": "optional" }  → { "shortUrl": "https://sho.rt.example/aZ3kP9x" }
GET  /{code}           → 301/302 redirect to the long URL
```

**Data model**

```text
links(code PK, long_url, user_id, created_at, expires_at)
```

A key-value or document store works well, because the access pattern is simply "get by code".

**Generating the short code**

- **Base62** (a–z, A–Z, 0–9) with 7 characters gives 62^7 ≈ **3.5 trillion** combinations.
- Option 1: a **unique ID generator** (a database sequence or a Snowflake-style ID) encoded in Base62. There are no collisions, but codes are guessable in order.
- Option 2: **hash** the URL (e.g. MD5) and take 7 characters. You must handle collisions.
- Option 3: pre-generate random codes into a pool that services take from.

**Redirect**

- **301 (permanent)**: browsers cache it, so there is less load but you lose click analytics.
- **302 (temporary)**: every click reaches your servers, which is good for analytics.

**Scaling**: put a cache (Redis) in front of the database for hot links, use a CDN or edge servers for redirects, add read replicas, shard by code, and send click events to a queue for asynchronous analytics.

## Other common questions and their key ideas

| Design | Key ideas to mention |
| --- | --- |
| News feed (Twitter / Instagram) | Fan-out on write vs fan-out on read; hybrid approach for celebrities; feed cache |
| Chat app (WhatsApp) | WebSockets, message store, delivery and read receipts, presence, offline queue |
| Rate limiter | Token bucket, Redis counters, per-user and per-IP limits, 429 responses |
| Notification system | Queue per channel (email, SMS, push), retries, user preferences, templates |
| File storage (Google Drive) | Chunking, object storage, metadata DB, deduplication, sync conflicts |
| Video streaming (YouTube) | Upload pipeline, transcoding to multiple resolutions, CDN, adaptive bitrate |
| Ride sharing (Uber) | Location updates, geospatial indexing (geohash / quadtree), matching service |
| E-commerce checkout | Inventory consistency, payment idempotency, order state machine, queues |

## Interview questions

**1. Vertical vs horizontal scaling?**
Vertical scaling makes one machine bigger; it is simple but limited. Horizontal scaling adds machines; it is almost unlimited but needs stateless services and load balancing.

**2. What is consistent hashing?**
A way to spread keys across servers on a hash ring, so adding or removing a server only moves a small fraction of keys.

**3. When would you use a message queue?**
To decouple services, absorb spikes, and move slow or retryable work out of the request path.

**4. Cache-aside vs write-through?**
Cache-aside loads data into the cache on a miss. Write-through writes to the cache and the database at the same time, so the cache is always fresh.

**5. What is the CAP theorem?**
During a network partition, a distributed system must choose between consistency and availability.

**6. How do you make an API safe to retry?**
Make operations idempotent, for example with an idempotency key stored with the result of the first request.

**7. Sharding vs replication?**
Replication copies the same data to more machines for reads and availability. Sharding splits different data across machines for scale.

**8. How would you handle a hot key in the cache?**
Replicate the key across cache nodes, add a small local in-process cache, or add a random suffix to spread the load.
