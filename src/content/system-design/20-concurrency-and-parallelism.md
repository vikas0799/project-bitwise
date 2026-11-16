---
title: Concurrency and Parallelism
description: How a backend does many things at once. Why servers spend most of their time waiting, I/O-bound vs CPU-bound work, concurrency vs parallelism, OS threads and context switching, the event loop and libuv, async/await as a state machine, worker threads, goroutines and virtual threads, race conditions in async code and in the database, locks, atomics and channels, with measured Node.js experiments.
author: Bitwise School
---

A server that handles one request at a time is useless in production: while it serves one user, everyone else waits. Every backend has to deal with many requests at once, and **how** it does that shapes performance, the bugs you'll hit and the architecture you choose.

Most of us learn the keywords first (`async`, `await`, `Promise.all`, threads) and use them without knowing what actually happens underneath. This chapter builds the mental model from the bottom up: what the CPU and operating system do while your code waits, how Node.js's event loop works, how other languages solve the same problem, and the race conditions that appear even in "single-threaded" JavaScript.

Every experiment here was run on a 4-core machine with Node.js 22.

## Servers mostly wait

Think about what a typical API request does: parse the request, query the database, maybe call Redis, maybe call an email or payment API, build the JSON response.

Only the first and last steps use the CPU. Everything in between is **waiting** for another machine to answer. How long depends on where that machine is:

| Where the database is | Network round trip |
| --- | --- |
| same machine | well under 1 ms |
| same data centre | roughly 0.1–0.5 ms |
| another availability zone in the same region | roughly 1–2 ms |
| another region | tens to hundreds of ms |

Add the query's own execution time, and a single database call often takes a few milliseconds to tens of milliseconds. External APIs are worse: 100–500 ms is normal for a payment or email provider.

That sounds quick, but a modern CPU core runs billions of instructions per second, millions per millisecond. A request that spends 200 ms waiting has left the CPU idle for time it could have spent running hundreds of millions of instructions.

![One request spends about 10 ms computing and about 200 ms waiting for I/O; with concurrency, other requests use the CPU during the waits](/images/system-design/io-wait-timeline.svg "The CPU is idle during every wait unless something else can use it.")

A typical request might use ~10 ms of CPU and spend ~200 ms waiting. If the server only works on one request at a time, the CPU is idle about 95% of the time. **Concurrency is how you use those idle moments**: while request 1 waits for the database, the CPU serves requests 2 and 3.

## I/O-bound vs CPU-bound

Every piece of work falls into one of two categories, and the right tool depends on which one you have.

**I/O-bound** work is waiting for something outside the CPU: the "I/O" is input and output, data coming in or going out.

- database queries and Redis commands
- HTTP calls to other services and third-party APIs
- reading and writing files
- publishing to or consuming from a message queue
- writing logs

**CPU-bound** work keeps the processor busy, and the CPU itself is the limit.

- hashing passwords (bcrypt, Argon2) and other cryptography
- image and video processing, PDF generation
- compressing responses (gzip, Brotli)
- parsing or serialising very large JSON
- running a machine-learning model without a GPU

Most backend work is I/O-bound; parsing a normal request body or validating it takes well under a millisecond. The rule of thumb:

> **I/O-bound work needs concurrency. CPU-bound work needs parallelism.**

## Concurrency vs parallelism

The two words are often used interchangeably, but they mean different things.

**Parallelism** is doing several things **at the same instant**. It needs hardware: one CPU core runs one instruction stream at a time, so running four things simultaneously needs four cores.

**Concurrency** is **making progress on several things** over the same period, even on one core. A task runs until it has to wait, then the core switches to another task, and comes back to the first when its data arrives. At any instant only one task runs per core, but from outside it looks like everything happens at once.

![Concurrency interleaves tasks A, B and C on one core; parallelism runs tasks on two cores at the same time](/images/system-design/concurrency-vs-parallelism.svg "Concurrency is about structure; parallelism is about hardware.")

Rob Pike, one of Go's creators, put it as: *concurrency is about **dealing with** lots of things at once; parallelism is about **doing** lots of things at once.* A chef with three pans on the stove, turning to whichever needs attention, is concurrent. Three chefs each cooking one dish are parallel.

There are three main ways backends get concurrency: **OS threads**, an **event loop**, and **lightweight threads**.

