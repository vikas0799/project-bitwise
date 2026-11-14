---
title: Graceful Shutdown
description: Stop a server without dropping requests or corrupting data. Process lifecycles, Unix signals (SIGTERM, SIGINT, SIGKILL), connection draining with a timeout, coordinating with load balancers and Kubernetes, cleaning up resources in reverse order, and a tested Node.js implementation, plus the Docker, PM2 and Kubernetes details that trip people up.
author: Bitwise School
---

You're processing a payment when a new version is deployed and your server has to restart. What happens to that payment? Is it lost? Could the customer be **charged twice**?

Zero-downtime deployments make sure a new server is up before the old one goes away. But at some point the old server **must stop**, and requests may be in the middle of running at that exact moment. **Graceful shutdown** is how a server stops without dropping those requests or leaving data in a broken state.

> **Graceful shutdown** means stopping politely: finish what you're doing, tidy up, then leave, instead of dying mid-sentence.

Think of a restaurant at closing time. The staff don't switch off the lights and push diners out. They stop seating new customers, let the people already eating finish, clear the tables, and then lock the door. Your backend should do the same.

The Node.js code in this chapter was tested by sending a real `SIGTERM` to a running server in the middle of a slow request.

## Processes and their lifecycle

Your backend runs as a **process**, as everything on an operating system does. Every process has a lifecycle: it's **born** (started), it **lives** (runs), and it **dies** (exits or is terminated).

When the operating system, or a tool managing your app, decides your process should stop, it doesn't simply pull the plug. It follows a protocol: first it *asks* the process to stop, gives it some time, and only then forces it. That conversation happens through **signals**.

## Signals

**Signals** are how Unix-like systems (Linux and macOS) notify a process that something happened. They're a simple form of **inter-process communication (IPC)**. Servers almost always run on Linux, so this is how your backend is told to stop.

A process can **register handlers** for most signals: code that runs when that signal arrives. Three signals matter for shutdown:

| Signal | Sent by | Can your app catch it? | Meaning |
| --- | --- | --- | --- |
| **SIGTERM** | Kubernetes, Docker, systemd, PM2, deploy tools | **yes** | "Please finish up and exit." The polite request. |
| **SIGINT** | you, pressing **Ctrl+C** in a terminal | **yes** | "Interrupt." Same intention: please stop. |
| **SIGKILL** | the OS or orchestrator, when you didn't exit in time (or `kill -9`) | **no** | Instant death. No handler, no cleanup. Pulling the power plug. |

**Handle SIGINT and SIGTERM the same way.** Whether a developer pressed Ctrl+C on a laptop or Kubernetes sent SIGTERM in production, the intention is identical: shut down cleanly.

**SIGKILL can't be caught or ignored.** That's exactly why graceful shutdown matters: the polite signals are your one chance to clean up. If you ignore them, or take too long, the orchestrator escalates to SIGKILL, and you lose the chance entirely.

## What a graceful shutdown does

![After SIGTERM the app stops taking new traffic, drains in-flight requests, stops workers and closes the database and Redis before exiting, well before the SIGKILL deadline](/images/system-design/shutdown-timeline.svg "Do the steps in order, and finish well before the grace period runs out.")

1. **Stop taking new work**: stop accepting connections, and tell the load balancer you're no longer ready.
2. **Drain**: let the requests already in progress (**in-flight** requests) finish.
3. **Clean up**: stop background workers, close database pools, Redis connections, files and anything else you opened.
4. **Exit** with code 0.

## Connection draining

At any moment your server may be handling dozens or thousands of requests. **Connection draining** is the restaurant routine applied to them:

- **Stop admitting new customers**: stop accepting new connections. Otherwise the problem keeps growing while you're trying to finish it.
- **Let current diners finish**: wait for in-flight requests to complete.
- **Close up**: close connections once they're done.

The idea is the same for every kind of server, only the details change:

| Kind of server | Draining means |
| --- | --- |
| HTTP API | stop accepting connections; let in-flight requests finish |
| job worker | stop taking new jobs; finish (or hand back) the current one ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)) |
| database | finish running queries and transactions; refuse new ones |
| WebSockets | tell clients you're going away (close code 1001), then close, so they reconnect to another server ([Chapter 24](/system-design/24-websockets-and-real-time/)) |

