---
title: "Async JavaScript: Promises, async/await and the Event Loop"
description: Callbacks and callback hell, promise states with diagrams, creating and consuming promises, chaining, Promise.all, allSettled, race and any compared and implemented, async/await with error handling, the event loop with microtasks and macrotasks, and output questions.
author: Vikas Patel
---

JavaScript runs on **one thread**: one call stack, one line at a time. Yet it downloads files, waits for timers and handles clicks without freezing. This note explains how: the environment does the waiting, **promises** represent the result, and the **event loop** decides when your callbacks run.

## Why async?

Some work takes time: network requests, timers, reading files, database queries. If JavaScript waited for them on its only thread, the page (or the whole Node server) would freeze. Instead it **starts** the work, hands it to the browser or Node, keeps running your code, and runs a **callback** when the result is ready.

### Callbacks and callback hell

```js
getUser(1, (user) => {
  getCourses(user.id, (courses) => {
    getLessons(courses[0].id, (lessons) => {
      console.log(lessons);          // each step nests deeper: "callback hell"
    });
  });
});
```

Deep nesting, repeated error handling and **inversion of control** (you trust someone else's code to call your callback exactly once) led to promises.

## Promises

> A **Promise** is an object that represents the **eventual** success or failure of an asynchronous operation. Instead of waiting, JavaScript keeps running and you attach what to do **when** it finishes.

![A promise moving from pending to fulfilled via resolve or rejected via reject, with then, catch and finally](/images/js/promise-states.svg "A promise settles exactly once and never changes state again.")

| State | Meaning | Handler |
| --- | --- | --- |
| **pending** | started, not finished yet | — |
| **fulfilled** | finished successfully, has a **value** | `.then(value => …)` |
| **rejected** | failed, has a **reason** (usually an `Error`) | `.catch(error => …)` |

A promise that is fulfilled or rejected is called **settled**.

### Creating a promise

```js
const fetchData = new Promise((resolve, reject) => {
  const success = true;
  setTimeout(() => {
    if (success) resolve("Data fetched successfully");
    else reject(new Error("Something went wrong"));  // reject with an Error, not a string
  }, 500);
});
```

The function you pass (the **executor**) runs **immediately and synchronously**. Only `.then` callbacks run later.

### Consuming a promise

```js
fetchData
  .then((result) => console.log(result))   // "Data fetched successfully"
  .catch((error) => console.log(error.message))
  .finally(() => console.log("Completed")); // runs either way: hide loaders, close connections
```

### Chaining

Every `.then` **returns a new promise**, so steps can be chained flat instead of nested. Return a value to pass it on; return a promise to wait for it.

```js
const wait = (ms, value) => new Promise((res) => setTimeout(() => res(value), ms));

wait(100, 2)
  .then((n) => n * 10)                 // 20
  .then((n) => wait(100, n + 1))       // waits, then 21
  .then((n) => {
    throw new Error(`too big: ${n}`);  // a throw becomes a rejection
  })
  .catch((err) => console.log(err.message)) // "too big: 21": one catch for the whole chain
  .then(() => console.log("chain continues after catch"));
```

**Common bug:** forgetting to `return` inside `.then`. The next step then gets `undefined` and doesn't wait.

## Promise combinators

| Method | Settles when | Result | Rejects if |
| --- | --- | --- | --- |
| `Promise.all(ps)` | all fulfil, or the first rejects | array of values, in input order | **any** one rejects (fail fast) |
| `Promise.allSettled(ps)` | all settle | array of `{ status, value }` / `{ status, reason }` | never |
| `Promise.race(ps)` | the **first** settles (either way) | that value or reason | the first to settle rejected |
| `Promise.any(ps)` | the first **fulfils** | that value | **all** reject (`AggregateError`) |

```js
const ok = (ms, v) => new Promise((res) => setTimeout(() => res(v), ms));
const fail = (ms, e) => new Promise((_, rej) => setTimeout(() => rej(new Error(e)), ms));

Promise.all([ok(30, "a"), ok(10, "b")]).then(console.log);           // ["a", "b"]: input order
Promise.all([ok(30, "a"), fail(10, "x")]).catch((e) => console.log(e.message)); // "x"
Promise.allSettled([ok(10, "a"), fail(20, "x")]).then((r) => console.log(r.map((s) => s.status)));
// ["fulfilled", "rejected"]
Promise.race([ok(30, "slow"), ok(10, "fast")]).then(console.log);    // "fast"
Promise.any([fail(10, "x"), ok(20, "first success")]).then(console.log); // "first success"
```

Use `all` when every result is required (load a page's data together), `allSettled` when you want every outcome (send 50 emails, report which failed), `race` for timeouts, and `any` for "whichever mirror answers first".

Also: `Promise.resolve(v)` returns an already-fulfilled promise and `Promise.reject(e)` an already-rejected one. Handy for tests and for starting chains.

### Implementing the combinators

A favourite interview task. Note the details: results keep **input order**, empty input resolves immediately, and non-promise values are allowed (`Promise.resolve` wraps them).

```js
function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = [];
    let done = 0;
    if (items.length === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;                        // keep input order
        if (++done === items.length) resolve(results);
      }, reject);                                  // first rejection wins
    });
  });
}

function promiseRace(items) {
  return new Promise((resolve, reject) => {
    items.forEach((item) => Promise.resolve(item).then(resolve, reject));
  });
}

function promiseAllSettled(items) {
  return promiseAll(
    items.map((item) =>
      Promise.resolve(item).then(
        (value) => ({ status: "fulfilled", value }),
        (reason) => ({ status: "rejected", reason }),
      ),
    ),
  );
}

function promiseAny(items) {
  return new Promise((resolve, reject) => {
    const errors = [];
    let failed = 0;
    if (items.length === 0) return reject(new AggregateError([], "All promises were rejected"));
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (err) => {
        errors[i] = err;
        if (++failed === items.length) reject(new AggregateError(errors, "All promises were rejected"));
      });
    });
  });
}

promiseAll([1, Promise.resolve(2), new Promise((r) => setTimeout(() => r(3), 10))]).then(console.log); // [1, 2, 3]
```

A `resolve` or `reject` call after the promise has settled is simply ignored, which is why `race` can call `resolve` many times safely.

## async / await

`async`/`await` is syntax on top of promises that lets async code read top to bottom.

- An `async` function **always returns a promise**.
- `await promise` **pauses that function** (not the whole program) until the promise settles, then gives you the value or throws the error.

```js
async function loadCourse(id) {
  try {
    const res = await fetch(`https://api.example.com/courses/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch only rejects on network errors
    return await res.json();
  } catch (err) {
    console.error("Could not load course:", err.message);
    return null;
  }
}
```

### Sequential vs parallel

```js
// Sequential: ~2 s. The second request waits for the first even though they're independent.
const a = await getUser();
const b = await getCourses();