## Model 1: OS threads

A **thread** is a sequence of execution that the operating system schedules onto CPU cores. It's an OS feature, not a language feature: when a program creates a thread, it asks the kernel to set one up (on Linux, through the `clone` system call). For each thread the kernel keeps:

- a **stack** for function calls and local variables (Linux reserves 8 MB of address space by default, though only the pages actually used take real memory)
- the saved **registers**, including the instruction pointer, so the thread can be paused and resumed
- scheduling information: state (running, ready, blocked), priority and so on

The OS uses **preemptive scheduling**: each thread gets a short time slice, and when it ends, or the thread blocks on I/O, the kernel pauses it and runs another. The thread doesn't get a say.

The classic server design is **thread-per-request**, used by older Java servers, PHP-FPM and Python's Gunicorn with threads. Each request gets a thread. When the code calls the database, the thread simply **blocks**; the OS notices and runs another thread on that core. The code looks completely sequential, with no `async` anywhere.

Threads in the same process **share memory**. That makes passing data between them cheap, and it's also the source of the nastiest bugs, as we'll see.

### Why threads don't scale to huge numbers

Threads work well up to a few thousand. Beyond that, three costs add up:

1. **Memory.** Even if each thread only touches a few hundred kilobytes of its stack, 10,000 threads use gigabytes just for stacks.
2. **Creation.** Starting a thread is a system call with kernel bookkeeping. Pools of reusable threads reduce this.
3. **Context switches.** Each switch saves one thread's registers, picks the next thread and restores its registers, and the new thread starts with cold CPU caches. A switch costs on the order of microseconds. With thousands of runnable threads on a few cores, a noticeable share of CPU time goes to switching rather than real work.

Around 1999 this was named the **C10k problem**: how do you handle 10,000 simultaneous connections on one machine? Thread-per-connection couldn't. The answer was the event loop.

## Model 2: the event loop

An event loop uses **one thread** for your code and never lets it block. When code needs I/O, it:

1. **starts** the operation (sends the query bytes on the socket)
2. **registers** what to do when the answer arrives (a callback)
3. **returns immediately**, so the thread can work on something else

The loop then repeatedly asks the operating system "which of my sockets have data ready?" and runs the callbacks for those. This is how Node.js, Nginx, Redis and Python's asyncio work.

The OS provides efficient ways to watch thousands of sockets at once: **epoll** on Linux, **kqueue** on macOS and BSD, and **I/O completion ports** on Windows. Node.js uses a library called **libuv** that wraps all three.

![The Node.js main thread runs JavaScript, microtasks and the event loop, while libuv uses OS readiness APIs for sockets and a thread pool for files, DNS, crypto and compression](/images/system-design/node-runtime.svg "Only your JavaScript runs on one thread. libuv uses the OS and a small thread pool for the rest.")

With one thread there are no stacks per connection and almost no context switching, which is why a single Node process can hold tens of thousands of open connections. In the experiment below, 10,000 simulated 100 ms waits all completed in **118 ms** on one thread:

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const t = performance.now();
await Promise.all(Array.from({ length: 10_000 }, () => sleep(100)));
console.log("10,000 x 100 ms waits:", Math.round(performance.now() - t), "ms");   // 118 ms
```

### "Node is single-threaded" is only half true

Your JavaScript runs on one thread, but Node itself uses more:

- **Network I/O** (HTTP, database drivers, Redis) uses the OS readiness APIs and needs no extra threads.
- **Some operations have no good non-blocking OS API**, so libuv runs them on a **thread pool**, 4 threads by default: file system calls, `dns.lookup`, and the async versions of `crypto` (like `pbkdf2` and `scrypt`) and `zlib`.

You can see the pool's size. I started 8 password hashes at once with `crypto.pbkdf2`, each taking about 130 ms:

```js
import { pbkdf2 } from "node:crypto";

const start = performance.now();
const hash = (i) => new Promise((resolve) =>
  pbkdf2("password", "salt", 300_000, 64, "sha512", () => {
    console.log(`hash ${i} done at ${Math.round(performance.now() - start)} ms`);
    resolve();
  }));

