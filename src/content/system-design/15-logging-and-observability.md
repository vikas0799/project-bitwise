---
title: Logging and Observability
description: See inside a running system. The three pillars (logs, metrics, traces), monitoring vs observability, what and how to log, log levels, structured JSON logs, Prometheus metric types, distributed tracing and OpenTelemetry, the open-source and managed tool stacks, alert design with the four golden signals, and a real debugging walkthrough, with Node.js code.
author: Bitwise School
---

A production backend without observability is a black box. Users complain, sign-ups drop, and you have no idea what's wrong, where, or why. Every minute of debugging in the dark costs money and trust.

> A system is **observable** when you can work out what's happening inside it just by looking at what it emits.

Two things to keep in mind before the details:

- **It's a spectrum.** No company does every practice perfectly. Start small (structured logs and an error-rate metric) and improve step by step. Don't let the long list of tools intimidate you.
- **It's a team effort.** Developers instrument the code; DevOps/SRE teams run the systems that collect, store and display the data. Neither works alone.

The Node.js examples (pino, prom-client and OpenTelemetry in one Express app) were run, and the outputs shown are real.

## The three pillars

![Logs answer what happened, metrics show patterns over time, and traces show where a single request spent its time](/images/system-design/observability-pillars.svg "Each pillar answers a different question. Together they explain an incident.")

| Pillar | Question | Example answer |
| --- | --- | --- |
| **Logs** | *what happened?* | "User 42 tried to log in at 14:32:01 and failed: wrong password." |
| **Metrics** | *what's the pattern?* | "Last 5 minutes: 800 requests/s, 12% errors, p99 latency 340 ms." |
| **Traces** | *where did the time go?* | "This request spent 240 ms in one database query and 80 ms calling the email API." |

- **Logs** are timestamped records of individual events: your backend's diary.
- **Metrics** are numbers aggregated over time: trends, not individual events. They're cheap to store and ideal for dashboards and alerts.
- **Traces** follow one request through every component it touches (handler → service → database → external API), with the time spent at each step.

## Monitoring vs observability

The words get mixed up, but they mean different things:

| | Monitoring | Observability |
| --- | --- | --- |
| Question | *is something wrong?* | *what exactly is wrong, and why?* |
| Approach | predefined dashboards and alerts on known metrics | open-ended investigation using logs, metrics and traces together |
| Can answer | questions you planned for | questions you didn't know you'd need to ask |
| Output | "CPU is at 95%" | "CPU is at 95% because one endpoint runs an N+1 query for users with large carts" |
| Like | a car's dashboard: speed, fuel, temperature | a full diagnostic scan that names the faulty part |

Ten years ago, monitoring meant alerts on CPU and memory, and that was enough for one big server. With dozens of services, knowing *that* something failed is nearly useless without knowing *where*. Observability grew from that need.

## How the pillars work together in an incident

You move from coarse signals to fine detail:

1. **An alert fires** (monitoring): "API error rate above 5% for 5 minutes."
2. **Open the metrics dashboard**: 840 requests a minute, 82% returning 5xx, p99 latency jumped from 120 ms to 4.2 s at 14:31. Now you know how bad it is and when it started.
3. **Jump to the logs** for that window: hundreds of `connection pool exhausted after 4000ms`. Now you know *what* is failing.
4. **Open a trace** from one of those log lines: `auth (2 ms) → UserService (3 ms) → db.getUser (3,990 ms ← here)`. Now you know *where*.
5. **Fix it and confirm with metrics**: you add the missing index, and the error rate drops back to normal within minutes.

This only works if the pillars are **correlated**: every log line and every span carries the same **trace id** (or request id), so tools can link them. In our test app, the log lines and the trace spans for each request shared the same trace id automatically.

## Logging

**Logging** records the important events in your application's life. A good rule of thumb: log whatever a developer would need to debug a problem at 2 AM, without access to the live system and without being able to reproduce it.

| Category | Examples |
| --- | --- |
| business events | order placed, payment succeeded, course published, subscription cancelled |
| security events | login success and failure, password reset, token revoked, admin actions |
| system events | server started or stopping, database connected or lost, job started or finished |
| errors | every failure, with context and stack trace |
| performance warnings | slow queries (over, say, 500 ms), huge responses, pool nearly exhausted |