// Parallel: ~1 s. Start both, then wait for both.
const [user, courses] = await Promise.all([getUser(), getCourses()]);
```

`await` inside `forEach` doesn't wait: `forEach` ignores the returned promises. Use `for...of` for sequential steps or `Promise.all(arr.map(...))` for parallel ones.

### Promise chains vs async/await

| | `.then()` chains | `async`/`await` |
| --- | --- | --- |
| reads like | a pipeline of callbacks | normal top-to-bottom code |
| errors | `.catch()` | `try`/`catch` |
| loops and conditions | awkward | natural |
| under the hood | promises | the same promises |

## The event loop

JavaScript has one **call stack**. Timers, network calls and events are handled by the **environment** (Web APIs in the browser, libuv in Node). When they finish, their callbacks wait in a queue until the stack is free. The **event loop** moves them onto the stack.

There are **two queues**, and the difference is the key to every output question:

- **Microtask queue:** promise callbacks (`.then`, `.catch`, `.finally`), code after `await`, `queueMicrotask`. **High priority.**
- **Task (macrotask) queue:** `setTimeout`, `setInterval`, DOM events, I/O, `MessageChannel`.

![Call stack, Web APIs, the microtask queue and the task queue, with the three steps of the loop](/images/js/event-loop.svg "After each task, the whole microtask queue is emptied before the next task runs.")

**The loop:**

1. Run all synchronous code until the call stack is empty.
2. Run **every** microtask, including new microtasks added while doing so.
3. Take **one** task from the task queue, run it, go back to step 2. (Browsers may render between tasks.)

`setTimeout(fn, 0)` means "run as a task **after at least 0 ms**", never "run now". It always comes after the current code and all pending microtasks.

### Predict the output

```js
console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
queueMicrotask(() => console.log(4));
console.log(5);
// 1 5 3 4 2
```

Sync first (1, 5), then microtasks in the order they were queued (3, 4), then the timer task (2).

```js
setTimeout(() => console.log("A"), 0);
Promise.resolve().then(() => console.log("B"));
console.log("C");
// C B A
```

```js
async function test() {
  console.log(1);
  await Promise.resolve();
  console.log(2);
}
console.log(3);
test();
console.log(4);
// 3 1 4 2
```

An `async` function runs **synchronously until the first `await`**, so 1 prints right after 3. Everything after `await` is a microtask, so 2 comes after the sync 4.

```js
console.log("start");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve()
  .then(() => {
    console.log("then 1");
    setTimeout(() => console.log("timeout from then"), 0);
  })
  .then(() => console.log("then 2"));
