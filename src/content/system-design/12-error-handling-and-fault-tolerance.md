---
title: Error Handling and Fault Tolerance
description: Design for failure from day one. The five kinds of backend errors, database errors and deadlocks, timeouts, retries with backoff, circuit breakers and graceful degradation, failing fast on bad configuration, liveness and readiness checks, monitoring business metrics, a global error handler, and what never to reveal in an error, with Express code.
author: Bitwise School
---

> The question isn't *whether* things will fail. It's *how your system behaves when they do*.

Queries time out. Payment gateways go down during a sale. Users send garbage. A discount rule meets a case nobody imagined. A **fault-tolerant** system isn't one that never breaks. It's one that **breaks predictably, recovers on its own where it can, and tells you exactly what happened**. That takes a shift from "I'll handle errors later" to "I'll design for failure from the start".

The code in this chapter was run against Express 5, Postgres (via PGlite) and pino.

## Five kinds of backend errors

| Kind | Example | How you usually find out |
| --- | --- | --- |
| **Logic errors** | a discount applied twice | silently, weeks later: the hardest to catch |
| **Database errors** | connection lost, duplicate key, deadlock | exceptions and error codes |
| **External service errors** | payment API times out or rate-limits you | timeouts, 5xx and 429 responses |
| **Input errors** | missing fields, bad formats | your validation layer |
| **Configuration errors** | missing API key, wrong database URL | at startup, if you check; at 3 AM, if you don't |

## Logic errors: the silent killers

Logic errors are the most dangerous kind because **nothing crashes**. No stack trace, no 500. The app just does the wrong thing.

A coupon engine applies a discount twice, so some orders end up with a *negative* delivery fee. Every order still goes through, every page loads, no alert fires, and the company loses money on each order for weeks.

Typical causes:

- **Misunderstood requirements**: you built what you thought the meeting decided, not what was meant.
- **Wrong formulas**: an off-by-one, `*` where `+` was intended, rounding at the wrong step.
- **Unhandled edge cases**: a "loyal customer" discount that crashes, or worse misbehaves, for a user with zero past orders.

How to catch them:

- **Unit-test every business rule**, especially money, permissions and anything with conditions ([Chapter 22](/system-design/22-automated-testing/)).
- **Property-based tests** generate thousands of random inputs and check rules that must always hold ("a total is never negative"). In JavaScript, use `fast-check`.
- **Monitor business metrics**, not just errors: alert if average order value drops 20% in an hour, or if any order has a negative total.
- **Require code review** for anything touching payments, auth or pricing.

## Database errors

Most backends are useless without their database, so database errors deserve a plan.

**Connection errors.** The app can't reach the database: a network problem, the server is down or overloaded, or the **connection pool is exhausted** because every connection is busy and new requests wait or fail. Size your pool deliberately ([Chapter 08](/system-design/08-databases/)) and set a connection timeout so requests fail fast instead of hanging.

**Constraint violations.** The database refused something that breaks a rule. Postgres reports each with a standard error code, which you can map to a sensible response:

| Postgres code | Meaning | Respond with |
| --- | --- | --- |
| `23505` unique_violation | duplicate email or slug | **409 Conflict**, "That email is already registered" |
| `23503` foreign_key_violation | references a row that doesn't exist | **400** (or 404), "That course doesn't exist" |
| `23502` not_null_violation | a required value is missing | **400**, "title is required" |
| `23514` check_violation | breaks a CHECK rule (price < 0) | **400** with a clear message |
| `40P01` deadlock_detected | two transactions blocked each other | retry, or **503** "please try again" |
| `40001` serialization_failure | a concurrent transaction conflicted | retry the whole transaction |

Your validation layer should catch most of these first ([Chapter 05](/system-design/05-validations-and-transformations/)). The constraints are the safety net.

**Query errors.** A typo in a table name, a renamed column, broken dynamically built SQL. Tests catch most of these. Always use parameterized queries, which also prevents SQL injection.

### Deadlocks

A **deadlock** happens when two transactions each hold a lock the other one needs, so both wait forever:

![Two transactions each holding a lock on one wallet row and waiting for the other, forming a deadlock that Postgres breaks by aborting one](/images/system-design/deadlock.svg "Neither can continue until the other lets go, so the database picks a victim.")

Postgres detects the cycle and aborts one transaction with error **`40P01`**. Your code should **retry** it. To prevent deadlocks, **always lock rows in the same order** in every code path. For a transfer, lock the wallet with the lower id first, whichever direction the money moves.

## External service errors

Every third-party service (payments, email, SMS, storage, auth, AI) is a failure point you don't control.

### Always set a timeout

The default for many HTTP clients is to wait a very long time, or forever. One slow dependency then ties up your request handlers until your whole API stops responding. Give **every** outgoing call a timeout:

```js
const res = await fetch("https://api.payments.example/v1/charges", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.PAYMENTS_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(charge),
  signal: AbortSignal.timeout(5_000),   // give up after 5 seconds: throws a TimeoutError
});
```

### Retry with exponential backoff and jitter

Rate limits (**429**) and brief outages (**502/503/504**) are often gone a moment later, so retry, but wait **longer each time**, with a random **jitter** so all your servers don't retry in sync. And **never retry permanent errors**: a declined card or a 400 will fail every time.

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retry(fn, { retries = 4, baseMs = 200, maxMs = 5_000, isRetryable = () => true } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const backoff = Math.min(maxMs, baseMs * 2 ** attempt);    // 200, 400, 800, 1600 ms …
      await sleep(backoff / 2 + Math.random() * (backoff / 2));   // plus jitter
    }
  }
}

// Only retry timeouts, rate limits and server errors
const isRetryable = (err) => err.name === "TimeoutError" || err.status === 429 || err.status >= 500;
const charge = await retry(() => payments.charge(order), { isRetryable });
```

In our test, a call that failed twice with 503 succeeded on the third attempt, while a "card declined" error (402) failed immediately after one attempt. If the API sends a `Retry-After` header, wait at least that long. Only retry operations that are safe to repeat: GET, PUT and DELETE, or POSTs protected by an **idempotency key** ([Chapter 01](/system-design/01-http-and-cors/)).

### When a dependency is down for a while

- **Fallback**: if Redis is down, read from the database for a while ([Chapter 09](/system-design/09-caching/)).
- **Graceful degradation**: turn off the broken feature, not the whole app. "Recommendations are unavailable right now" is far better than an error page.
- **Circuit breaker**: after several failures in a row, stop calling the broken service for a cooldown period and fail fast with a fallback. Waiting on timeouts again and again wastes resources and slows every user.

![The closed, open and half-open states of a circuit breaker and the transitions between them](/images/system-design/circuit-breaker.svg "Like an electrical breaker: trip after repeated faults, then test carefully before restoring.")

```js
export class CircuitBreaker {
  #failures = 0;
  #state = "closed";
  #openedAt = 0;

  constructor(fn, { failureThreshold = 5, cooldownMs = 30_000 } = {}) {
    Object.assign(this, { fn, failureThreshold, cooldownMs });
  }

  async call(...args) {
    if (this.#state === "open") {
      if (Date.now() - this.#openedAt < this.cooldownMs) {
        throw new AppError(503, "service_unavailable", "Temporarily unavailable. Try again soon.");
      }
      this.#state = "half-open";   // cooldown over: let one trial call through
    }
    try {
      const result = await this.fn(...args);
      this.#failures = 0;
      this.#state = "closed";
      return result;
    } catch (err) {
      this.#failures++;
      if (this.#state === "half-open" || this.#failures >= this.failureThreshold) {
        this.#state = "open";
        this.#openedAt = Date.now();
      }
      throw err;
    }
  }
}

const suggestions = new CircuitBreaker((userId) => aiClient.suggestCourses(userId), { failureThreshold: 3, cooldownMs: 30_000 });