await Promise.all(Array.from({ length: 8 }, (_, i) => hash(i + 1)));
```

```text
hash 1 done at 133 ms        hash 5 done at 253 ms
hash 4 done at 134 ms        hash 6 done at 256 ms
hash 2 done at 150 ms        hash 7 done at 276 ms
hash 3 done at 159 ms        hash 8 done at 285 ms
```

Two batches of four: four threads, four hashes at a time. Running again with `UV_THREADPOOL_SIZE=8` let all eight start together, but they **still finished at about 280 ms**, because the machine only has 4 cores. A bigger pool helps when the pool's work is waiting (slow disks, DNS); for CPU-bound work, you can't go faster than the number of cores.

### The event loop's phases

Each turn of Node's event loop goes through phases in order: **timers** (`setTimeout`, `setInterval` callbacks that are due), **poll** (I/O callbacks: sockets, files), **check** (`setImmediate` callbacks), then **close** callbacks. Between every callback, Node empties two queues: `process.nextTick` callbacks first, then promise **microtasks** (`.then` callbacks and the code after an `await`).

```js
const { readFile } = require("node:fs");

console.log("1 sync");
setTimeout(() => console.log("timer (setTimeout 0)"), 0);
setImmediate(() => console.log("check (setImmediate)"));
readFile(__filename, () => {
  console.log("7 I/O callback (readFile)");
  setTimeout(() => console.log("9 timer scheduled from I/O"), 0);
  setImmediate(() => console.log("8 setImmediate from I/O: always before that timer"));
});
Promise.resolve().then(() => console.log("3 promise microtask"));
process.nextTick(() => console.log("2 process.nextTick"));
queueMicrotask(() => console.log("4 queueMicrotask"));
```

```text
1 sync
2 process.nextTick
3 promise microtask
4 queueMicrotask
check (setImmediate)
timer (setTimeout 0)
7 I/O callback (readFile)
8 setImmediate from I/O: always before that timer
9 timer scheduled from I/O
```

Synchronous code runs first, then `nextTick`, then promise microtasks. The order of `setTimeout(0)` and `setImmediate` from the main script is **not guaranteed**: over six runs I saw both orders. Inside an I/O callback, `setImmediate` always comes first, because the check phase follows the poll phase. (In an ES module, top-level code itself runs as a microtask, so there promise callbacks print before `nextTick`. Don't write code that depends on this order.)

### From callbacks to async/await

Event-loop code originally used callbacks, which nest badly once several steps depend on each other:

```js
// Callbacks: each step inside the previous one
getUser(id, (err, user) => {
  if (err) return done(err);
  getCourses(user.id, (err, courses) => {
    if (err) return done(err);
    getProgress(user.id, courses, (err, progress) => {
      if (err) return done(err);
      done(null, { user, courses, progress });
    });
  });
});
```

Promises flattened the nesting, and `async`/`await` made it read like ordinary sequential code:

```js
async function dashboard(id) {
  const user = await getUser(id);
  const courses = await getCourses(user.id);
  const progress = await getProgress(user.id, courses);
  return { user, courses, progress };
}
```

### What `await` really does

`await` doesn't make the thread wait. It **pauses this function** and gives the thread back to the event loop. The rest of the function becomes, in effect, a callback that runs when the promise settles. Conceptually, the engine turns an `async` function into a **state machine** with one state per `await`:

```js
// Roughly what the engine does with dashboard() above
function dashboard(id) {
  return new Promise((resolve, reject) => {
    let user, courses;
    let state = 0;
    function step(value) {
      try {
        switch (state) {
          case 0: state = 1; return getUser(id).then(step, reject);
          case 1: user = value; state = 2; return getCourses(user.id).then(step, reject);
          case 2: courses = value; state = 3; return getProgress(user.id, courses).then(step, reject);
          case 3: return resolve({ user, courses, progress: value });
        }
      } catch (err) { reject(err); }
    }
    step();
  });
}
```

This explains two things:

1. **Why `await` only works inside `async` functions** (or at the top level of a module): only those get turned into resumable state machines. A normal function has no way to pause in the middle.
2. **Why blocking code is so harmful**: while one state runs, nothing else can. If a state spends 500 ms computing, no other request's state machine can move for 500 ms.

### Waiting on several things at once

`await` in a row runs the steps **one after another**. When the steps don't depend on each other, start them all and wait for all of them:

```js
// One after another: each waits for the previous one to finish
const user = await getUser();
const courses = await getCourses();
const progress = await getProgress();
const notifications = await getNotifications();
const recs = await getRecommendations();