### How long should you wait?

You can't wait forever, so draining has a **deadline**, commonly around **30 seconds**. If a request still isn't done by then, you stop anyway.

- **Too short**: you cut off real work, like a payment in progress.
- **Too long**: every deploy and every scale-down drags on, and stuck requests hold everything up.

Pick it based on how long your slowest legitimate requests take. 30 seconds is plenty for a typical API. Long-lived connections (WebSockets, streaming, big uploads) need more thought. Long-running jobs should be designed to be interruptible and resumable, so a shutdown simply puts them back on the queue.

### Telling the load balancer

Draining also needs the **load balancer** and **service discovery** to stop sending you new traffic. In practice:

- Make your **readiness check** return 503 as soon as shutdown starts, so the load balancer takes the instance out of rotation ([Chapter 12](/system-design/12-error-handling-and-fault-tolerance/)).
- In service registries (Consul, Eureka), **deregister** the instance.
- In **Kubernetes**, the pod is removed from the Service's endpoints at roughly the same time SIGTERM is sent, and it can take a few seconds for every proxy to notice. A short **preStop** delay (a few seconds) before your app stops listening avoids refusing requests that were already routed to you.

## Cleaning up resources

While running, your app acquired resources from the operating system and other services, and it should give them back:

- **File handles**: the OS limits how many a process can have open, and leaked handles waste memory.
- **Network connections**: every connection the OS tracks for you.
- **Database connections and transactions**: every open transaction must be **committed or rolled back** before exit. Leaving one hanging can hold locks, cause deadlocks or leave data inconsistent: exactly the lost-or-double-charged payment from the start of the chapter. Databases roll back transactions on dead connections, but finishing cleanly is far better than relying on that.
- **Temporary files and caches** you created.
- **Telemetry**: flush buffered logs, metrics and traces, or the most useful data about the shutdown is lost.

### Close in reverse order

Release resources in the **reverse** order you acquired them: last in, first out, like a stack. If you opened Redis, then the database pool, then started the HTTP server, shut down the HTTP server first, then the database, then Redis. That way, everything still running can use the things it depends on: in-flight requests still have a working database while they finish.

## A graceful shutdown in Node.js

```js
// server.js
import express from "express";
import { pool } from "./db.js";        // pg Pool
import { redis } from "./redis.js";    // node-redis client
import { worker } from "./worker.js";  // BullMQ Worker
import { logger } from "./logger.js";

let shuttingDown = false;
const app = express();

app.get("/readyz", (req, res) => res.status(shuttingDown ? 503 : 200).json({ ready: !shuttingDown }));
// ...routes...

const server = app.listen(process.env.PORT ?? 3000, () => logger.info("listening"));

async function shutdown(signal) {
  if (shuttingDown) return;   // a second Ctrl+C shouldn't start a second shutdown
  shuttingDown = true;
  logger.info({ signal }, "shutting down");

  // Hard deadline: if cleanup hangs, exit before the platform sends SIGKILL
  const forceExit = setTimeout(() => {
    logger.error("cleanup took too long, forcing exit");
    process.exit(1);
  }, 25_000);
  forceExit.unref();

  // 1. Stop accepting connections and wait for in-flight requests to finish.
  //    Keep closing keep-alive connections as they go idle, so they don't hold the server open.
  const closeIdle = setInterval(() => server.closeIdleConnections(), 250);
  await new Promise((resolve) => server.close(resolve));
  clearInterval(closeIdle);
  logger.info("http server closed");

  // 2. Release everything else in reverse order of acquisition
  await worker.close();   // waits for the current job to finish
  await pool.end();       // closes database connections
  await redis.quit();     // closes the Redis connection

  clearTimeout(forceExit);
  logger.info("shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

What happened when we sent SIGTERM 200 ms into a request that takes 1.5 seconds:

```text
[03.815] payment started
[04.011] SIGTERM received: shutting down
         new request after SIGTERM -> refused (ECONNREFUSED)
[05.315] payment finished
         in-flight request -> 201 {"status":"paid"}
[05.515] http server closed (in-flight requests done)
[05.566] job worker stopped (current job finished)
[05.587] db pool closed
[05.608] redis closed
         process exit code: 0