new Promise((resolve) => {
  console.log("executor");   // executors run synchronously
  resolve();
}).then(() => console.log("then 3"));
console.log("end");
// start, executor, end, then 1, then 3, then 2, timeout, timeout from then
```

`then 2` waits for `then 1` to finish, so `then 3` (queued earlier) slips in between. Both timeouts come last, in the order they were scheduled.

### Starving the loop

Because the microtask queue is emptied **completely**, a microtask that keeps adding microtasks blocks timers, clicks and rendering forever. Long synchronous work does the same. That's why heavy computation belongs in a [Web Worker](/notes/javascript-dom-events) (browser) or a worker thread (Node).

### In Node.js

Node's loop has phases (timers, I/O poll, `setImmediate` check, close callbacks). The same rule holds: microtasks run between callbacks. Node also has `process.nextTick`, which runs **before** promise microtasks:

```js
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("nextTick"));
console.log("sync");
// sync, nextTick, promise
```

More in [Node.js fundamentals](/notes/nodejs-fundamentals).

## Error handling checklist

- Always end a chain with `.catch`, or wrap `await` in `try`/`catch`.
- An unhandled rejection logs a warning in browsers and **crashes the process** in modern Node.
- Reject with `Error` objects, not strings, so you get a stack trace.
- Check `res.ok` after `fetch`: HTTP 404 and 500 don't reject.

## Interview questions

1. Explain the event loop: call stack, Web APIs, microtask queue, task queue.
2. Why does a promise callback run before `setTimeout(fn, 0)`?
3. What are the three promise states? Can a promise change state after settling?
4. `Promise.all` vs `allSettled` vs `race` vs `any`. What happens in `all` if one promise rejects?
5. Implement `Promise.all`, `race`, `any` and `allSettled`.
6. Promise chaining vs `async`/`await`. Does `await` block the thread?
7. How do you run two independent `await`s in parallel?
8. `Promise.resolve()` vs `Promise.reject()`.
9. What does `process.nextTick` do and how is it different from a promise microtask?

## Further reading

- [MDN: Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [javascript.info: Promises, async/await](https://javascript.info/async) and [Event loop](https://javascript.info/event-loop)
- [Jake Archibald: Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/), the classic deep dive with animations
- [Node.js: The event loop, timers and process.nextTick](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)

Next: [DOM, events and browser APIs](/notes/javascript-dom-events).
