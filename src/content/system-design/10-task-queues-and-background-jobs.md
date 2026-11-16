---
title: Task Queues and Background Jobs
description: Move slow and unreliable work out of the request. Producers, queues, workers and brokers, retries with exponential backoff and jitter, acknowledgements and visibility timeouts, dead-letter queues, idempotent handlers, scheduled and chained jobs, rate-limited workers, monitoring, and when to reach for Temporal, with BullMQ code.
author: Bitwise School
---

> A **background job** is any work that runs **outside the request-response cycle**: the client doesn't wait for it.

Sending emails, resizing images, generating PDFs, pushing notifications, cleaning old data: none of these need to finish before you answer the user. Doing them inside the request makes your API slow, and worse, makes it fail whenever some other service fails. This chapter shows how to move that work into **task queues** and run it reliably.

Code examples use **BullMQ**, the most popular Redis-based queue for Node.js. They were run against a real Redis server.

## Why background jobs exist: the signup email

A user signs up:

1. The frontend sends email, name and password.
2. Your API validates them, hashes the password, saves the user and creates a verification code.
3. **It sends a verification email** by calling a provider like Resend, Amazon SES or Brevo.
4. The provider checks your API key, queues the message and delivers it.

If step 3 happens inside the request handler, your signup now depends on a third party's uptime and speed:

- **No error handling**: the email API times out, your handler throws, and the user sees a 500 *while trying to sign up*.
- **With error handling**: you catch the error and return "Check your inbox!", but nothing was sent. The user waits for an email that will never come.

Both are bad. The real problem is that your API's reliability is **coupled** to someone else's service. Put the email in a background job, and the two are decoupled.

![A synchronous signup that waits on the email API compared with one that enqueues a background job and responds immediately while a worker retries](/images/system-design/sync-vs-async.svg "Enqueueing takes milliseconds. A provider outage becomes a delayed email instead of a failed signup.")

The API **enqueues** the job and responds right away. A separate **worker** sends the email, and if the provider is down, it retries later. The signup response is never affected.

## How a task queue works

| Part | Role |
| --- | --- |
| **Producer** | your app code. Builds a job, serializes its data (usually JSON) and pushes it into a queue: **enqueue**. Then returns immediately. |
| **Queue / broker** | stores jobs until a worker is ready. Redis, RabbitMQ or Amazon SQS. Provides durability, ordering and delivery guarantees. |
| **Worker (consumer)** | a **separate process** that takes jobs out (**dequeue**), deserializes them and runs the matching handler. |
| **Handler** | the function that does the real work: the same email-sending code you'd have written in the route, now living in the worker. |

![A producer enqueues JSON jobs into a broker, several workers process them and acknowledge success, failures retry with backoff and land in a dead-letter queue when retries run out](/images/system-design/task-queue-flow.svg "Workers share the queue, so adding workers makes processing faster.")

Jobs cross a process boundary, so their data is **serialized** ([Chapter 03](/system-design/03-serialization-and-deserialization/)): the producer writes JSON and the worker parses it back. Put **ids and small values** in jobs, not whole objects or files. The worker can load fresh data from the database when it runs.

### The producer: do as little as possible

The producer's only job is to gather what the worker needs, push it, and get out of the way. It must never wait for the work itself.

```bash
npm install bullmq ioredis
```

```js
// queues.js: shared by the API and the worker
import { Queue } from "bullmq";

export const connection = { url: process.env.REDIS_URL };   // e.g. redis://localhost:6379

export const emailQueue = new Queue("emails", {
  connection,
  defaultJobOptions: {
    attempts: 5,                                       // 1 try + 4 retries
    backoff: { type: "exponential", delay: 60_000 },   // wait 1 min, 2, 4, 8 between retries
    removeOnComplete: { age: 24 * 3600 },              // keep finished jobs for a day
    removeOnFail: { age: 7 * 24 * 3600 },              // keep failed ones for a week to inspect
  },
});
```

```js
// routes/auth.js: the producer side, inside the request
app.post("/auth/signup", validate({ body: Signup }), async (req, res) => {
  const user = await userService.register(req.valid.body);   // validate, hash, save
  const code = await userService.createVerificationCode(user.id);

  await emailQueue.add("verify-email", { userId: user.id, to: user.email, code });   // milliseconds
  res.status(201).json({ id: user.id, message: "Check your inbox for a verification code." });
});
```