Every log line needs context to be useful: **who** (user id), **what** (the event), **when** (timestamp), **where** (service, route, request id, trace id) and **the result** (status, duration, error).

### Log levels

| Level | Use for | In production? |
| --- | --- | --- |
| **debug** | detailed diagnostics: variable values, branches taken | no: far too much volume and cost |
| **info** | normal successful events: server started, order placed | yes: the usual production level |
| **warn** | unexpected but not a failure: a slow API, a deprecated option, a wrong password | yes |
| **error** | something failed and needs attention: query failed, payment API returned 500 | yes: build alerts on these |
| **fatal** | the app can't continue and is exiting: can't reach the database at startup | yes: rare, page someone |

Levels form a hierarchy: **debug < info < warn < error < fatal**. Setting the logger to `info` shows info and everything above, and hides debug. Use `debug` locally and `info` in production, set through configuration ([Chapter 14](/system-design/14-configuration-management/)).

### Structured logs, not sentences

| | Unstructured (plain text) | Structured (JSON) |
| --- | --- | --- |
| Looks like | `2026-11-14 14:32 ERROR DB query failed for user 42` | `{"level":"error","userId":42,"err":"timeout",...}` |
| Easy for humans? | yes, in a terminal | needs a viewer, or `pino-pretty` locally |
| Easy for machines? | no: fields need fragile regexes | yes: every field is directly queryable |
| Querying | `grep` and hope | `{service="course-api"} \| json \| userId=42` |
| Use in | local development | staging and production |

Log platforms (Loki, the ELK stack, Datadog, New Relic) ingest thousands of lines a second. With JSON they read fields directly; with plain text they have to guess. **Always log JSON in production.** Locally, pipe the output through `pino-pretty` for readable, coloured lines.

**pino** is a fast JSON logger for Node.js. Create one root logger with fields every line should carry, and a **child logger per request** that adds the request id and trace id automatically:

```js
import crypto from "node:crypto";
import pino from "pino";
import { trace } from "@opentelemetry/api";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "course-api", env: process.env.NODE_ENV ?? "development" },
  redact: ["req.headers.authorization", "*.password"],   // never log secrets
});

// In an early middleware: every log line for this request gets its ids
app.use((req, res, next) => {
  req.id = req.get("x-request-id") ?? crypto.randomUUID();
  res.set("x-request-id", req.id);
  req.log = logger.child({ requestId: req.id, traceId: trace.getActiveSpan()?.spanContext().traceId });
  next();
});

// Anywhere in the request
req.log.info({ userId, courseId }, "student enrolled");
```

A real line from the test app:

```json
{"level":30,"time":1794649274517,"service":"course-api","env":"development","requestId":"5609ab0a-acbe-4ca8-b99f-b2b7613decf5","traceId":"44d44bab5d591aab0bd160249e21f991","userId":7,"courseId":42,"msg":"student enrolled"}
```

(pino writes levels as numbers: 30 = info, 40 = warn, 50 = error.)

## Metrics

**Metrics** are numbers that summarise many events: "320 requests in the last 15 seconds". Because they're aggregated, they're tiny to store and fast to query, perfect for dashboards and alerts.

### The Prometheus metric types

| Type | Behaviour | Use for |
| --- | --- | --- |
| **Counter** | only goes up (resets on restart) | requests served, errors, jobs processed; graph its *rate* |
| **Gauge** | goes up and down | queue depth, open DB connections, memory in use right now |
| **Histogram** | counts observations into buckets | request latency, response size; gives percentiles (p50, p95, p99) |
| **Summary** | like a histogram, but percentiles computed in the app | rarely: histograms aggregate better across instances |

**Percentiles beat averages.** An average latency of 80 ms can hide that 1 request in 100 takes 3 seconds. The **p99** (the time 99% of requests beat) shows what your unluckiest users experience.

### Metrics every backend should expose

