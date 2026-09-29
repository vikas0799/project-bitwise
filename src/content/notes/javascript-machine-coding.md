---
title: "JavaScript Machine Coding Round: Polyfills and Utilities"
description: The problems asked in JavaScript machine coding rounds, solved and explained. Polyfills for map, filter, reduce and flat, debounce with leading, cancel and flush, once, memoize, curry, pipe and compose, deepEqual, flatten, groupBy, retry, timeouts, concurrency limits, a custom Promise, EventEmitter, LRU cache, rate limiter and UI problems.
author: Vikas Patel
---

In a machine coding round you're asked to **implement** things you normally import: polyfills, utilities, small classes. Interviewers look for four things: correct behaviour, **edge cases** (empty input, `this`, errors), clean code, and whether you can explain the trade-offs. Every solution below runs in Node or the browser console.

> Related solutions live with their topics: `call`/`apply`/`bind` in [the this keyword](/notes/javascript-this), `Promise.all`/`race`/`any`/`allSettled` in [async JavaScript](/notes/javascript-async), and `deepClone` in [shallow vs deep copy](/notes/shallow-vs-deep-copy).

## Array polyfills

A polyfill adds a missing feature using existing ones. Methods go on `Array.prototype`, so `this` is the array.

```js
Array.prototype.myMap = function (cb, thisArg) {
  if (typeof cb !== "function") throw new TypeError(cb + " is not a function");
  const out = new Array(this.length);
  for (let i = 0; i < this.length; i++) {
    if (i in this) out[i] = cb.call(thisArg, this[i], i, this); // `i in this` skips holes like [1, , 3]
  }
  return out;
};

Array.prototype.myFilter = function (cb, thisArg) {
  const out = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && cb.call(thisArg, this[i], i, this)) out.push(this[i]);
  }
  return out;
};

Array.prototype.myReduce = function (cb, ...init) {
  let i = 0;
  let acc;
  if (init.length) {
    acc = init[0];
  } else {
    while (i < this.length && !(i in this)) i++;          // first real element
    if (i >= this.length) throw new TypeError("Reduce of empty array with no initial value");
    acc = this[i++];
  }
  for (; i < this.length; i++) {
    if (i in this) acc = cb(acc, this[i], i, this);
  }
  return acc;
};

Array.prototype.myFlat = function (depth = 1) {
  const out = [];
  const walk = (arr, d) => {
    for (const item of arr) {
      if (Array.isArray(item) && d > 0) walk(item, d - 1);
      else out.push(item);
    }
  };
  walk(this, depth);
  return out;
};

console.log([1, 2, 3].myMap((n) => n * 2));             // [2, 4, 6]
console.log([1, 2, 3, 4].myFilter((n) => n % 2 === 0)); // [2, 4]
console.log([1, 2, 3].myReduce((a, b) => a + b));       // 6
console.log([1, [2, [3, [4]]]].myFlat(Infinity));       // [1, 2, 3, 4]
```

Why `...init` in `reduce`? Because `reduce(fn, undefined)` is different from `reduce(fn)`: an explicit `undefined` **is** an initial value. Checking the rest array's length tells them apart.

## Function utilities

### Debounce with leading, cancel and flush

The basic debounce is in [DOM and events](/notes/javascript-dom-events). The version interviewers love adds **cleanup** (think React's `useEffect` unmount):

```js
function debounce(fn, delay = 300, { leading = false } = {}) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    const callNow = leading && timer === null;
    lastArgs = args;
    lastThis = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!leading) invoke();
    }, delay);
    if (callNow) invoke();
  }
  function invoke() {
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  }
  debounced.cancel = () => {                  // drop the pending call
    clearTimeout(timer);
    timer = lastArgs = lastThis = null;
  };
  debounced.flush = () => {                   // run the pending call now
    if (timer !== null && lastArgs) {
      clearTimeout(timer);
      timer = null;
      invoke();
    }
  };
  return debounced;
}

const save = debounce((text) => console.log("saved:", text), 100);
save("a"); save("ab"); save("abc");
save.flush();                                 // "saved: abc" immediately
```

### once

```js
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
      fn = null;                               // let the original be garbage-collected
    }
    return result;
  };
}
```

### memoize with a key resolver

```js
function memoize(fn, resolver = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  return function (...args) {
    const key = resolver(...args);
    if (!cache.has(key)) cache.set(key, fn.apply(this, args));
    return cache.get(key);
  };
}

const fib = memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)));
console.log(fib(50)); // 12586269025, instantly: each n is computed once
```

`JSON.stringify` keys fail for arguments that don't serialise (functions, objects with cycles). Pass a custom `resolver` for those.

### curry

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args); // fn.length = number of declared parameters
    return (...rest) => curried.apply(this, [...args, ...rest]);
  };
}