// All at once: start all five, then wait for all of them
const [user2, courses2, progress2, notifications2, recs2] = await Promise.all([
  getUser(), getCourses(), getProgress(), getNotifications(), getRecommendations(),
]);
```

With five independent 50 ms calls:

```text
one after another: 252 ms
all at once:       50 ms
```

Five times faster from one change. `Promise.all` rejects as soon as any promise rejects; use `Promise.allSettled` when you want every result even if some fail.

The opposite mistake is starting **too many** things at once: `Promise.all` over 10,000 users fires 10,000 queries simultaneously and exhausts the connection pool or gets you rate-limited. Limit how many run at a time:

```js
// Run fn over items with at most `limit` calls in flight at once.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;                 // safe: no await between reading and incrementing
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
```

```text
100 queries, limit 10: 203 ms, peak in flight 10, last result 198
```

Libraries like `p-limit` and `p-map` do the same thing.

### Never block the event loop

The event loop's weakness is CPU-bound work. Part 1 of the scaling chapter showed a trivial request taking 753 ms because an 800 ms report was running ([Chapter 18](/system-design/18-scaling-and-performance-part-1/)). The same thing happens with the synchronous versions of Node APIs. A timer set to tick every 50 ms, while the code runs `pbkdf2Sync` and then the async `pbkdf2`:

```text
sync hash finished at 249 ms
async hash finished at 379 ms
timer ticks: 49 100 251 301 351
```

During the synchronous hash, the timer couldn't fire (the gap from 100 to 251). During the async hash, running on the thread pool, it kept ticking. In a server, use the async versions of `crypto`, `zlib` and `fs`; keep `...Sync` calls for startup code and scripts.

### Worker threads: parallelism in Node.js

For CPU-heavy JavaScript (your own loops, image manipulation in JS, parsing huge files), Node has **`worker_threads`**: real OS threads, each with its own event loop and JavaScript engine instance, running on other cores. Creating workers is relatively expensive, so use a **pool**. [Piscina](https://github.com/piscinajs/piscina) is a well-maintained one:

```js
// primes.mjs: a deliberately CPU-heavy task (counting primes the slow way).
export default function countPrimes({ limit }) {
  let count = 0;
  for (let n = 2; n < limit; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
    if (prime) count++;
  }
  return count;
}
```

```js
import { Piscina } from "piscina";

const pool = new Piscina({ filename: new URL("./primes.mjs", import.meta.url).href, maxThreads: 4 });