| Metric | Type | Why |
| --- | --- | --- |
| `http_requests_total{method,route,status}` | counter | traffic and error rate |
| `http_request_duration_seconds{method,route,status}` | histogram | latency percentiles per route |
| `db_query_duration_seconds` | histogram | slow queries, missing indexes, N+1 |
| `db_pool_connections_in_use` | gauge | pool exhaustion risk |
| `queue_jobs_waiting` | gauge | background job backlog ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)) |
| process metrics: memory, CPU, event-loop lag | gauge | runtime health; a steady climb in memory suggests a leak |

**prom-client** exposes these in Prometheus format on a `/metrics` endpoint:

```js
import client from "prom-client";

client.collectDefaultMetrics();   // memory, CPU, event-loop lag, garbage collection …

const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "HTTP requests",
  labelNames: ["method", "route", "status"],
});
const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

app.use((req, res, next) => {
  const stop = httpDuration.startTimer();
  res.on("finish", () => {
    // Label with the route TEMPLATE (/api/courses/:id), never the raw URL
    const route = req.route ? req.baseUrl + req.route.path : "unmatched";
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequests.inc(labels);
    stop(labels);
  });
  next();
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.send(await client.register.metrics());
});
```

After three enrollment requests (two succeeded, one was full), `/metrics` contained:

```text
http_requests_total{method="POST",route="/api/courses/:id/enroll",status="201"} 2
http_requests_total{method="POST",route="/api/courses/:id/enroll",status="409"} 1
```

**Watch label cardinality.** Each unique combination of label values is a separate time series. Labelling by the raw URL (`/api/courses/42`, `/api/courses/43`, …) or by user id creates millions of series and can take Prometheus down. Use route templates and small, fixed sets of values.

**Prometheus pulls.** It scrapes each service's `/metrics` every 15 seconds or so, so dashboards lag reality by a few seconds. That's fine for almost everything.

## Distributed tracing

A **trace** records one request's whole journey. Each step is a **span**: a unit of work with a name, start time, duration, attributes and a parent. All spans of one request share a **trace id**.

![A trace waterfall for an enroll request showing nested spans, where a database query takes most of the time](/images/system-design/trace-waterfall.svg "A trace shows not just that something was slow, but exactly which step.")

| Term | Meaning |
| --- | --- |
| **Trace** | the full journey of one request, identified by a trace id |
| **Span** | one operation in it: a handler, a DB query, an HTTP call |
| **Root span** | the first span, usually the incoming HTTP request; it has no parent |
| **Context propagation** | passing the trace id and current span along: inside a process automatically, and between services in a header |
| **`traceparent`** | the W3C standard header for that: `traceparent: 00-<trace-id>-<span-id>-01` |

A log says "this error happened". A trace says "this error happened *here*, after *these* steps, and made the request take 4.2 seconds instead of 50 ms." It gives cause and context that separate log lines can't.

## Instrumentation with OpenTelemetry

**Instrumentation** means adding code that records spans, metrics and context. You can't observe what you haven't instrumented.

**OpenTelemetry (OTel)** is the open, vendor-neutral standard for it: APIs and SDKs for every major language, plus a **Collector** that receives telemetry and forwards it anywhere. Instrument once, then send the data to Jaeger, Grafana Tempo, Datadog, New Relic or Honeycomb just by changing configuration.

| Concept | Meaning |
| --- | --- |
| **Tracer** | creates spans; each library or service gets a named one |
| **Span** | name, timing, status and attributes; links to its parent through context |
| **Propagation** | OTel adds and reads `traceparent` headers on HTTP clients and servers for you |
| **Auto-instrumentation** | ready-made instrumentation for HTTP, Express, Postgres, Redis, gRPC and more, with no code changes |
| **Collector** | a separate agent that receives telemetry (over OTLP), filters or samples it, and exports it to one or more backends |

Auto-instrumentation must load **before** your app's modules. For a Node app, including one using ES modules, the simplest way is the `register` entry point, configured with environment variables:

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

```bash
OTEL_SERVICE_NAME=course-api OTEL_TRACES_EXPORTER=otlp OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318 node --import @opentelemetry/auto-instrumentations-node/register server.js
```

(Use `OTEL_TRACES_EXPORTER=console` locally to print spans to the terminal.) With that alone, the test app produced spans for the incoming `POST`, Express's router and route handler, and outgoing network calls. Add your own spans around important business logic:

```js
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("course-service");

export async function enroll(userId, courseId, log) {
  return tracer.startActiveSpan("enroll", async (span) => {
    span.setAttributes({ "user.id": userId, "course.id": courseId });
    try {
      const enrollment = await enrollmentRepo.create(userId, courseId);
      log.info({ userId, courseId }, "student enrolled");
      return enrollment;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      log.warn({ userId, courseId, err: err.message }, "enrollment failed");
      throw err;
    } finally {
      span.end();   // always end the span
    }
  });
}
```

The `enroll` span appeared inside the same trace as the HTTP span, with the same trace id as the request's log lines: logs and traces linked with no extra work.

## Tools

### The open-source stack

| Tool | Pillar | Role |
| --- | --- | --- |
| **Prometheus** | metrics | scrapes `/metrics`, stores time series, evaluates alert rules |
| **Grafana** | all | dashboards over Prometheus, Loki, Tempo and more |
| **Loki** | logs | log storage that indexes only labels, not full text, so it's much cheaper than ELK; queried with LogQL |
| **Promtail / Grafana Alloy** | logs | agents that ship log files and container logs to Loki |
| **Tempo** or **Jaeger** | traces | store and explore traces |
| **Alertmanager** | alerts | routes Prometheus alerts to Slack, PagerDuty or email; groups, deduplicates and silences them |
| **OTel Collector** | all | the central pipeline between your apps and these backends |

![Services send logs, metrics and traces through an OpenTelemetry collector to Loki, Prometheus and Tempo, viewed in Grafana with alerts sent through Alertmanager](/images/system-design/observability-stack.svg "Instrument once with OpenTelemetry; the backends behind the collector can change.")

### Managed platforms

If you don't have people to run that stack, managed platforms bundle logs, metrics, traces and alerts:

| Tool | Known for | Good when |
| --- | --- | --- |
| **Datadog** | huge integration list, strong APM and infrastructure monitoring | complex infrastructure, budget available (costs grow fast) |
| **New Relic** | quick agent setup, full-stack APM, generous free tier | small teams that want one tool |
| **Grafana Cloud** | the open-source stack, hosted | you like Grafana but not running it |
| **Honeycomb** | fast querying over high-cardinality events | deep tracing across many services |
| **Sentry** | error tracking: grouped errors, stack traces, releases | catching and triaging exceptions (pairs well with the others) |

### The ELK (Elastic) stack

**Elasticsearch** stores and searches logs, **Logstash** (or the lighter **Filebeat** / **Fluent Bit** agents) collects and parses them, and **Kibana** visualises them ([Chapter 11](/system-design/11-full-text-search-elasticsearch/)).

| | ELK | Loki |
| --- | --- | --- |
| Indexing | every field, full text | only labels |
| Storage cost | high | low |
| Query power | very high | good for label-based queries |
| UI | Kibana | Grafana, alongside metrics and traces |
| Best for | complex searches, security and compliance | cost-conscious teams already on Grafana |

## Designing alerts

Not every metric deserves an alert. Too many alerts and people start ignoring all of them (**alert fatigue**). Alert on **symptoms users feel**, not on internal details.

### The four golden signals (from Google's SRE book)

| Signal | Means | Alert on |
| --- | --- | --- |
| **Latency** | time to serve requests; track successful and failed separately | p99 above a threshold |
| **Traffic** | demand: requests per second | sudden spikes *and* sudden drops (a drop can mean an outage) |
| **Errors** | rate of failed requests | the error **rate**, not the raw count (more traffic means more errors at the same rate) |
| **Saturation** | how full the system is: CPU, memory, DB connections, queue depth | warn around 80%, page around 95% |

```yaml
groups:
  - name: course-api
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
            / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "More than 5% of requests are failing"
          runbook: "https://wiki.example.com/runbooks/high-error-rate"
      - alert: SlowRequests
        expr: histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m]))) > 1
        for: 10m
        labels: { severity: warning }
        annotations:
          summary: "p99 latency is above 1 second"
```

Have at least two severities: **warning** (look at it during working hours) and **critical** (wake someone up). Paging people at 3 AM for warnings burns them out and trains them to ignore alerts. Link every alert to a **runbook** that says what to check first.