const add3 = curry((a, b, c) => a + b + c);
console.log(add3(1)(2)(3), add3(1, 2)(3), add3(1)(2, 3)); // 6 6 6
```

Infinite currying, `sum(1)(2)(3)()`, is in [functions and closures](/notes/javascript-functions-closures). A variant **without** the final `()` uses type coercion:

```js
function sum(a) {
  const next = (b) => sum(a + b);
  next.valueOf = () => a;          // used when the function is converted to a number
  next.toString = () => String(a); // used when converted to a string
  return next;
}
console.log(+sum(1)(2)(3));   // 6
console.log(`${sum(5)(5)}`);  // "10"
```

### pipe and compose

```js
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);         // left to right
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x); // right to left

const inc = (n) => n + 1;
const double = (n) => n * 2;
console.log(pipe(inc, double)(3));    // 8: (3 + 1) * 2
console.log(compose(inc, double)(3)); // 7: (3 * 2) + 1
```

### promisify

Turns a Node-style callback function, `(err, result) => …`, into one that returns a promise:

```js
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, value) => (err ? reject(err) : resolve(value)));
    });
  };
}
// const readFile = promisify(fs.readFile); await readFile("a.txt", "utf8");
```

## Data and object problems

### deepEqual

```js
function deepEqual(a, b) {
  if (Object.is(a, b)) return true;                      // same reference, equal primitives, NaN
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));
}

console.log(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })); // true
console.log(deepEqual({ a: 1 }, { a: "1" }));                       // false
```

### Flatten an array without recursion

Recursion can overflow the stack on very deep input. An explicit stack can't:

```js
function flattenDeep(arr) {
  const stack = [...arr];
  const out = [];
  while (stack.length) {
    const item = stack.pop();
    if (Array.isArray(item)) stack.push(...item);
    else out.push(item);
  }
  return out.reverse();              // we popped from the end, so reverse once at the end
}
console.log(flattenDeep([1, [2, [3, [4]]], 5])); // [1, 2, 3, 4, 5]
```

### Flatten and unflatten an object

```js
function flattenObject(obj, prefix = "", out = {}) {
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) flattenObject(val, path, out);
    else out[path] = val;
  }
  return out;
}

function unflattenObject(flat) {
  const out = {};
  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split(".");
    let node = out;
    keys.slice(0, -1).forEach((k) => (node = node[k] ??= {}));
    node[keys.at(-1)] = value;
  }
  return out;
}

const flat = flattenObject({ user: { name: "Asha", address: { city: "Delhi" } }, active: true });
console.log(flat);                  // { "user.name": "Asha", "user.address.city": "Delhi", active: true }
console.log(unflattenObject(flat)); // back to the nested object
```

### get: safe deep access

```js
function get(obj, path, fallback) {
  const keys = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let result = obj;
  for (const key of keys) {
    if (result == null) return fallback;
    result = result[key];
  }
  return result === undefined ? fallback : result;
}
console.log(get({ a: [{ b: { c: 3 } }] }, "a[0].b.c")); // 3
console.log(get({ a: 1 }, "x.y.z", "fallback"));       // "fallback"
```

### groupBy and chunk

```js
const users = [
  { name: "Asha", age: 21 },
  { name: "Ravi", age: 22 },
  { name: "Meera", age: 21 },
];

const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = typeof key === "function" ? key(item) : item[key];
    (acc[k] ??= []).push(item);
    return acc;
  }, {});

console.log(Object.keys(groupBy(users, "age")));        // ["21", "22"]
console.log(Object.groupBy(users, (u) => u.age)[21].length); // 2: built in since ES2024

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
console.log(chunk([1, 2, 3, 4, 5], 2)); // [[1, 2], [3, 4], [5]]
```

## Async patterns

### retry with exponential backoff

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retry(fn, { retries = 3, delay = 200, factor = 2 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries) throw err;             // out of attempts: give up
      await sleep(delay * factor ** attempt);        // 200, 400, 800 ms…
    }
  }
}

let calls = 0;
retry(async () => {
  calls++;
  if (calls < 3) throw new Error("flaky");
  return "ok";
}, { delay: 10 }).then((r) => console.log(r, "after", calls, "calls")); // "ok after 3 calls"
```

In production, add **jitter** (a random extra delay) so thousands of clients don't retry at the same moment.

### Timeout for any promise

```js
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
```

For `fetch`, prefer `fetch(url, { signal: AbortSignal.timeout(5000) })`, which also cancels the request.

### Limit concurrency: at most N at a time

A very common ask: "Fetch 100 URLs, but only 3 at a time."

