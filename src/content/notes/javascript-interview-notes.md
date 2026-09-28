---
title: JavaScript Interview Notes
description: Debouncing, throttling, event propagation and delegation, polyfills and machine-coding round problems.
author: Vikas Patel
---

#### **Debouncing · Throttling · Event Propagation · Delegation · Machine Coding Round**

---

## **PART 1 — DEBOUNCING**

### **Concept**

**Debouncing** delays the execution of a function until a certain amount of time has passed *without* the event firing again. Every new call **resets the timer**.

> Mental model: "Wait until the user is *done*, then run once."

**Real-life analogy:** An elevator door. Every time someone walks in, the door-close timer restarts. It only closes when nobody has entered for N seconds.

### **Basic Implementation**

```js
function debounce(fn, delay = 300) {
  let timer = null;

  return function (...args) {
    // `this` must be preserved for method calls
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
```

⚠️ Use an **arrow function** inside `setTimeout` so `this` is inherited from the returned function. If you use a normal function, `this` becomes `undefined` / `window`.

### **Usage**

```js
const search = debounce((e) => {
  console.log("API call for:", e.target.value);
}, 500);

input.addEventListener("input", search);
```

### **Debounce with `leading` (immediate) option**

```js
function debounce(fn, delay = 300, immediate = false) {
  let timer = null;

  return function (...args) {
    const callNow = immediate && timer === null;

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(this, args);
    }, delay);

    if (callNow) fn.apply(this, args);
  };
}
```

### **Production-grade debounce ( `cancel` + `flush` )**

This is the version interviewers love — it shows you thought about cleanup (React `useEffect` unmount, route change, etc.).

```js
function debounce(fn, delay = 300) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    }, delay);
  }

  // Discard the pending call
  debounced.cancel = function () {
    clearTimeout(timer);
    timer = null;
    lastArgs = lastThis = null;
  };

  // Run the pending call immediately
  debounced.flush = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      fn.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    }
  };

  debounced.pending = () => timer !== null;

  return debounced;
}
```

### **Where to use debounce**

| Use case | Why |
| --- | --- |
| Search box / autocomplete | Only hit the API when typing stops |
| Form validation on `input` | Don't show errors mid-word |
| Auto-save draft | Save after user pauses |
| Window `resize` → recalculate layout | Fire once after resizing ends |
| Button double-click protection | Ignore rapid repeat clicks |

---

## **PART 2 — THROTTLING**

### **Concept**

**Throttling** guarantees the function runs **at most once every N milliseconds**, no matter how many times the event fires.

> Mental model: "Run regularly, but not more often than X."

**Real-life analogy:** A machine gun with a fixed fire rate. Holding the trigger doesn't make it fire faster.

### **Implementation 1 — Timestamp based (leading edge)**

Fires **immediately** on the first call, then ignores calls until the window passes.

```js
function throttle(fn, limit = 300) {
  let lastCall = 0;

  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}
```

### **Implementation 2 — Timer based (trailing edge)**

Fires at the **end** of each window.

```js
function throttle(fn, limit = 300) {
  let timer = null;

  return function (...args) {
    if (timer) return; // in cooldown — ignore

    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, limit);
  };
}
```

### **Implementation 3 — Leading + trailing (the "correct" one)**

Runs immediately, and also runs once more at the end so the **final** event isn't lost. This matters for scroll — you never want to drop the last scroll position.

```js
function throttle(fn, limit = 300) {
  let lastCall = 0;
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  function invoke(time) {
    lastCall = time;
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  }

  function throttled(...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      invoke(now);
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        invoke(Date.now());
      }, remaining);
    }
  }

  throttled.cancel = function () {
    clearTimeout(timer);
    timer = null;
    lastCall = 0;
    lastArgs = lastThis = null;
  };

  return throttled;
}
```

### **Debounce vs Throttle**