app.get("/reports/primes", async (req, res) => {
  const count = await pool.run({ limit: 3_000_000 });   // runs on a worker; the event loop stays free
  res.json({ count });
});
```

I ran 8 of these jobs both ways, while a 10 ms timer measured how long the event loop was stuck:

```text
main thread:      4185 ms, event loop frozen for up to 4195 ms
4 worker threads: 1082 ms, event loop frozen for up to 13 ms
```

Four workers on four cores finished almost **4× faster**, and the main thread stayed responsive the whole time. On the main thread, the server would have ignored every other request for four seconds.

Workers don't share ordinary JavaScript objects; data is **copied** between threads with `postMessage` (or transferred, for `ArrayBuffer`s). Copying big objects back and forth can cost more than the work saved, so send compact inputs and results.

The other ways to use more cores are separate processes: the `cluster` module or several containers ([Chapter 18](/system-design/18-scaling-and-performance-part-1/)), or a background job queue with worker processes ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)).

## Model 3: lightweight threads

Go took a third path. A **goroutine** is a thread managed by the Go runtime instead of the OS. It starts with a tiny stack of a few kilobytes that grows only if needed, and switching between goroutines happens in user space without a system call, so it's far cheaper than an OS thread switch.

Go's HTTP server starts a goroutine for **every** request. That's thread-per-request again, but cheap enough to work at huge scale, and the code is plain blocking code with no `async` or `await`:

```go
func coursesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.QueryContext(r.Context(), "SELECT id, title FROM courses") // looks blocking
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	// ... write JSON
}
```

When a goroutine waits on a socket, the Go runtime parks it, and its own network poller (built on epoll or kqueue) wakes it when data arrives. Starting 100,000 goroutines that each wait 100 ms:

```text
100000 goroutines started in 128ms
all done after 350ms using 4 OS threads for Go code (GOMAXPROCS)
```

This is an **M:N scheduler**: many goroutines (M) run on a few OS threads (N, by default one per core, set by `GOMAXPROCS`). You get blocking-style code with event-loop efficiency, and CPU-bound goroutines automatically spread across all cores.

Java 21's **virtual threads** bring the same model to the JVM, and frameworks like Spring Boot can run each request on one. Rust's Tokio and Kotlin's coroutines are other variations.

| | OS thread | Goroutine / virtual thread | Event loop task (Node, asyncio) |
| --- | --- | --- | --- |
| Scheduled by | the OS kernel, preemptively | the language runtime | your code yields at each `await` |
| Memory each | stack reservation of MBs | starts at a few KB | a closure and a promise |
| Practical count | thousands | hundreds of thousands to millions | hundreds of thousands |
| Code style | blocking | blocking | `async`/`await` |
| Uses all cores | yes | yes, automatically | no, add workers or processes |

## Race conditions

Concurrency brings a class of bugs that sequential code doesn't have. Nearly all come from **shared, mutable state**: two tasks reading and writing the same data, with their steps interleaving in an unlucky order.

### The lost update between threads

`counter++` looks like one step, but the CPU does three: **read** the value, **add** one, **write** it back. If two threads read the same old value, both write the same new value, and one increment disappears.

JavaScript can show this directly. Four worker threads each incremented a shared counter (in a `SharedArrayBuffer`) a million times:

```js
// In each of 4 workers, sharing one Int32Array backed by a SharedArrayBuffer:
for (let i = 0; i < 1_000_000; i++) shared[0]++;                 // read, add, write: three steps
for (let i = 0; i < 1_000_000; i++) Atomics.add(shared, 0, 1);   // one indivisible step
```

```text
plain  counter: 3,110,694 (expected 4,000,000)
atomic counter: 4,000,000 (expected 4,000,000)
```

Almost 900,000 increments vanished. `Atomics.add` makes the read-add-write a single **atomic** operation that can't be interrupted, so nothing is lost.

### Races in single-threaded async code

"JavaScript has one thread, so it can't have race conditions" is a dangerous myth. Any time code **checks something, awaits, then acts** on what it checked, another request can run in the gap.

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wallet = { balance: 100 };
const loadBalance = async () => { await sleep(5); return wallet.balance; };        // pretend DB read
const saveBalance = async (value) => { await sleep(5); wallet.balance = value; };  // pretend DB write

async function withdraw(amount) {
  const balance = await loadBalance();
  if (balance < amount) throw new Error("insufficient funds");
  await saveBalance(balance - amount);
}

await Promise.allSettled([withdraw(100), withdraw(100)]);
```

```text
no lock: [ 'fulfilled', 'fulfilled' ] balance: 0 (200 handed out from 100)
```

![Two withdraw calls interleave at their await points, both read 100, both pass the check, and both pay out](/images/system-design/async-race.svg "Every await is a point where another request can run.")

Both calls read 100 before either wrote, both passed the check, and 200 was paid out of a balance of 100. Imagine this on a "redeem coupon once" or "book the last seat" endpoint.

## Fixing races

### A mutex inside one process

A **mutex** (mutual exclusion lock) lets only one task into a critical section at a time; others wait their turn. For async code you need an **async** mutex, which makes waiting tasks *await* instead of blocking the thread:

```js
import { Mutex } from "async-mutex";

const lock = new Mutex();
const safeWithdraw = (amount) => lock.runExclusive(() => withdraw(amount));
```

```text
mutex:   [ 'fulfilled', 'rejected' ] balance: 0
```

Now the second withdrawal sees the updated balance and is rejected. `runExclusive` releases the lock even if the function throws. Forgetting to release a lock on an error path is a classic way to freeze a system.

(The same distinction exists elsewhere: in Python, a `threading.Lock` inside a coroutine blocks the whole event loop, so asyncio code uses `asyncio.Lock`.)

### But your app isn't one process