app.get("/api/me/suggestions", requireAuth, async (req, res) => {
  try {
    res.json(await suggestions.call(req.user.id));
  } catch {
    res.json({ data: [], notice: "Suggestions are unavailable right now." });   // degrade gracefully
  }
});
```

In our test, the breaker opened after three failures, rejected the next calls instantly without touching the service, and closed again once a trial call succeeded after the cooldown. Libraries like `opossum` add metrics, events and per-call timeouts on top of the same idea.

## Input errors

These are the easiest errors, because you define the rules: format, range, required fields, business rules (end date after start date) and references (the category exists). Validate at the entry point, return **400** with **every** field that failed, and never rely on frontend validation alone. [Chapter 05](/system-design/05-validations-and-transformations/) covers this fully.

## Configuration errors: fail fast at startup

A missing `OPENAI_API_KEY`, a wrong `DATABASE_URL` or a forgotten secret between staging and production can break one feature while everything else looks healthy.

**Bad:** the app starts fine. Hours later, the first user tries the AI feature, the key is missing, they get a mysterious 500, and the old version was already shut down.

**Good:** the app checks every required setting **before it starts accepting traffic**. If something is missing, it exits immediately with a clear message. With a rolling or blue-green deployment, the new version never passes its health check, so the old version keeps serving users while you fix the config. Zero downtime.

```js
// config.js: imported first, before anything else starts
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  OPENAI_API_KEY: z.string().startsWith("sk-"),
});

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  console.error("Invalid configuration:\n" + result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);   // crash now, loudly, instead of failing later for one unlucky user
}

export const config = result.data;   // typed, validated, with defaults applied
```

Starting with an empty database URL and a short secret prints:

```text
Invalid configuration:
  - DATABASE_URL: Invalid URL
  - JWT_SECRET: JWT_SECRET must be at least 32 characters
  - OPENAI_API_KEY: Invalid input: expected string, received undefined
```

[Chapter 14](/system-design/14-configuration-management/) goes deeper into configuration.

## Health checks: detect problems before users do

There's a difference between **running** and **working**. Two standard checks (Kubernetes uses both):

| Check | Question | If it fails |
| --- | --- | --- |
| **Liveness** (`/livez`) | is the process alive and not stuck? | the platform **restarts** the container |
| **Readiness** (`/readyz`) | can it serve requests right now: database, cache, dependencies reachable? | the load balancer **stops sending traffic** until it recovers |

Keep liveness cheap and independent of dependencies. If liveness checked the database, a database outage would make the platform restart every app instance in a loop, which helps nobody.

```js
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms))]);

app.get("/livez", (req, res) => res.json({ status: "ok" }));   // the process is up and the event loop responds

app.get("/readyz", async (req, res) => {
  const checks = {
    database: () => pool.query("SELECT 1"),
    redis: () => redis.ping(),
  };
  const results = await Promise.all(
    Object.entries(checks).map(async ([name, check]) => {
      const start = performance.now();
      try {
        await withTimeout(check(), 2_000);
        return [name, { status: "up", ms: Math.round(performance.now() - start) }];
      } catch (err) {
        return [name, { status: "down", error: err.message }];
      }
    })
  );
  const report = Object.fromEntries(results);
  const ready = Object.values(report).every((c) => c.status === "up");
  res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "degraded", checks: report });
});
```

Recording how long each check takes is useful too: a database ping that jumps from 2 ms to 2 seconds is a warning before anything actually fails. Beyond these endpoints, some teams run **synthetic checks**: a periodic test payment in sandbox mode, a test email to an internal inbox.

## Monitoring: know before it breaks

Health checks say "something is broken now". Monitoring tells you something is *about to* break, and helps you understand afterwards *why* it broke.

| Area | Track | Why |
| --- | --- | --- |
| HTTP | rate of 4xx and 5xx; p50/p95/p99 latency | user-facing problems |
| Database | query time, pool usage, deadlocks | slow queries before they time out |
| External services | success rate, latency, 429s | a dependency getting worse |
| **Business** | orders per minute, failed payments, signups | logic errors that never throw |
| Infrastructure | CPU, memory, disk, network | exhaustion comes before crashes |

**Don't only watch error rates.** If successful orders fall from 1,000 a minute to 200 while the error rate stays at 0%, something is badly wrong. Watch the good outcomes too.

### Structured logs

Plain sentences like `"Payment failed for user 42 after 3 tries"` are hard to search at scale. Log **JSON objects** with consistent fields so tools like Grafana Loki, Datadog or the ELK stack can filter and alert on them. **pino** is a fast JSON logger for Node, and its `redact` option removes sensitive fields automatically:

```js
import pino from "pino";