|  | **Debounce** | **Throttle** |
| --- | --- | --- |
| Rule | Runs once after silence | Runs at most once per interval |
| During continuous events | **0 calls** until it stops | Steady calls (e.g. 1 per 200 ms) |
| Timer on each event | **Reset** | **Not reset** |
| 10 s of typing / scrolling @1 event per 50 ms, limit 200 ms | 1 call | ~50 calls |
| Best for | Search, autosave, resize-end, validation | Scroll, mousemove, drag, infinite scroll, rate-limiting API, window resize live |
| Risk | Never fires if events never stop | Fires more than needed |

#### **Visual timeline**

```
Events:    x x x x x     x x x         x
           |---------|---------|---------|  (window = ~)

Debounce:              ▲               ▲     (only after a gap)
Throttle:  ▲     ▲     ▲     ▲   ▲     ▲     (evenly spaced)
```

### **Bonus: `requestAnimationFrame` throttle (best for scroll/animation)**

Ties execution to the browser's paint cycle (~60fps) instead of a guessed number.

```js
function rafThrottle(fn) {
  let queued = false;

  return function (...args) {
    if (queued) return;
    queued = true;

    requestAnimationFrame(() => {
      queued = false;
      fn.apply(this, args);
    });
  };
}
```

---

## **PART 3 — EVENT PROPAGATION**

When you click an element, the event does **not** just fire on that element. It travels through the DOM tree in **three phases**:

```
                    ┌──────────────────┐
                    │     window       │
                    │  ┌────────────┐  │
   1. CAPTURING     │  │  document  │  │      3. BUBBLING
      (top → down)  │  │  ┌──────┐  │  │      (target → up)
         │          │  │  │ html │  │  │            ▲
         │          │  │  │ body │  │  │            │
         ▼          │  │  │ div  │  │  │            │
                    │  │  │ ┌──┐ │  │  │
                    │  │  │ │btn│◄── 2. TARGET PHASE
                    │  │  │ └──┘ │  │  │
                    └──┴──┴──────┴──┴──┘
```

1. **Capturing (trickling) phase** — `window` → `document` → ... → parent of target
1. **Target phase** — the event reaches `event.target`
1. **Bubbling phase** — target → parent → ... → `document` → `window`

### **Registering for each phase**

```js
// Bubbling (DEFAULT)
el.addEventListener("click", handler);
el.addEventListener("click", handler, false);

// Capturing
el.addEventListener("click", handler, true);
el.addEventListener("click", handler, { capture: true });
```

### **Classic interview output question**

```html
<div id="grandparent">
  <div id="parent">
    <button id="child">Click</button>
  </div>
</div>
```

```js
grandparent.addEventListener("click", () => console.log("GP capture"), true);
parent.addEventListener("click",      () => console.log("P capture"),  true);
child.addEventListener("click",       () => console.log("C capture"),  true);

child.addEventListener("click",       () => console.log("C bubble"));
parent.addEventListener("click",      () => console.log("P bubble"));
grandparent.addEventListener("click", () => console.log("GP bubble"));
```

**Output on clicking the button:**

```
GP capture
P capture
C capture     ← on the target, listeners run in REGISTRATION order,
C bubble        not capture-before-bubble
P bubble
GP bubble
```

🔑 **Key rule:** On the **target element itself**, capture vs bubble no longer matters — handlers fire in the order they were **added**.

### **`stopPropagation` vs `stopImmediatePropagation` vs `preventDefault`**

| Method | What it stops |
| --- | --- |
| `e.stopPropagation()` | Stops travel to **other elements**. Other handlers **on the same element** still run. |
| `e.stopImmediatePropagation()` | Stops travel **and** all remaining handlers on the same element. |
| `e.preventDefault()` | Stops the **browser's default action** (link navigation, form submit, checkbox toggle). Propagation continues. |
| `return false` (inline / jQuery) | In **jQuery** = both `preventDefault` + `stopPropagation`. In plain JS `addEventListener` it does **nothing**. |

```js
btn.addEventListener("click", (e) => {
  e.stopPropagation();
  console.log("A"); // runs
});
btn.addEventListener("click", () => console.log("B")); // ALSO runs
parent.addEventListener("click", () => console.log("C")); // does NOT run
// Output: A B
```

Change to `stopImmediatePropagation()` → Output: `A` only.