A mutex in memory only protects code **in that process**. Run four cluster workers or ten containers, and each has its own mutex: two requests on different servers race exactly as before. For shared data, the protection has to live where the data lives, usually the **database**.

I ran 10 simultaneous withdrawals of 30 from a balance of 100 against a real Postgres database. Only 3 should succeed.

**Read, check in code, write back** (the race):

```js
const { rows } = await pool.query(`SELECT balance FROM wallets WHERE id = 1`);
if (rows[0].balance < amount) throw new Error("insufficient funds");
await pool.query(`UPDATE wallets SET balance = $1 WHERE id = 1`, [rows[0].balance - amount]);
```

**Atomic update**: let the database check and change in a single statement:

```js
const { rowCount } = await pool.query(
  `UPDATE wallets SET balance = balance - $1 WHERE id = 1 AND balance >= $1`, [amount]);
if (rowCount === 0) throw new Error("insufficient funds");
```

**Row lock**: when the logic needs several steps, lock the row for the transaction:

```js
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const { rows } = await client.query(`SELECT balance FROM wallets WHERE id = 1 FOR UPDATE`);   // others wait here
  if (rows[0].balance < amount) throw new Error("insufficient funds");
  await client.query(`UPDATE wallets SET balance = $1 WHERE id = 1`, [rows[0].balance - amount]);
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
}
```

```text
read-then-write:   10 of 10 withdrawals of 30 succeeded, balance now 10
atomic UPDATE:     3 of 10 withdrawals of 30 succeeded, balance now 10
SELECT FOR UPDATE: 3 of 10 withdrawals of 30 succeeded, balance now 10
```

The naive version handed out 300 from 100, and its final balance changed between runs (10 one time, 40 the next), which is typical of race bugs: wrong *and* unpredictable. Both fixes allowed exactly 3. A `CHECK (balance >= 0)` constraint on the table adds a last line of defence.

Other tools for the same job:

- **Unique constraints** for "only once" rules: a unique index on `(user_id, coupon_id)` makes the second redemption fail no matter how the requests interleave.
- **Optimistic locking**: store a `version` column and update `WHERE id = $1 AND version = $2`; if no row matched, someone else changed it first, so reload and retry.
- **Distributed locks** in Redis (`SET key value NX PX 30000`) for work that isn't a single database row, such as "only one server runs this job". They need expiry times and care; the database is simpler when it can do the job.

### Deadlocks

Locks bring their own failure: two tasks each holding a lock the other needs, both waiting forever. Task 1 locks wallet A then wants B; task 2 locks B then wants A. Postgres detects this and aborts one transaction with a deadlock error ([Chapter 12](/system-design/12-error-handling-and-fault-tolerance/)). Prevent it by always taking locks **in the same order** (for example, by ascending ID), keeping transactions short, and setting lock timeouts.

### Channels: share memory by communicating

Go popularised another approach: instead of many goroutines writing to shared data under a lock, **one** goroutine owns the data and others send it messages through a **channel**. As the Go proverb says: *"Don't communicate by sharing memory; share memory by communicating."*

```go
type withdrawal struct {
	amount int
	result chan error
}

func walletOwner(balance int, requests <-chan withdrawal) {
	for req := range requests {          // one request at a time, so no lock needed
		if balance < req.amount {
			req.result <- errors.New("insufficient funds")
			continue
		}
		balance -= req.amount
		req.result <- nil
	}
}
```

Ten goroutines each sending a withdrawal of 30 to an owner holding 100: exactly 3 succeed, with no mutex around the balance. Node.js has the same idea in `worker.postMessage` and `MessageChannel`, and at the system level it's exactly what a job queue does: producers send messages, and a single consumer processes them in order.

## Choosing the right model

| Workload | Best approach | Examples |
| --- | --- | --- |
| I/O-bound, many connections | event loop, `async`/`await`, goroutines, virtual threads | APIs, gateways, proxies, chat servers |
| CPU-bound and parallelisable | multiple cores: worker threads, processes, OS threads | image and video processing, hashing, reports, ML inference |
| Mixed (most real backends) | async for I/O, CPU-heavy parts sent to workers or a job queue | an API that also generates PDFs |