```js
async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;                         // safe: JavaScript is single-threaded
      results[i] = await task(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

let running = 0;
let peak = 0;
mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
  peak = Math.max(peak, ++running);
  await sleep(10);
  running--;
  return n * n;
}).then((r) => console.log(r, "peak:", peak)); // [1, 4, 9, 16, 25, 36] peak: 2
```

### Run tasks in series

```js
async function series(tasks) {
  const results = [];
  for (const task of tasks) results.push(await task());  // each waits for the previous
  return results;
}
```

### Task scheduler with priorities

```js
class Scheduler {
  #queue = [];
  #running = 0;
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
  }
  add(task, priority = 0) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ task, priority, resolve, reject });
      this.#queue.sort((a, b) => b.priority - a.priority);   // highest priority first
      this.#run();
    });
  }
  #run() {
    while (this.#running < this.concurrency && this.#queue.length) {
      const { task, resolve, reject } = this.#queue.shift();
      this.#running++;
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          this.#running--;
          this.#run();
        });
    }
  }
}
```

### A custom Promise (simplified)

"Build a Promise from scratch" tests whether you really understand states, queued callbacks and chaining:

```js
class MyPromise {
  #state = "pending";
  #value;
  #handlers = [];

  constructor(executor) {
    const settle = (state) => (value) => {
      if (this.#state !== "pending") return;            // settles only once
      if (state === "fulfilled" && value && typeof value.then === "function") {
        return value.then(settle("fulfilled"), settle("rejected")); // adopt another promise
      }
      this.#state = state;
      this.#value = value;
      this.#handlers.forEach((h) => h());
    };
    try {
      executor(settle("fulfilled"), settle("rejected"));
    } catch (err) {
      settle("rejected")(err);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const run = () =>
        queueMicrotask(() => {                           // callbacks are always async
          const cb = this.#state === "fulfilled" ? onFulfilled : onRejected;
          if (typeof cb !== "function") {
            return this.#state === "fulfilled" ? resolve(this.#value) : reject(this.#value);
          }
          try {
            resolve(cb(this.#value));                     // the return value feeds the next then
          } catch (err) {
            reject(err);
          }
        });
      if (this.#state === "pending") this.#handlers.push(run);
      else run();
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(fn) {
    return this.then(
      (v) => { fn(); return v; },
      (e) => { fn(); throw e; },
    );
  }

  static resolve(v) {
    return new MyPromise((res) => res(v));
  }
}

new MyPromise((res) => setTimeout(() => res(2), 10))
  .then((n) => n * 5)
  .then((n) => { throw new Error(`got ${n}`); })
  .catch((e) => e.message)
  .then(console.log); // "got 10"
```

The real spec has more details (the full "thenable" resolution procedure, unhandled rejection tracking), but this covers what interviewers check.

## Classic builds

### EventEmitter (publish-subscribe)

```js
class EventEmitter {
  #events = new Map();

  on(name, cb) {
    if (!this.#events.has(name)) this.#events.set(name, new Set());
    this.#events.get(name).add(cb);
    return () => this.off(name, cb);                 // return an unsubscribe function
  }
  once(name, cb) {
    const wrapper = (...args) => {
      this.off(name, wrapper);
      cb(...args);
    };
    return this.on(name, wrapper);
  }
  off(name, cb) {
    const set = this.#events.get(name);
    if (!set) return;
    if (cb) set.delete(cb);
    if (!cb || set.size === 0) this.#events.delete(name);
  }
  emit(name, ...args) {
    const set = this.#events.get(name);
    if (!set) return false;
    [...set].forEach((cb) => cb(...args));           // copy first: a listener may call off()
    return true;
  }
}

const bus = new EventEmitter();
const stop = bus.on("enrol", (course) => console.log("enrolled in", course));
bus.once("enrol", () => console.log("first enrolment!"));
bus.emit("enrol", "JavaScript"); // "enrolled in JavaScript", "first enrolment!"
stop();
console.log(bus.emit("enrol", "DSA")); // false: no listeners left
```

Pub-sub decouples senders from receivers: the sender doesn't know who's listening. Node's `EventEmitter`, DOM events and Redux all use this idea.

### Observable (minimal)

```js
function createObservable(initial) {
  let value = initial;
  const subscribers = new Set();
  return {
    get: () => value,
    set(next) {
      value = next;
      subscribers.forEach((fn) => fn(value));
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
const count = createObservable(0);
count.subscribe((v) => console.log("count is", v));
count.set(1); // "count is 1"
```

### LRU cache in O(1)

A `Map` remembers insertion order, so the **first key is the least recently used**:

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key);                     // move to the end = most recently used
    this.map.set(key, value);
    return value;
  }
  put(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value); // evict the oldest
    }
  }
}