### **`event.target` vs `event.currentTarget`**

```js
parent.addEventListener("click", function (e) {
  console.log(e.target);        // the ACTUAL clicked element (deepest)
  console.log(e.currentTarget); // the element the listener is ATTACHED to (= parent)
  console.log(this);            // same as currentTarget (in a normal function)
  console.log(e.eventPhase);    // 1=capture, 2=target, 3=bubble
});
```

⚠️ In an **arrow function** handler, `this` is *not* `currentTarget` — use `e.currentTarget`.

### **Events that do NOT bubble**

| Non-bubbling | Bubbling alternative |
| --- | --- |
| `focus`, `blur` | `focusin`, `focusout` |
| `mouseenter`, `mouseleave` | `mouseover`, `mouseout` |
| `load`, `unload`, `error`, `abort` | — |
| `scroll` (on an element; bubbles from `document`) | — |
| `resize` (on `window`) | — |

For non-bubbling events, use **capture phase** delegation:

```js
form.addEventListener("focus", handler, true); // works
form.addEventListener("focusin", handler);     // also works
```

### **Useful extras**

```js
e.composedPath();   // full array of nodes the event passes through
e.isTrusted;        // true = real user action, false = dispatchEvent()
el.dispatchEvent(new CustomEvent("myEvent", {
  detail: { id: 1 },
  bubbles: true,
  cancelable: true
}));

// Auto-removing listener
el.addEventListener("click", fn, { once: true });

// Performance hint for scroll/touch — tells browser you won't preventDefault
window.addEventListener("scroll", fn, { passive: true });

// Modern cleanup with AbortController
const ctrl = new AbortController();
el.addEventListener("click", fn, { signal: ctrl.signal });
ctrl.abort(); // removes ALL listeners registered with this signal
```

---

## **PART 4 — EVENT DELEGATION**

### **Concept**

Instead of attaching a listener to every child, attach **one listener to a common ancestor** and use bubbling + `event.target` to figure out what was clicked.

### **Why it matters**

1. **Performance / memory** — 1 listener instead of 1000.
1. **Dynamic elements** — works for elements added to the DOM *after* the listener was attached.
1. **Cleaner teardown** — one listener to remove.

### **Bad vs Good**

```js
// ❌ BAD — 1000 listeners, breaks for new items
document.querySelectorAll(".item").forEach((el) =>
  el.addEventListener("click", handleClick)
);

// ✅ GOOD — one listener, works forever
list.addEventListener("click", (e) => {
  const item = e.target.closest(".item");
  if (!item || !list.contains(item)) return; // guard
  handleClick(item);
});
```

🔑 **Always use `closest()`**, not `e.target.classList.contains(...)`. If the item contains inner markup (`<span>`, `<svg>`, `<b>`), `e.target` will be the inner node, not the item.

### **Complete delegation example (multi-action toolbar)**

```js
document.getElementById("todoList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const li = btn.closest("li");
  const id = li.dataset.id;

  switch (btn.dataset.action) {
    case "delete": deleteTodo(id); break;
    case "edit":   editTodo(id);   break;
    case "toggle": toggleTodo(id); break;
  }
});
```

```html
<ul id="todoList">
  <li data-id="1">
    Buy milk
    <button data-action="toggle">✓</button>
    <button data-action="edit">✎</button>
    <button data-action="delete">🗑</button>
  </li>
</ul>
```

### **Reusable `delegate` helper (common machine-coding ask)**

```js
function delegate(root, eventType, selector, handler, options) {
  const listener = function (e) {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) {
      handler.call(target, e, target);
    }
  };
  root.addEventListener(eventType, listener, options);
  return () => root.removeEventListener(eventType, listener, options); // unsubscribe
}

// Usage
const off = delegate(document.body, "click", ".btn", function (e) {
  console.log("clicked", this.textContent);
});
off(); // cleanup
```

### **Limitations of delegation**

- Doesn't work directly for **non-bubbling** events (use `capture: true` or the `focusin`/`focusout` variants).
- A child calling `stopPropagation()` **breaks** the parent's delegated handler.
- `e.target` needs careful handling with nested markup and Shadow DOM (`composedPath()`).
- Very deep DOM → slightly more traversal work per event (negligible in practice).