## A real incident, start to finish

**14:31, an alert fires:** "[CRITICAL] HighErrorRate: 82% of requests failing on course-api."

1. **Metrics**: p99 latency went from 120 ms to 4.3 s at 14:31. Traffic is normal, so it's not a spike. The DB connection pool is at 97%. Errors are all 500s, which points to the server side.
2. **Logs**: filtering `level=error` for the service shows hundreds of `remaining connection slots are reserved` errors from Postgres. The pool is exhausted.
3. **Trace**: from one log line, the trace shows `auth (3 ms) → listCourses (4,290 ms) → SELECT * FROM lessons WHERE course_id = $1 (4,285 ms)`.
4. **Cause**: a deploy at 14:29 added that query, and `lessons.course_id` has no index. Each query scans the whole table, holds its connection for seconds, and under load the pool runs out.
5. **Fix**: add the index, deploy. Within two minutes the error rate is 0.1% and the pool is at 12%. **Total time: about 11 minutes.**

Without observability, the same incident starts with users complaining on social media, continues with someone SSH-ing into servers to `grep` log files and line up timestamps by hand, and ends hours later with a guess about the missing index.

## Best practices

1. **Give every request an id** at the entry point, put it in every log line and span, and return it in a response header ([Chapter 06](/system-design/06-controllers-services-and-middlewares/)).
2. **Log at boundaries**: entering and leaving the handler, the service and external calls. Not inside every loop. Use spans for fine-grained timing.
3. **Never log sensitive data**: passwords, tokens, API keys, card numbers, OTPs, Aadhaar numbers. Use redaction ([Chapter 12](/system-design/12-error-handling-and-fault-tolerance/)).
4. **Sample traces at high volume.** Recording every trace at thousands of requests a second is expensive. **Head sampling** keeps, say, 10% of all requests; **tail sampling** (in the Collector) keeps every failed or slow request plus a small share of the rest. Never drop the errors.
5. **Level discipline**: no debug in production, info for meaningful events, every error worth a ticket or an alert, fatal means page someone.
6. **Grow it step by step.** Day one: JSON logs plus an error-rate counter. That alone saves hours in your first incident. Then add latency histograms, a dashboard, a few alerts, then tracing.

## Quick revision

| Idea | One line |
| --- | --- |
| Observability | understand internal state from external outputs |
| Logs / metrics / traces | what happened / the pattern / where the time went |
| Monitoring vs observability | "is it broken?" vs "what exactly is broken, and why?" |
| Correlation | one trace id across logs and spans |
| Log levels | debug < info < warn < error < fatal; info in production |
| Structured logs | JSON in production; pino with child loggers |
| Metric types | counter, gauge, histogram (summary rarely) |
| Cardinality | label with route templates, never raw URLs or user ids |
| Tracing | spans, trace id, `traceparent` propagation |
| OpenTelemetry | vendor-neutral instrumentation; auto-instrument with `--import …/register` |
| Golden signals | latency, traffic, errors, saturation |
| Alerts | on user-facing symptoms, two severities, with runbooks |

## Interview questions

1. What are the three pillars of observability? What question does each answer?
2. Monitoring vs observability: what's the difference?
3. Walk through debugging a production incident with metrics, logs and traces.
4. What should you log, and what must you never log?
5. Explain the log levels. Which would you use in production?
6. Why are structured JSON logs better than plain text in production?
7. Counter vs gauge vs histogram: give an example of each.
8. Why are percentiles better than averages for latency?
9. What is label cardinality and why does it matter?
10. What are traces and spans? How does a trace id travel between services?
11. What is OpenTelemetry and why is being vendor-neutral useful?
12. What are the four golden signals? How do you avoid alert fatigue?
13. What is trace sampling? Head vs tail sampling?

## Further reading

- [OpenTelemetry: Node.js getting started](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/)
- [Prometheus: metric types](https://prometheus.io/docs/concepts/metric_types/) and [best practices for naming](https://prometheus.io/docs/practices/naming/)
- [Google SRE book: Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [pino](https://getpino.io/) and [prom-client](https://github.com/siimon/prom-client)

Next: [Chapter 16, Graceful Shutdown](/system-design/16-graceful-shutdown/).