| Language | I/O concurrency | CPU parallelism | Underneath |
| --- | --- | --- | --- |
| JavaScript (Node.js) | `async`/`await`, promises | `worker_threads`, `cluster`, processes | libuv event loop and thread pool |
| Python | `asyncio` | `multiprocessing`, process pools (the GIL limits threads; free-threaded builds are arriving) | event loop, processes |
| Go | goroutines | goroutines, automatically on all cores | M:N scheduler and network poller |
| Java 21+ | virtual threads | platform threads, `ForkJoinPool` | M:N scheduling of virtual threads |
| Rust | `async`/`await` with Tokio | `std::thread`, Rayon | multi-threaded work-stealing runtime |

The summary:

- **Concurrency** keeps the CPU busy while tasks wait. Use `async`/`await`, goroutines or virtual threads.
- **Parallelism** uses more cores for more computation. Use worker threads, processes or OS threads.
- Most backends are I/O-bound, so concurrency matters most day to day. When you do hit CPU-heavy work, move it off the request path.
- **Wherever there's shared state, there's a potential race.** Protect it in the place the state lives.

## Quick revision

| Topic | Remember |
| --- | --- |
| Why concurrency | requests mostly wait on I/O; use the idle CPU for other requests |
| I/O vs CPU-bound | waiting on something vs computing; concurrency vs parallelism |
| OS threads | kernel-scheduled, MBs of stack, context-switch cost, C10k |
| Event loop | one thread, never block, epoll/kqueue/IOCP via libuv |
| libuv thread pool | 4 threads: fs, dns.lookup, crypto, zlib; `UV_THREADPOOL_SIZE` |
| Loop order | sync → nextTick → promises → timers / poll / check |
| `await` | pauses the function, not the thread; a state machine |
| `Promise.all` | run independent I/O together; limit concurrency for big lists |
| Blocking | avoid `...Sync` and heavy loops on the main thread |
| Worker threads | real parallelism; use a pool (Piscina); data is copied |
| Goroutines | cheap runtime-managed threads, M:N scheduler |
| Races | check-then-act across an `await` or between threads |
| Fixes | async mutex (one process), atomic SQL, `FOR UPDATE`, unique constraints, `Atomics` |
| Deadlocks | lock in a consistent order, keep transactions short |

## Interview questions

1. Why does a backend need concurrency even on a single-core machine?
2. What is the difference between I/O-bound and CPU-bound work? Give two examples of each.
3. Explain the difference between concurrency and parallelism.
4. Why doesn't thread-per-request scale to tens of thousands of connections? What is the C10k problem?
5. How does an event loop handle thousands of connections with one thread? What are epoll and kqueue?
6. Node.js is "single-threaded". What does libuv's thread pool do, and which operations use it?
7. In what order do `process.nextTick`, a resolved promise, `setTimeout(0)` and `setImmediate` callbacks run?
8. What does `await` actually do? Why can it only be used inside `async` functions?
9. You have five independent API calls in a handler, each awaited in turn. How would you speed it up, and what's the risk with 10,000 calls?
10. What happens to other requests when a handler runs a 500 ms synchronous loop in Node.js? How do you fix it?
11. When would you use `worker_threads` rather than `cluster` or a job queue?
12. How do goroutines differ from OS threads? What is an M:N scheduler?
13. Show how a race condition can happen in single-threaded async JavaScript.
14. Why doesn't an in-memory mutex fix a race when you run several servers? What would you use instead?
15. Compare an atomic `UPDATE ... WHERE balance >= $1`, `SELECT ... FOR UPDATE` and optimistic locking.
16. What is a deadlock and how do you prevent one?
17. What does "share memory by communicating" mean?

## Further reading

- [Node.js: The Node.js event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) and [Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [Node.js docs: worker_threads](https://nodejs.org/api/worker_threads.html) and [Piscina](https://github.com/piscinajs/piscina)
- [MDN: Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) and [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/) (free; the chapters on threads, locks and concurrency)
- [Rob Pike: Concurrency is not parallelism](https://go.dev/blog/waza-talk) and [Effective Go: Concurrency](https://go.dev/doc/effective_go#concurrency)
- [The C10k problem](http://www.kegel.com/c10k.html) by Dan Kegel
- [PostgreSQL: Explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)

Next: [Chapter 21, Docker, Kubernetes and CI/CD](/system-design/21-docker-k8s-and-ci-cd/).