---

## **PART 5 — MACHINE CODING ROUND (JS Only)**

### **5.1 Polyfills**

#### **`map` , `filter` , `reduce` , `forEach`**

```js
Array.prototype.myMap = function (cb, thisArg) {
  if (typeof cb !== "function") throw new TypeError(cb + " is not a function");
  const out = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) out[i] = cb.call(thisArg, this[i], i, this);
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

Array.prototype.myReduce = function (cb, initial) {
  if (this.length === 0 && arguments.length < 2)
    throw new TypeError("Reduce of empty array with no initial value");

  let acc = initial;
  let startIndex = 0;

  if (arguments.length < 2) {
    acc = this[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < this.length; i++) {
    acc = cb(acc, this[i], i, this);
  }
  return acc;
};

Array.prototype.myForEach = function (cb, thisArg) {
  for (let i = 0; i < this.length; i++) {
    if (i in this) cb.call(thisArg, this[i], i, this);
  }
  return undefined;
};
```

#### **`call` , `apply` , `bind`**

```js
Function.prototype.myCall = function (context, ...args) {
  context = context ?? globalThis;
  const key = Symbol("fn");           // avoid overwriting existing props
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

Function.prototype.myApply = function (context, argsArray = []) {
  return this.myCall(context, ...argsArray);
};

Function.prototype.myBind = function (context, ...boundArgs) {
  const fn = this;
  if (typeof fn !== "function") throw new TypeError("not a function");

  function bound(...callArgs) {
    // support `new boundFn()`
    const isNew = this instanceof bound;
    return fn.apply(isNew ? this : context, [...boundArgs, ...callArgs]);
  }

  bound.prototype = Object.create(fn.prototype || null);
  return bound;
};
```

#### **`Promise.all` / `allSettled` / `any` / `race`**

```js
function promiseAll(iterable) {
  const items = [...iterable];
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let pending = items.length;
    if (pending === 0) return resolve([]);

    items.forEach((item, i) => {
      Promise.resolve(item).then((val) => {
        results[i] = val;
        if (--pending === 0) resolve(results);
      }, reject); // first rejection wins
    });
  });
}

function promiseAllSettled(iterable) {
  const items = [...iterable];
  return Promise.all(
    items.map((p) =>
      Promise.resolve(p).then(
        (value) => ({ status: "fulfilled", value }),
        (reason) => ({ status: "rejected", reason })
      )
    )
  );
}

function promiseAny(iterable) {
  const items = [...iterable];
  return new Promise((resolve, reject) => {
    const errors = new Array(items.length);
    let pending = items.length;
    if (pending === 0)
      return reject(new AggregateError([], "All promises were rejected"));

    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (err) => {
        errors[i] = err;
        if (--pending === 0)
          reject(new AggregateError(errors, "All promises were rejected"));
      });
    });
  });
}

function promiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {
      Promise.resolve(item).then(resolve, reject);
    }
  });
}
```

---

### **5.2 Function Utilities**

#### **`once`**

```js
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (called) return result;
    called = true;
    result = fn.apply(this, args);
    fn = null; // free the reference
    return result;
  };
}
```

#### **`memoize`**

```js
function memoize(fn, resolver) {
  const cache = new Map();
  return function (...args) {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const slowSquare = (n) => { for (let i = 0; i < 1e7; i++); return n * n; };
const fast = memoize(slowSquare);
```

#### **`curry`**

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return function (...rest) {
      return curried.apply(this, [...args, ...rest]);
    };
  };
}

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);   // 6
add(1, 2)(3);   // 6
add(1)(2, 3);   // 6
```

#### **Infinite currying — `sum(1)(2)(3)()`**

```js
function sum(a) {
  return function (b) {
    if (b === undefined) return a;
    return sum(a + b);
  };
}
sum(1)(2)(3)(); // 6
```

**Variant without the final `()`** — using `toString` coercion:

```js
function sum(a) {
  const fn = (b) => sum(a + b);
  fn.valueOf = () => a;
  fn.toString = () => String(a);
  return fn;
}
console.log(+sum(1)(2)(3));      // 6
console.log(`${sum(5)(5)}`);     // "10"
```

#### **`pipe` and `compose`**

```js
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