BullMQ 6 treats `ioredis` as an optional dependency, so install both packages.

### The worker: a separate process

The worker usually lives in the **same codebase** but starts from a **different entry point** (`node worker.js`), so you can deploy, restart and scale it independently of the API. A slow job never ties up a web server.

```js
// worker.js: run with `node worker.js`
import { Worker, UnrecoverableError } from "bullmq";
import { connection } from "./queues.js";
import { mailer } from "./services/mailer.js";

const worker = new Worker(
  "emails",
  async (job) => {
    const { to, code } = job.data;
    if (!to?.includes("@")) {
      throw new UnrecoverableError(`Bad address: ${to}`);   // permanent: retrying won't help
    }
    await mailer.send({ to, subject: "Your verification code", text: `Your code is ${code}` });
    // returning normally = success (ACK); throwing = failure (retry with backoff)
  },
  {
    connection,
    concurrency: 10,                         // up to 10 jobs at once in this process
    limiter: { max: 100, duration: 1000 },   // at most 100 jobs per second (the provider's limit)
  }
);

worker.on("failed", async (job, err) => {
  if (job && (await job.isFailed())) {
    // Out of retries, or an UnrecoverableError: this job is now in the failed set.
    console.error({ jobId: job.id, name: job.name, attempts: job.attemptsMade, err: err.message });
    // Alert someone (Slack, PagerDuty) here.
  }
});

// Finish running jobs before exiting when the platform stops this process (see Chapter 16)
process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
```

What the worker does for each job:

1. **Listens** on a queue. Different job types usually get different queues (emails, images, reports), so one slow type can't block the others.
2. **Picks up** a job, deserializes its data and calls the handler.
3. **Acknowledges**: if the handler returns, the job is marked complete (**ACK**). If it throws, the job is marked failed (**NACK**) and scheduled for a retry.

**To process more jobs, run more workers.** Each takes jobs independently from the shared queue. That's horizontal scaling, and it only works if workers are **stateless**: shared state lives in the database or Redis, never in a worker's memory.

## Brokers

| Broker | What it is | Good for | Watch out for |
| --- | --- | --- | --- |
| **Redis** | in-memory data store | fast, simple queues; BullMQ (Node), Sidekiq (Ruby), Celery (Python), Asynq (Go) | enable persistence (AOF) or a crash can lose queued jobs |
| **RabbitMQ** | dedicated message broker (AMQP) | complex routing: fan-out, topics, priorities | more to operate |
| **Amazon SQS** | fully managed cloud queue | no servers to run; scales automatically | AWS only; polling-based |
| **Kafka** | distributed event log | event streaming, replay, many consumer groups | heavier; covered in [Chapter 23](/system-design/23-message-brokers-and-kafka/) |

### How Redis stores jobs

A simple Redis queue uses a **list**: the producer does `LPUSH`, a worker does `BRPOP` (block until something arrives, then pop). That's first in, first out. But once a worker pops a job, it's **gone from Redis**. If the worker crashes halfway, the job is lost.

Libraries fix this in their own layer. BullMQ moves a job into an *active* list while it runs and tracks a lock on it. If the worker dies and the lock expires, the job is detected as **stalled** and returned to the queue for another worker.

**Redis Streams** are an alternative: an append-only log, a bit like a small Kafka inside Redis. Messages stay after delivery, unacknowledged ones are tracked in a *pending entries list* and can be claimed by another consumer, several **consumer groups** can read the same stream independently, and you can replay history. Use Streams when you need audit trails, replay or multiple independent consumers; for ordinary job queues, a library like BullMQ is plenty.

### Amazon SQS: standard vs FIFO

| | Standard queue | FIFO queue |
| --- | --- | --- |
| Throughput | nearly unlimited | lower (raised with high-throughput mode) |
| Ordering | best effort, **not guaranteed** | strict, within a message group |
| Delivery | **at least once**: duplicates are possible | exactly-once processing, using a deduplication id (5-minute window) |
| Use for | emails, notifications, anything where order doesn't matter | payments, stock updates, anything where order matters |
| Name | `emails` | must end in `.fifo`: `payments.fifo` |

In SQS, receiving a message hides it for the **visibility timeout** (30 seconds by default, up to 12 hours). The worker deletes it when done; if it doesn't, the message reappears for another worker.