export const logger = pino({
  redact: { paths: ["password", "*.password", "req.headers.authorization", "card.number"], censor: "[REDACTED]" },
});

logger.error({ userId: 42, orderId: 981, attempt: 3, provider: "payments", err }, "payment failed");
```

```json
{"level":50,"time":1794648485010,"userId":42,"orderId":981,"attempt":3,"provider":"payments","err":{"type":"TimeoutError","message":"..."},"msg":"payment failed"}
```

[Chapter 15](/system-design/15-logging-and-observability/) covers logging, metrics and tracing in depth.

## Recovering from errors

| Recoverable | Not recoverable (for now) |
| --- | --- |
| a brief network blip to the email API | the cache cluster is completely down |
| the connection pool is briefly exhausted | the payment provider is out for hours |
| a 429 rate limit | corrupted data in the database |
| **Retry** with backoff, or **queue** the work for later ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)) | **Degrade**, fall back, switch the feature off, protect the core |

**Automatic recovery** (restarting crashed processes, failing over to a replica, clearing a bad cache) is great, but design it carefully: automation can make an incident worse, like retry storms or restart loops. **Manual recovery** is for data corruption, payment mismatches and security incidents, where a human must decide. Write a **runbook** for each, test it, and know who's on call.

During any incident, **data integrity comes first**. Never auto-delete or auto-migrate data as part of recovery. Take a backup first, always.

## A global error handler: one place for every failure

Errors can come from validation, services, the database or third-party calls. Instead of handling each one in every route, let them **bubble up** to one error-handling middleware that turns *anything* into a consistent response. Two big wins:

1. **Nothing is forgotten.** Any error you didn't plan for still becomes a clean `500` with a request id, never a hanging request or a leaked stack trace.
2. **No duplication.** The mapping from "duplicate key" to "409 Conflict" lives in one file, not in forty repository methods.

First, an error type that carries an HTTP status and a message that's **safe to show**, while keeping the original error for your logs:

```js
// errors.js
export class AppError extends Error {
  constructor(status, code, message, { cause, details } = {}) {
    super(message, { cause });   // the original error stays available for logging
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const NotFound = (what) => new AppError(404, "not_found", `${what} not found`);
export const Conflict = (message) => new AppError(409, "conflict", message);
```

Then the handler, registered **last** ([Chapter 06](/system-design/06-controllers-services-and-middlewares/)):

```js
// middlewares/errorHandler.js
import { AppError } from "../errors.js";
import { logger } from "../logger.js";

const PG_ERRORS = {
  "23505": [409, "already_exists", "That value is already taken."],
  "23503": [400, "invalid_reference", "A referenced record does not exist."],
  "23502": [400, "missing_field", "A required field is missing."],
  "23514": [400, "invalid_value", "A value is out of the allowed range."],
  "40P01": [503, "retry_later", "The server is busy. Please try again."],
  "40001": [503, "retry_later", "The server is busy. Please try again."],
};

function toAppError(err) {
  if (err instanceof AppError) return err;
  if (err?.type === "entity.parse.failed") return new AppError(400, "invalid_json", "The request body is not valid JSON.");
  const pg = PG_ERRORS[err?.code];
  if (pg) return new AppError(pg[0], pg[1], pg[2], { cause: err });
  return new AppError(500, "internal_error", "Something went wrong.", { cause: err });
}

export function errorHandler(err, req, res, next) {
  const appError = toAppError(err);
  const level = appError.status >= 500 ? "error" : "warn";
  logger[level]({ requestId: req.id, code: appError.code, err: appError.cause ?? err }, appError.message);   // full details: logs only

  res.status(appError.status).json({
    error: { code: appError.code, message: appError.message, details: appError.details, requestId: req.id },
  });
}
```

With Express 5, a route can simply `throw NotFound("Course")` or let a database error propagate, and the handler produces the response. What the test app actually returned:

| Request | Response |
| --- | --- |
| sign up with an existing email | `409 {"code":"already_exists","message":"That value is already taken."}` |
| age 9 against `CHECK (age >= 13)` | `400 {"code":"invalid_value",...}` |
| body with no email (`NOT NULL`) | `400 {"code":"missing_field",...}` |
| broken JSON | `400 {"code":"invalid_json",...}` |
| `GET /users/99` | `404 {"code":"not_found","message":"User not found"}` |
| a bug: `relation "usres" does not exist` | `500 {"code":"internal_error","message":"Something went wrong."}` |

Notice the last row: the real error ("relation usres does not exist") went to the logs, and the client saw only a generic message and a request id.

Finally, catch what escapes everything else. An unhandled promise rejection or an uncaught exception leaves the process in an unknown state, so log it and let the process restart:

```js
process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "unhandled promise rejection");
  process.exit(1);   // the platform (Docker, Kubernetes, PM2) starts a fresh process
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception");
  process.exit(1);
});
```

## Security: what errors must never reveal

Every error message that leaves your server can leak information. Treat error responses as carefully as normal responses.

### Never leak internals

Raw database errors contain table, column and constraint names. Stack traces reveal file paths and libraries. Both help attackers map your system.

| What you got | What the client should see |
| --- | --- |
| `duplicate key value violates unique constraint "users_email_key"` | "That email is already registered" |
| `relation "usres" does not exist` | "Something went wrong" (+ request id) |
| `deadlock detected` | "Something went wrong, please try again" |
| a stack trace | "Internal server error" (+ request id) |

### Keep login errors vague on purpose

"No account with this email" vs "wrong password" lets an attacker test which emails are registered. Use one message for every login failure, and keep the timing equal ([Chapter 04](/system-design/04-authentication-and-authorization/)).

### Log safely

Logs are often shipped to third-party services and kept for months, and leaked logs have exposed millions of records in real breaches.

- **Never log**: passwords, API keys, tokens, session ids, full card numbers, Aadhaar or PAN numbers, OTPs.
- **Log instead**: user id (not email), request id, operation name, error code.
- Use your logger's **redaction** (pino's `redact`, as above) so a careless `logger.info({ body: req.body })` can't leak a password.

## Quick revision

| Idea | One line |
| --- | --- |
| Mindset | design for failure: break predictably, recover, explain |
| Logic errors | silent; catch with tests, property tests, business metrics, review |
| DB errors | map Postgres codes (23505 → 409); retry deadlocks (40P01) |
| Deadlock | lock rows in a consistent order |
| Timeouts | on every outgoing call (`AbortSignal.timeout`) |
| Retries | exponential backoff + jitter; never retry permanent errors |
| Circuit breaker | closed → open → half-open; fail fast with a fallback |
| Config | validate at startup and exit on error |
| Health | liveness = restart me; readiness = don't send me traffic |
| Monitoring | errors, latency, dependencies and business outcomes |
| Global handler | one place maps every error to one safe JSON shape |
| Security | no internals in responses; vague login errors; redact logs |

## Interview questions

1. Why are logic errors the most dangerous kind? How do you catch them?
2. What is a deadlock? How does Postgres handle it, and how do you prevent it?
3. How would you map database constraint errors to HTTP status codes?
4. Why does every outgoing HTTP call need a timeout?
5. Explain exponential backoff and jitter. Which errors should never be retried?
6. What is a circuit breaker? Describe its three states.
7. What is graceful degradation? Give an example.
8. Why should an app validate its configuration at startup?
9. Liveness vs readiness: what's the difference? Why shouldn't liveness check the database?
10. Why monitor business metrics and not just error rates?
11. What does a global error handler give you? What should a 500 response contain?
12. What must never appear in an error response or a log?

## Further reading

- [OWASP: Error handling cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html) and [Logging cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [PostgreSQL error codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [AWS Architecture Blog: exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Martin Fowler: Circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Kubernetes: liveness, readiness and startup probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
- [pino](https://getpino.io/)

Next: [Chapter 13, gRPC and Inter-Service Communication](/system-design/13-grpc-and-inter-service-communication/).