const lru = new LRUCache(2);
lru.put("a", 1); lru.put("b", 2);
lru.get("a");                                 // "a" is now most recent
lru.put("c", 3);                              // evicts "b"
console.log(lru.get("b"), lru.get("a"));      // -1 1
```

In languages without an ordered map, the classic answer is a **hash map + doubly linked list** (see [linked lists](/notes/dsa-linked-list)).

### Rate limiter: N calls per window

```js
function rateLimit(fn, maxCalls, windowMs) {
  let timestamps = [];
  return function (...args) {
    const now = Date.now();
    timestamps = timestamps.filter((t) => now - t < windowMs); // sliding window
    if (timestamps.length >= maxCalls) throw new Error("Rate limit exceeded");
    timestamps.push(now);
    return fn.apply(this, args);
  };
}
```

### Singleton

```js
class Database {
  static #instance;
  constructor() {
    if (Database.#instance) return Database.#instance; // always hand back the same object
    this.connectedAt = Date.now();
    Database.#instance = this;
  }
}
console.log(new Database() === new Database()); // true
```

In Node you rarely need the class: a module is evaluated **once** and cached, so `export const db = connect()` is already a singleton.

### Simplified JSON.stringify

```js
function stringify(value) {
  if (value === null) return "null";
  const type = typeof value;
  if (type === "number") return Number.isFinite(value) ? String(value) : "null";
  if (type === "boolean") return String(value);
  if (type === "string") return `"${value.replace(/["\\]/g, "\\$&")}"`;
  if (type === "undefined" || type === "function" || type === "symbol") return undefined;
  if (typeof value.toJSON === "function") return stringify(value.toJSON()); // Dates
  if (Array.isArray(value)) return `[${value.map((v) => stringify(v) ?? "null").join(",")}]`;
  const pairs = Object.keys(value)
    .filter((k) => stringify(value[k]) !== undefined)
    .map((k) => `"${k}":${stringify(value[k])}`);
  return `{${pairs.join(",")}}`;
}
const sample = { a: [1, "x", null, undefined], b: { c: true }, d: undefined };
console.log(stringify(sample) === JSON.stringify(sample)); // true
```

### getElementsByClassName (DOM traversal)

```js
function getByClass(className, root = document.body) {
  const result = [];
  (function walk(node) {
    if (node.classList?.contains(className)) result.push(node);
    for (const child of node.children) walk(child);   // depth-first, in document order
  })(root);
  return result;
}
```

## UI problems

### Typeahead: debounce plus stale responses

Interviewers check **two** things: debouncing, and ignoring responses that arrive late for an old query.

```js
function createSearch(input, list) {
  let controller = null;

  const run = debounce(async (query) => {
    controller?.abort();                          // cancel the previous request
    if (!query.trim()) return list.replaceChildren();
    controller = new AbortController();
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      const items = await res.json();
      list.replaceChildren(
        ...items.map((item) => {
          const li = document.createElement("li");
          li.textContent = item.name;             // textContent, not innerHTML: no XSS
          li.dataset.id = item.id;
          return li;
        }),
      );
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }
  }, 300);

  input.addEventListener("input", (e) => run(e.target.value));
  list.addEventListener("click", (e) => {        // delegation for picking a result
    const li = e.target.closest("li[data-id]");
    if (li) input.value = li.textContent;
  });
}
```

### Infinite scroll

```js
// Better than a throttled scroll listener: the browser tells you when the sentinel is near
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) loadMore();
  },
  { rootMargin: "200px" },                        // start loading 200px before the end
);
observer.observe(document.querySelector("#sentinel"));
```

### Accordion with delegation

```js
accordion.addEventListener("click", (e) => {
  const header = e.target.closest(".acc-header");
  if (!header) return;
  const item = header.parentElement;
  const wasOpen = item.classList.contains("open");
  accordion.querySelectorAll(".open").forEach((el) => el.classList.remove("open")); // one open at a time
  if (!wasOpen) item.classList.add("open");
  header.setAttribute("aria-expanded", String(!wasOpen));                            // accessibility
});
```

## How to approach the round

1. **Clarify** the exact behaviour: leading or trailing? What if the input is empty? Sync or async?
2. Write the **simplest working version** first, then add edge cases.
3. Keep `this` and arguments: use `fn.apply(this, args)` in wrappers.
4. Clean up: clear timers, remove listeners, return an unsubscribe function.
5. **Test out loud** with 2–3 calls, including an edge case.
6. Mention complexity and what you'd add in production (cancellation, error handling, types).

## Further reading

- [javascript.info](https://javascript.info/): the tasks at the end of each chapter are great practice
- [GreatFrontEnd](https://www.greatfrontend.com/) and [BFE.dev](https://bigfrontend.dev/): large sets of front-end coding questions
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

Next: [Top JavaScript interview questions](/notes/javascript-interview-questions).