## Retries, exponential backoff and jitter

Jobs fail: a provider returns 503, the network times out, a database is briefly overloaded. The queue retries them. But retrying *immediately* hammers a service that's already struggling.

**Exponential backoff** doubles the wait after each failure:

```text
delay = baseDelay × 2^(attempt − 1)       base 1 minute → 1, 2, 4, 8, 16 minutes
```

Add **jitter** (a small random amount) to each delay. Without it, a thousand jobs that failed together all retry at the same instant, a **thundering herd** that knocks the service over again.

**Transient vs permanent errors.** A timeout or a 503 is worth retrying. Bad data (an invalid email address) or a 400 from the API will fail every time, so throw an `UnrecoverableError` (BullMQ), `SkipRetry` (Asynq) or the equivalent to stop retrying. Retrying permanent errors wastes resources and clogs your queue.

### Dead-letter queues

When a job runs out of retries, don't let it vanish. It goes to a **dead-letter queue (DLQ)**, a place for jobs that need a human: inspect them, fix the cause, then replay them. SQS and RabbitMQ have built-in DLQs. BullMQ keeps exhausted jobs in its **failed** set (kept for a week in our config), where you can inspect and retry them from code or a dashboard.

In practice, email providers are rarely down for long. With backoff, a job that fails once usually succeeds on the second or third attempt, well within a verification code's expiry.

## Acknowledgements and visibility timeouts

When a worker takes a job, the job isn't deleted. It becomes **invisible** to other workers for a period (the **visibility timeout** in SQS, the **lock** in BullMQ) while it's "in progress". Then one of three things happens:

| What happens | Result |
| --- | --- |
| **ACK**: the handler succeeded | the job is removed (or marked complete) |
| **NACK**: the handler failed | the job is scheduled for a retry, with backoff |
| **Nothing**: the worker crashed or hung | the timeout expires and the job becomes visible again for another worker |

That third row is why jobs aren't lost when workers die. But it also means **a job can run more than once**: the worker might crash *after* sending the email but *before* acknowledging it. So handlers must be idempotent.

## Idempotent handlers

Every real queue retries, and most deliver **at least once**. A handler is **idempotent** if running it twice has the same effect as running it once. Not optional: design for it from day one.

### Pattern 1: claim an idempotency key

Give the job a unique key and claim it atomically before doing the work. Only the first attempt wins:

```js
import { redis } from "./redis.js";   // the node-redis client from Chapter 09

async function sendReceipt(job) {
  const key = `done:receipt:${job.data.orderId}`;
  const claimed = await redis.set(key, "1", { NX: true, EX: 7 * 24 * 3600 });   // "OK" first time, null after
  if (!claimed) return;   // already sent: do nothing

  try {
    await mailer.sendReceipt(job.data.orderId);
  } catch (err) {
    await redis.del(key);   // release the claim so a retry can try again
    throw err;
  }
}
```

BullMQ also lets you choose the job's id. Adding a job whose `jobId` already exists does nothing, which deduplicates at enqueue time. (BullMQ doesn't allow `:` inside custom job ids, so use `-`.)

```js
await emailQueue.add("welcome", { userId }, { jobId: `welcome-${userId}` });
await emailQueue.add("welcome", { userId }, { jobId: `welcome-${userId}` });   // ignored: same id
```

### Pattern 2: upserts

For jobs that write rows, let the database ignore duplicates:

```sql
INSERT INTO notifications (user_id, kind, ref_id)
VALUES ($1, 'course-published', $2)
ON CONFLICT (user_id, kind, ref_id) DO NOTHING;
```

### Pattern 3: one transaction for multi-step jobs

If a job touches several tables (deleting an account and everything it owns), do it in one transaction ([Chapter 08](/system-design/08-databases/)). If any step fails, everything rolls back and the retry starts from a clean state.

### Pattern 4: let the broker deduplicate

SQS FIFO queues drop any message whose `MessageDeduplicationId` was seen in the last 5 minutes. Your handler never sees the duplicate.

## Kinds of background jobs