```

The payment that was already running finished and got its response. A new request arriving after SIGTERM was refused, so the load balancer or client retries it on a healthy instance. Then resources closed in reverse order, and the process exited cleanly.

**A Node.js detail worth knowing.** `server.close()` stops accepting connections but waits for every existing connection to close, including idle **keep-alive** connections that browsers and HTTP clients hold open. In our first test, the server stayed open about 3 extra seconds after the last response, until the client's keep-alive connection timed out. Calling `server.closeIdleConnections()` repeatedly during shutdown, as above, closes connections as soon as they go idle, and brought that delay down to about 200 ms. Libraries like `http-terminator` or `@godaddy/terminus` package the same logic.

The deadline (25 seconds) is deliberately shorter than the platform's grace period (30 seconds by default in Kubernetes), so your own cleanup finishes before any SIGKILL.

## Platform details that trip people up

- **Docker**: `docker stop` sends SIGTERM, then **SIGKILL after 10 seconds** by default (change it with `--time`). In Compose, use `stop_grace_period`.
- **`npm start` swallows signals.** With `CMD ["npm", "start"]`, npm is the main process (PID 1) and may not forward SIGTERM to Node, so your handler never runs and the container is killed after the timeout. Use the exec form, `CMD ["node", "server.js"]`, or run with `docker run --init` (or `tini`) so signals reach your app ([Chapter 21](/system-design/21-docker-k8s-and-ci-cd/)).
- **Kubernetes**: on termination it runs any **preStop** hook, sends SIGTERM, waits `terminationGracePeriodSeconds` (**30 seconds** by default), then sends SIGKILL. Set the grace period above your drain deadline, and add a short preStop delay for the endpoint-removal race described above.
- **PM2**: sends SIGINT, then SIGKILL after `kill_timeout`, which defaults to only **1.6 seconds**. Raise it (for example `kill_timeout: 30000`) if you need time to drain.
- **systemd**: sends SIGTERM, then SIGKILL after `TimeoutStopSec` (90 seconds by default).

## Quick revision

| Idea | One line |
| --- | --- |
| Graceful shutdown | finish work, clean up, then exit; never die mid-request |
| Process lifecycle | born, lives, dies; stopping is negotiated through signals |
| SIGTERM / SIGINT | polite "please stop"; catch them and handle them the same way |
| SIGKILL | immediate; can't be caught; what you get if you're too slow |
| Draining | stop accepting, finish in-flight, close connections |
| Deadline | ~30 s typical; too short cuts work off, too long slows deploys |
| Load balancer | readiness → 503, deregister, short preStop delay in Kubernetes |
| Cleanup | commit or roll back transactions; close pools, files, connections; flush telemetry |
| Order | reverse of acquisition (LIFO) |
| Node.js | `server.close()` + `closeIdleConnections()`, then close resources, with a forced-exit timer |
| Gotchas | Docker 10 s, `npm start` and PID 1, PM2's 1.6 s default |

## Interview questions

1. What is graceful shutdown and why does it matter during deployments?
2. What's the difference between SIGTERM, SIGINT and SIGKILL? Which can a process catch?
3. Why should SIGINT and SIGTERM be handled the same way?
4. What is connection draining? What does it mean for HTTP servers, workers and WebSockets?
5. How do you choose the shutdown timeout?
6. How does a load balancer find out that an instance is shutting down?
7. Why release resources in reverse order of acquisition?
8. What should happen to open database transactions during shutdown?
9. Why might a Node.js server take a long time to close after `server.close()`?
10. Why can `CMD ["npm", "start"]` break graceful shutdown in Docker?
11. Describe what Kubernetes does when it terminates a pod.

## Further reading

- [Linux manual: signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)
- [Node.js: process signal events](https://nodejs.org/api/process.html#signal-events) and [server.close()](https://nodejs.org/api/http.html#serverclosecallback)
- [Kubernetes: termination of pods](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)
- [PM2: graceful start and shutdown](https://pm2.keymetrics.io/docs/usage/signals-clean-restart/)
- [Docker: docker stop](https://docs.docker.com/reference/cli/docker/container/stop/)

Next: [Chapter 17, Backend Security](/system-design/17-backend-security/).