const inc = (n) => n + 1;
const dbl = (n) => n * 2;

pipe(inc, dbl)(3);    // 8   → (3+1)*2
compose(inc, dbl)(3); // 7   → (3*2)+1
```

#### **`promisify`**

```js
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, ...values) => {
        if (err) return reject(err);
        resolve(values.length > 1 ? values : values[0]);
      });
    });
  };
}
```

---

### **5.3 Data / Object Problems**

#### **`deepClone` (handles circular refs, Date, Map, Set, Array)**

```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value); // circular reference

  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);

  if (value instanceof Map) {
    const out = new Map();
    seen.set(value, out);
    value.forEach((v, k) => out.set(deepClone(k, seen), deepClone(v, seen)));
    return out;
  }

  if (value instanceof Set) {
    const out = new Set();
    seen.set(value, out);
    value.forEach((v) => out.add(deepClone(v, seen)));
    return out;
  }

  const out = Array.isArray(value)
    ? []
    : Object.create(Object.getPrototypeOf(value));
  seen.set(value, out);

  for (const key of Reflect.ownKeys(value)) {
    out[key] = deepClone(value[key], seen);
  }
  return out;
}
```

> Modern alternative: `structuredClone(obj)` — built in, handles cycles, but drops functions and prototypes.

#### **`deepEqual`**

```js
function deepEqual(a, b) {
  if (a === b) return true;                       // handles primitives, same ref
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null)
    return false;

  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k])
  );
}
```

#### **`flatten` an array (custom depth)**

```js
// Recursive
function flatten(arr, depth = 1) {
  return depth > 0
    ? arr.reduce(
        (acc, val) =>
          acc.concat(Array.isArray(val) ? flatten(val, depth - 1) : val),
        []
      )
    : arr.slice();
}

// Iterative (no stack overflow on deep nesting)
function flattenDeep(arr) {
  const stack = [...arr];
  const out = [];
  while (stack.length) {
    const item = stack.pop();
    if (Array.isArray(item)) stack.push(...item);
    else out.push(item);
  }
  return out.reverse();
}
```

#### **Flatten / unflatten a nested object**

```js
function flattenObject(obj, prefix = "", out = {}) {
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      flattenObject(val, path, out);
    } else {
      out[path] = val;
    }
  }
  return out;
}
// { a: { b: { c: 1 } } }  →  { "a.b.c": 1 }

function unflattenObject(flat) {
  const out = {};
  for (const path in flat) {
    path.split(".").reduce((acc, key, i, arr) => {
      return (acc[key] = i === arr.length - 1 ? flat[path] : acc[key] || {});
    }, out);
  }
  return out;
}
```

#### **`get` (safe deep access, like lodash)**

```js
function get(obj, path, defaultValue) {
  const keys = Array.isArray(path)
    ? path
    : path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);

  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

get({ a: [{ b: { c: 3 } }] }, "a[0].b.c");     // 3
get({ a: 1 }, "x.y.z", "fallback");            // "fallback"
```

#### **`groupBy` and `chunk`**

```js
const groupBy = (arr, keyFn) =>
  arr.reduce((acc, item) => {
    const key = typeof keyFn === "function" ? keyFn(item) : item[keyFn];
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
```

---

### **5.4 Async Patterns**

#### **`retry` with exponential backoff**

```js
async function retry(fn, { retries = 3, delay = 500, factor = 2 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, delay * factor ** attempt));
    }
  }
  throw lastError;
}
```

#### **`withTimeout`**

```js
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
```

#### **Concurrency limiter (map with max N in flight)**

Very common ask: *"Fetch 100 URLs but only 3 at a time."*

```js
async function mapLimit(items, limit, asyncFn) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await asyncFn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