| Kind | What it is | Examples |
| --- | --- | --- |
| **One-off** | triggered once by an event | verification email, password reset, welcome notification |
| **Recurring** | runs on a schedule | weekly report, daily digest, nightly cleanup of expired sessions |
| **Chained** | step B starts only after step A succeeds; steps at the same level run in parallel | video upload → transcode 1080p, 480p and thumbnail in parallel → publish |
| **Batch (fan-out)** | one trigger spawns many jobs | "goal scored!" push to every fan; delete an account's courses, files and sessions |

### Recurring jobs: run exactly one scheduler

A **scheduler** doesn't run jobs; it **enqueues** them on a cron schedule, and your normal workers process them. Workers scale out, but schedulers must not: two scheduler processes would enqueue every report twice. BullMQ's job schedulers live in Redis and are upserted by id, so calling this on every deploy keeps exactly one:

```js
import { Queue } from "bullmq";
import { connection } from "./queues.js";

export const reportQueue = new Queue("reports", { connection });

// Every Sunday at midnight, and on the 1st of every month at 3 AM
await reportQueue.upsertJobScheduler("weekly-report", { pattern: "0 0 * * 0" }, { name: "weekly-report", data: {} });
await reportQueue.upsertJobScheduler("monthly-cleanup", { pattern: "0 3 1 * *" }, { name: "cleanup-sessions", data: {} });
```

### Chained jobs: flows

When a video is uploaded, three renditions can be made in parallel, and publishing must wait for all of them. BullMQ calls this a **flow**: children run first, and the parent runs only when every child has succeeded.

```js
import { FlowProducer } from "bullmq";
import { connection } from "./queues.js";

const flows = new FlowProducer({ connection });

await flows.add({
  name: "publish",
  queueName: "video",
  data: { videoId },
  children: [
    { name: "transcode-1080p", queueName: "video", data: { videoId } },
    { name: "transcode-480p", queueName: "video", data: { videoId } },
    { name: "thumbnail", queueName: "video", data: { videoId } },
  ],
});
// Observed order: transcode-1080p, thumbnail, transcode-480p, then publish
```

Inside the parent's handler, `await job.getChildrenValues()` returns what each child returned.

### Push notifications, end to end

Your server can't reach a phone directly:

1. When the app is installed, the phone's OS issues a **device token** (Apple APNs or Google FCM).
2. The app sends that token to your backend, which stores it against the user.
3. To notify someone, you **enqueue** a job with their token and the message.
4. A worker calls APNs or FCM with the token and payload.
5. Apple or Google deliver it through the phone's built-in push channel.

It's a background job for all the usual reasons: an external service, rate limits, retries, and sometimes millions of tokens at once.

## Rate-limiting your workers

External APIs have limits. If your workers send 500 emails a second and the provider allows 100, you'll get a flood of 429s, wasted retries and possibly a suspended account. Throttle the workers:

- BullMQ's `limiter: { max: 100, duration: 1000 }` (in the worker above) caps the whole queue at 100 jobs per second, across all worker processes.
- A **token bucket** refills at a fixed rate and allows short bursts up to its size.
- A **sliding window** counts calls in the last N seconds, which is more precise than fixed windows. In Redis it's a sorted set of timestamps.

When you build a limiter yourself, do the read-check-update in **one atomic step** (a Lua script or `MULTI`). Otherwise you've recreated the lost-update race from [Chapter 08](/system-design/08-databases/), across a hundred workers.

## Monitoring: background jobs fail silently

When a web request fails, the user sees an error. When a background job fails, **nobody notices** until a user asks why their email never came. Build in visibility:

| Watch | Why | Alert when |
| --- | --- | --- |
| **Queue depth** (waiting jobs) | jobs piling up = workers too slow or stuck | above a threshold for several minutes |
| **Failure rate** | a bug or an outage | above a few percent |
| **Retry rate** | an external service is struggling | sudden spike |
| **Job duration (p95)** | jobs getting slower | above a target |
| **Worker count / health** | crashed or crash-looping workers | below the minimum |
| **Redis memory** | the broker itself filling up | above ~80% |

`await emailQueue.getJobCounts("waiting", "active", "failed", "delayed")` gives you the raw numbers. **Bull Board** adds a web dashboard to inspect and retry jobs. In production, export these numbers to **Prometheus** and graph and alert on them in **Grafana** ([Chapter 15](/system-design/15-logging-and-observability/)).

## Best practices