// await mapLimit(urls, 3, (url) => fetch(url).then(r => r.json()));
```

#### **Run promises in series**

```js
const series = (tasks) =>
  tasks.reduce(
    (chain, task) => chain.then((acc) => task().then((r) => [...acc, r])),
    Promise.resolve([])
  );
```

#### **`sleep` + async pipeline**

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const asyncPipe = (...fns) => (input) =>
  fns.reduce((p, fn) => p.then(fn), Promise.resolve(input));
```

#### **Cancel all pending timers**

```js
function clearAllTimers() {
  const maxId = setTimeout(() => {}, 0);
  for (let id = maxId; id >= 0; id--) {
    clearTimeout(id);
    clearInterval(id);
  }
}
```

---

### **5.5 Classic Machine-Coding Builds**

#### **EventEmitter / Pub-Sub**

```js
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(name, cb) {
    if (!this.events.has(name)) this.events.set(name, new Set());
    this.events.get(name).add(cb);
    return () => this.off(name, cb); // unsubscribe fn
  }

  once(name, cb) {
    const wrapper = (...args) => {
      this.off(name, wrapper);
      cb(...args);
    };
    return this.on(name, wrapper);
  }

  off(name, cb) {
    const set = this.events.get(name);
    if (!set) return;
    cb ? set.delete(cb) : this.events.delete(name);
    if (set.size === 0) this.events.delete(name);
  }

  emit(name, ...args) {
    const set = this.events.get(name);
    if (!set) return false;
    [...set].forEach((cb) => cb(...args)); // copy → safe if cb calls off()
    return true;
  }
}
```

#### **LRU Cache (O(1) using `Map` insertion order)**

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value); // move to most-recent
    return value;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      this.map.delete(this.map.keys().next().value); // evict oldest
    }
    this.map.set(key, value);
  }
}
```

#### **In-memory cache with TTL**

```js
class TTLCache {
  constructor() { this.store = new Map(); }

  set(key, value, ttlMs) {
    const expiry = Date.now() + ttlMs;
    this.store.set(key, { value, expiry });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }
}
```

#### **Rate limiter (N calls per window)**

```js
function rateLimit(fn, maxCalls, windowMs) {
  let timestamps = [];

  return function (...args) {
    const now = Date.now();
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxCalls) {
      throw new Error("Rate limit exceeded");
    }
    timestamps.push(now);
    return fn.apply(this, args);
  };
}
```

#### **Custom `JSON.stringify` (simplified)**

```js
function stringify(value) {
  if (value === null) return "null";
  const type = typeof value;

  if (type === "number") return Number.isFinite(value) ? String(value) : "null";
  if (type === "boolean") return String(value);
  if (type === "string") return `"${value.replace(/"/g, '\\"')}"`;
  if (type === "undefined" || type === "function") return undefined;

  if (Array.isArray(value)) {
    return `[${value.map((v) => stringify(v) ?? "null").join(",")}]`;
  }

  const pairs = Object.keys(value)
    .map((k) => {
      const v = stringify(value[k]);
      return v === undefined ? null : `"${k}":${v}`;
    })
    .filter(Boolean);

  return `{${pairs.join(",")}}`;
}
```

#### **`getElementsByClassName` polyfill (DOM traversal)**

```js
function getByClass(className, root = document.body) {
  const result = [];

  function traverse(node) {
    if (node.classList?.contains(className)) result.push(node);
    for (const child of node.children) traverse(child);
  }

  traverse(root);
  return result;
}
```

---

### **5.6 UI Machine-Coding Problems (using the above)**

#### **Typeahead / Autocomplete (debounce + race-condition fix)**

```js
function createSearch(input, resultsEl) {
  let controller = null;

  const run = debounce(async (query) => {
    if (!query.trim()) return (resultsEl.innerHTML = "");

    controller?.abort();            // cancel the previous in-flight request
    controller = new AbortController();

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      resultsEl.innerHTML = data
        .map((d) => `<li data-id="${d.id}">${d.name}</li>`)
        .join("");
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }
  }, 300);

  input.addEventListener("input", (e) => run(e.target.value));

  // delegation for selecting a result
  resultsEl.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li) input.value = li.textContent;
  });
}
```

🔑 Two things interviewers check here: **debounce** *and* **stale-response handling** (AbortController or a request-id check).

#### **Infinite scroll — throttle version vs observer version**

```js
// Throttle approach
const onScroll = throttle(() => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 200) loadMore();
}, 200);

window.addEventListener("scroll", onScroll, { passive: true });

// Better: IntersectionObserver (no scroll listener at all)
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) loadMore();
  },
  { rootMargin: "200px" }
);
observer.observe(document.querySelector("#sentinel"));
```

#### **Accordion using delegation**

```js
accordion.addEventListener("click", (e) => {
  const header = e.target.closest(".acc-header");
  if (!header) return;

  const item = header.parentElement;
  const isOpen = item.classList.contains("open");

  // single-open behaviour
  accordion.querySelectorAll(".open").forEach((el) => el.classList.remove("open"));
  if (!isOpen) item.classList.add("open");
});
```

#### **Star rating using delegation**

```js
stars.addEventListener("click", (e) => {
  const star = e.target.closest("[data-value]");
  if (!star) return;
  setRating(Number(star.dataset.value));
});

stars.addEventListener("mouseover", (e) => {
  const star = e.target.closest("[data-value]");
  if (star) preview(Number(star.dataset.value));
});
```

---

### **5.7 Output-Based Questions (very common warm-ups)**

#### **Q1 — `var` in a loop**

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
// 3 3 3   → one shared `i`, loop finishes before timers run

for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
// 0 1 2   → `let` creates a new binding per iteration
```

Fix with `var` using an IIFE: `(function (j) { setTimeout(() => console.log(j)) })(i)`

#### **Q2 — Event loop ordering**

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
queueMicrotask(() => console.log("4"));
console.log("5");

// 1 5 3 4 2
// sync → microtasks (promises, queueMicrotask) → macrotasks (setTimeout)
```

#### **Q3 — `this` binding**

```js
const obj = {
  name: "A",
  regular() { return this.name; },
  arrow: () => this?.name,
};
obj.regular();  // "A"
obj.arrow();    // undefined (arrow captures module/global `this`)

const fn = obj.regular;
fn();           // undefined — lost `this` (strict mode) / global (sloppy)
fn.call(obj);   // "A"
```

#### **Q4 — Hoisting / TDZ**

```js
console.log(a); // undefined  (var is hoisted, initialised to undefined)
var a = 1;

console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 2;
```

#### **Q5 — Closure counter**

```js
function counter() {
  let count = 0;
  return { inc: () => ++count, get: () => count };
}
const c1 = counter(), c2 = counter();
c1.inc(); c1.inc(); c2.inc();
c1.get(); // 2
c2.get(); // 1  → separate closures
```

#### **Q6 — Debounce trace**

```js
const log = debounce(() => console.log("fired"), 100);
log(); log(); log();     // after 100ms → "fired"  (once)
```

With `throttle(fn, 100)` (leading): fires **immediately once**, the next two are swallowed.

---

## **Quick Revision Cheat Sheet**

- **Debounce** = reset timer on every call → runs once after silence. Search boxes.
- **Throttle** = ignore calls inside the cooldown → runs at a steady rate. Scroll/mousemove.
- Always `apply(this, args)` in wrappers so methods keep their receiver.
- Add `cancel()` / `flush()` — shows real-world thinking (React cleanup).
- Propagation phases: **capture (1) → target (2) → bubble (3)**.
- Third arg of `addEventListener`: `true` = capture, `false`/omitted = bubble.
- On the target itself → **registration order** wins, not phase.
- `stopPropagation` ≠ `stopImmediatePropagation` ≠ `preventDefault`.
- `e.target` = clicked node · `e.currentTarget` = listener owner.
- Delegation = 1 parent listener + `e.target.closest(selector)` + guard.
- `focus`/`blur`/`mouseenter`/`mouseleave` don't bubble → use `focusin`/`focusout`/`mouseover`/`mouseout` or `capture: true`.
- Use `{ passive: true }` for scroll/touch, `{ once: true }` for one-shot, `AbortController` for bulk cleanup.