1. **Keep jobs small and focused.** One job, one job. Don't bundle "send email + clean up + update analytics"; if one part fails you retry all of it. Use chains for dependent steps and parallel jobs for independent ones.
2. **Avoid very long jobs.** Split a 10-minute job into ten 1-minute jobs. Long jobs hold workers, retry badly and can outlive their visibility timeout.
3. **Handle and log errors properly.** Log the job id, the user, the error and the stack trace. Separate transient errors from permanent ones.
4. **Monitor queues and workers**, with alerts.
5. **Always have a dead-letter path**, and look at it regularly. Recurring failures there point to a real bug.
6. **Make every handler idempotent**, with backoff and jitter on retries.

## Frameworks at a glance

| Framework | Language | Broker | Scheduling | Notes |
| --- | --- | --- | --- | --- |
| **BullMQ** | Node.js | Redis | job schedulers | flows, rate limiting, Bull Board dashboard |
| **Celery** | Python | Redis or RabbitMQ | Celery Beat | the most mature Python option |
| **Asynq** | Go | Redis | built-in | lightweight, with a web UI |
| **Sidekiq** | Ruby | Redis | Sidekiq-Cron | the Ruby standard |
| **Temporal** | many | its own server | built-in | durable workflows, not just jobs |

## Beyond queues: workflow engines like Temporal

Queues are great for independent jobs. They struggle with **long, multi-step business processes**: charge the card → reserve stock → email the customer → notify the warehouse → add loyalty points. If step 4 fails, should you refund step 1? After a crash, how do you resume at step 4? How do you wait three days for a manager's approval?

A **workflow engine** like **Temporal** handles this. You write the process as ordinary code; Temporal records every step in a persistent **event history**, so after a crash the workflow resumes exactly where it stopped. It supports timers that fire months later, **signals** (for example, "the manager approved"), queries of a workflow's current state, and compensation steps (the **saga** pattern).

| Need | Task queue | Temporal |
| --- | --- | --- |
| retry one job | yes | yes |
| multi-step workflow | you chain jobs yourself | built in |
| resume mid-workflow after a crash | restarts the job | resumes at the exact step |
| wait days or months, or for a human | awkward | built in |
| compensation (undo earlier steps) | manual | built in |
| operational cost | low | high: you run a Temporal cluster |

Use a task queue for emails, notifications and image processing. Reach for Temporal only when you have real multi-step workflows with compensation, long waits or human approvals.

## Quick revision

| Idea | One line |
| --- | --- |
| Background job | work outside the request-response cycle |
| Why | speed, and decoupling your API from external services |
| Producer / queue / worker | enqueue and return / store / dequeue and run the handler |
| Brokers | Redis, RabbitMQ, SQS (and Kafka for event streams) |
| Retries | exponential backoff + jitter; stop on permanent errors |
| ACK / NACK / timeout | done / retry / crashed, so redeliver |
| At-least-once | jobs may run twice, so handlers must be idempotent |
| DLQ | where exhausted jobs wait for a human |
| Job kinds | one-off, recurring, chained, batch |
| Scheduler | one instance; it only enqueues |
| Rate limiting | throttle workers to the provider's limits |
| Monitoring | depth, failure rate, retries, duration, worker health |
| Temporal | durable multi-step workflows |

## Interview questions

1. What is a background job? Give three examples and explain why each shouldn't run in the request.
2. Why is sending a verification email inside the signup handler a bad idea, even with a try/catch?
3. Explain producer, broker, worker and handler.
4. What is exponential backoff? Why add jitter?
5. Transient vs permanent errors: how should each be handled?
6. What is a visibility timeout? What happens if a worker crashes mid-job?
7. Why must job handlers be idempotent? Name three ways to make them so.
8. What is a dead-letter queue?
9. Why should only one scheduler run, while you can run many workers?
10. How would you design an upload pipeline where publishing waits for three parallel transcodes?
11. SQS standard vs FIFO: when would you use each?
12. How do you keep workers within a third-party API's rate limit?
13. What would you monitor for a job system?
14. When would you choose Temporal over a task queue?

## Further reading

- [BullMQ documentation](https://docs.bullmq.io/)
- [Amazon SQS developer guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [AWS Architecture Blog: exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Temporal documentation](https://docs.temporal.io/)

Next: [Chapter 11, Full-Text Search and Elasticsearch](/system-design/11-full-text-search-elasticsearch/).
