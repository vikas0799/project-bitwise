---
title: "Top 100 JavaScript Interview Questions (with Answers)"
description: The 15 must-prepare topics for product companies, then 100 hard JavaScript interview questions with short answers, verified outputs and links to detailed notes. Event loop, closures, this, prototypes, promises, polyfills, memory, modules, the DOM, coding problems and V8 internals.
author: Vikas Patel
---

This is a revision list, not a textbook. Each answer is short, the kind you'd say in the first minute of an interview, with a link to the detailed note when you need depth. All outputs were run in Node.js.

> **How to use this list:** go through the **must-prepare 15** first. For every question, answer out loud before reading the answer. For every "implement" question, write the code without looking, then compare.

## Recommended: the must-prepare 15

These come up again and again at MAANG and top product companies. If you have one week, spend it here.

| # | Topic | Study it in |
| --- | --- | --- |
| 1 | Event loop: microtasks vs macrotasks (task queue vs microtask queue) | [Async JavaScript](/notes/javascript-async) |
| 2 | Closures | [Functions and closures](/notes/javascript-functions-closures) |
| 3 | The `this` keyword | [The this keyword](/notes/javascript-this) |
| 4 | Prototypes and the prototype chain | [Objects, prototypes and classes](/notes/javascript-objects-prototypes) |
| 5 | Execution context | [How JavaScript runs](/notes/javascript-execution-context) |
| 6 | Hoisting and the temporal dead zone | [How JavaScript runs](/notes/javascript-execution-context) |
| 7 | `call`, `apply` and `bind`, with polyfills | [The this keyword](/notes/javascript-this) |
| 8 | Promises and async/await | [Async JavaScript](/notes/javascript-async) |
| 9 | Debouncing and throttling | [DOM and events](/notes/javascript-dom-events) |
| 10 | Currying and memoisation | [Functions and closures](/notes/javascript-functions-closures) |
| 11 | Deep copy vs shallow copy | [Shallow vs deep copy](/notes/shallow-vs-deep-copy) |
| 12 | Event bubbling, capturing and delegation | [DOM and events](/notes/javascript-dom-events) |
| 13 | Garbage collection and memory leaks | questions 47–50 below |
| 14 | Polyfills for common methods | [Machine coding](/notes/javascript-machine-coding) |
| 15 | Tricky output-based questions | questions 67–75 below |

## Event loop, scope and closures

### 1. Explain the event loop in detail.

JavaScript has one **call stack**. Slow work (timers, network, events) is handed to **Web APIs** (browser) or **libuv** (Node). When it finishes, its callback is queued. Promise callbacks, code after `await` and `queueMicrotask` go to the **microtask queue**; `setTimeout`, `setInterval`, I/O and DOM events go to the **task (macrotask) queue**. The loop: run the sync code → empty the **whole** microtask queue → run **one** task → empty microtasks again → repeat. That's why a promise callback always runs before `setTimeout(fn, 0)`. `async` functions run synchronously until the first `await`; the rest is a microtask. [Diagram and details](/notes/javascript-async).

### 2. Predict the output.

```js
console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
queueMicrotask(() => console.log(4));
console.log(5);
```

**`1 5 3 4 2`**: sync first, then microtasks in queue order, then the timer task.

### 3. var vs let vs const?

`var` is function-scoped, hoisted as `undefined`, can be redeclared, and a global `var` becomes a `window` property. `let` and `const` are block-scoped, hoisted but stay in the **TDZ** until their line, and can't be redeclared. `const` can't be reassigned, but the object it points to can still change. [Full table](/notes/javascript-basics).

### 4. What is a closure? Why useful? Can it leak memory?

A function plus the variables of the scope where it was created; it keeps them alive after the outer function returns. Used for **private variables** (a counter, a bank balance), function factories, `once`, `memoize`, `debounce`. It can **leak** when a long-lived closure (a global callback, an event listener you never remove) references large data that could otherwise be freed. [Closures](/notes/javascript-functions-closures).

### 5–10. Implement map, filter, reduce, bind, call and apply.

`map`, `filter` and `reduce` are in [machine coding](/notes/javascript-machine-coding). `call`, `apply` and `bind` are in [the this keyword](/notes/javascript-this). Key points to mention: skip holes (`i in this`), pass `thisArg`, `reduce` without an initial value uses the first element and throws on an empty array, and `call` works by temporarily attaching the function to the object under a `Symbol` key.

## Objects and prototypes

### 11. Explain the prototype chain.

Every object has a hidden `[[Prototype]]` link to another object. A property lookup checks the object, then its prototype, then that object's prototype, until it finds the property or reaches `null`. Methods live **once** on the prototype and are shared by every instance, which saves memory. [Diagram](/notes/javascript-objects-prototypes).

### 12. `__proto__` vs `prototype` vs `constructor`?

`Fn.prototype` is a property of a **function**: the object that instances made with `new Fn()` will inherit from. `obj.__proto__` is an instance's actual prototype (use `Object.getPrototypeOf(obj)` instead). `Fn.prototype.constructor` points back to `Fn`. So `Object.getPrototypeOf(new Fn()) === Fn.prototype`.

### 13. How does inheritance work in JavaScript?

Through the prototype chain: an object delegates missing property lookups to its prototype. `class Dog extends Animal` just sets `Dog.prototype`'s prototype to `Animal.prototype` (and `Dog`'s own prototype to `Animal`, for static methods).

### 14. Create inheritance without using class.

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} makes a sound`;
};

function Dog(name) {
  Animal.call(this, name);                       // like super(name)
}
Dog.prototype = Object.create(Animal.prototype); // link the chains
Dog.prototype.constructor = Dog;                 // restore constructor
Dog.prototype.bark = function () {
  return "Woof";
};

const d = new Dog("Tommy");
console.log(d.speak(), d.bark(), d instanceof Animal); // Tommy makes a sound Woof true
```

### 15. `Object.create()` vs `new Object()` vs `{}` vs `new`?

`{}` and `new Object()` are the same: a new object whose prototype is `Object.prototype` (the literal is shorter and faster). `Object.create(p)` makes an empty object with prototype `p`, and `Object.create(null)` one with **no** prototype. `new Fn()` creates an object with prototype `Fn.prototype`, runs `Fn` with `this` set to it, and returns it.

### 16. How does `instanceof` work internally?

`a instanceof F` walks `a`'s prototype chain and returns `true` if it finds `F.prototype`. It doesn't check who constructed the object; changing `F.prototype` later changes the answer. [Implementation](/notes/javascript-objects-prototypes).

## The this keyword

### 17. Predict the output.

```js
const obj = {
  name: "John",
  show() {
    console.log(this.name);
  },
};
const fn = obj.show;
fn();
```

`this` is lost: `fn()` is a plain call, so the **default binding** applies. In strict mode or an ES module, `this` is `undefined` and you get a **TypeError**. In an old sloppy browser script, `this` is `window` and it prints `window.name` (usually `""`). Fix with `obj.show()` or `obj.show.bind(obj)`.

### 18. Predict the output, and why?

```js
const obj = {
  name: "Alex",
  arrow: () => {
    console.log(this.name);
  },
};
obj.arrow();
```

**Not "Alex".** Arrow functions have no own `this`; they take it from the surrounding code, and an object literal isn't a scope. So `this` is the module's or script's `this`: `undefined` in an ES module (TypeError), `module.exports` (`{}`) in CommonJS (prints `undefined`), `window` in a browser script.

### 19. Arrow function vs normal function?

Arrows have no own `this`, `arguments`, `prototype` or `super`, can't be called with `new`, and can't be generators. Their `this` is fixed from where they're written. Use normal functions (or method shorthand) for object methods and constructors, and arrows for callbacks.

### 20. Can an arrow function be a constructor? Why?

No, `new (() => {})` throws a TypeError. `new` needs a function with its own `this` to bind the new object to and a `prototype` property for the object to inherit from; arrow functions have neither (they lack the internal `[[Construct]]` method).

## Async JavaScript

### 21. Explain a Promise internally.

A promise holds a **state** (pending → fulfilled or rejected, once only), a **value or reason**, and a list of **handlers** registered by `then` while it's pending. `resolve`/`reject` set the state and schedule the handlers as **microtasks**. `then` always returns a **new promise** resolved with whatever the handler returns (or rejected with what it throws), which is what makes chaining work. If a handler returns a promise, the new promise follows it. [A custom Promise](/notes/javascript-machine-coding).

### 22. Promise chaining vs async/await?

Same promises underneath. `async`/`await` reads top to bottom, uses `try`/`catch`, and makes loops and conditions natural. Chains are fine for short pipelines. Neither blocks the thread: `await` pauses only its own function.

### 23–26. Implement Promise.all, race, any and allSettled.

See [Async JavaScript](/notes/javascript-async). Checklist: wrap items with `Promise.resolve`, keep **input order** with an index, handle an empty array, `all` rejects on the first rejection, `any` rejects with an `AggregateError` only when all fail, `allSettled` never rejects.

### 27. What happens if one promise rejects?

In `Promise.all`, the combined promise **rejects immediately** with that reason. The other promises keep running (promises can't be cancelled), but their results are ignored. Use `allSettled` to get every outcome. In a chain, a rejection skips the following `then`s until the nearest `catch`. An unhandled rejection crashes a modern Node process.

### 28. `Promise.resolve()` vs `Promise.reject()`?

`Promise.resolve(v)` returns a promise fulfilled with `v` (or, if `v` is already a promise, that same promise). `Promise.reject(e)` returns a promise rejected with `e`. Both are handy for tests, default values and starting chains.

### 29. Output?

```js
async function test() {
  console.log(1);
  await Promise.resolve();
  console.log(2);
}
console.log(3);
test();
console.log(4);
```

**`3 1 4 2`**: `test` runs synchronously until `await`, and everything after `await` is a microtask.

### 30. Output?

```js
setTimeout(() => console.log("A"), 0);
Promise.resolve().then(() => console.log("B"));
console.log("C");
```

**`C B A`**: sync, then microtask, then task.

## Execution context

### 31. What is an execution context?

The environment a piece of code runs in: its variables (lexical environment), a link to the outer scope, and the value of `this`. The **global** context is created when the script starts; a new **function** context is created on every call and pushed on the **call stack**. [Diagram](/notes/javascript-execution-context).

### 32. Memory phase vs execution phase?

In the **memory (creation) phase**, the engine scans the code: `var`s are set to `undefined`, `let`/`const`/`class` are created but uninitialised (TDZ), and function declarations are stored whole. In the **execution phase**, code runs line by line and assigns real values.

### 33. How does hoisting work internally?

It isn't code moving. It's the memory phase: declarations are registered before any line runs. That's why a function declaration can be called above its line, `var` reads `undefined`, and `let` throws a ReferenceError (it exists but is in the TDZ).

### 34. What is a lexical environment?

A record of the variables in a scope plus a reference to its **outer** lexical environment, fixed by where the code is **written**. Closures are functions keeping a reference to their lexical environment.

### 35. What is the scope chain?

The chain of lexical environments followed outward when a variable isn't found locally: block → function → outer function → global. Lookups only go outward, never inward. If nothing is found, you get a ReferenceError.

## Advanced functions

### 36–37. Currying and infinite currying.

`sum(1)(2)(3)`: return a function per argument, `(a) => (b) => (c) => a + b + c`. Infinite currying `sum(1)(2)(3)(4)(5)()` returns a function that adds until it's called with no argument. A general `curry(fn)` compares collected arguments with `fn.length`. [Code](/notes/javascript-functions-closures) and [curry helper](/notes/javascript-machine-coding).

### 38–39. Debouncing and throttling.

**Debounce:** reset a timer on every call; run once after `wait` ms of silence (search box). **Throttle:** run at most once per `wait` ms (scroll). Preserve `this` and arguments with `fn.apply(this, args)`. [Implementations and diagram](/notes/javascript-dom-events).

### 40. Memoisation.

Cache results by argument in a `Map` kept in a closure; return the cached value on repeat calls. Only for pure functions. Watch the cache size. [Code](/notes/javascript-functions-closures).

## Polyfills

### 41. Polyfills for map, filter, reduce, bind, call, apply, Promise.all, Promise.race, flat and flatMap.

All are covered in [machine coding](/notes/javascript-machine-coding), [the this keyword](/notes/javascript-this) and [async JavaScript](/notes/javascript-async). `flatMap` is `map` followed by `flat(1)`:

```js
Array.prototype.myFlatMap = function (cb, thisArg) {
  return this.map(cb, thisArg).flat(1);
};
console.log([1, 2].myFlatMap((n) => [n, n * 10])); // [1, 10, 2, 20]
```

## Object questions

### 42. freeze vs seal vs preventExtensions?

`preventExtensions`: can't add properties. `seal`: can't add or delete, can still change values. `freeze`: can't add, delete or change. All three are **shallow**. [Table](/notes/shallow-vs-deep-copy).

### 43. Deep copy vs shallow copy?

A shallow copy (`{...obj}`, `Object.assign`, `slice`) copies the top level; nested objects are shared. A deep copy (`structuredClone`) duplicates every level. [Diagram](/notes/shallow-vs-deep-copy).

### 44. When does `JSON.parse(JSON.stringify())` fail?

Dates become strings; functions, `undefined` and symbols disappear; `NaN` and `Infinity` become `null`; `Map` and `Set` become `{}`; circular references and `BigInt` throw; prototypes are lost.

### 45. Implement deep clone.

Recurse over own keys, handle `Date`, `RegExp`, `Map`, `Set` and arrays, and keep a `WeakMap` of already-copied objects for circular references. [Code](/notes/shallow-vs-deep-copy).

### 46. `Object.assign()` vs spread?

Both are shallow. `Object.assign(target, …)` **mutates** its target and triggers setters on it; spread always creates a new object and defines plain properties. For a new object, prefer spread.

## Memory management

### 47. How does garbage collection work?

JavaScript frees memory automatically using **reachability**: starting from roots (globals, the current call stack, closures in use), the collector marks everything reachable; the rest is swept (**mark-and-sweep**). V8 is **generational**: most objects die young, so a fast "scavenger" collects the young generation often, and a slower mark-compact collects the old generation, mostly in parallel and concurrently. Circular references are **not** a problem, unlike simple reference counting.

### 48. WeakMap vs Map?

A `WeakMap`'s keys must be objects (or non-registered symbols) and are held **weakly**: if nothing else references a key, the entry can be garbage-collected. So a `WeakMap` isn't iterable and has no `size`. Use it to attach data to objects you don't own (DOM nodes, cached results per object) without leaking them.

### 49. WeakSet vs Set?

Same idea: a `WeakSet` holds objects weakly, isn't iterable, and is used for "have I seen this object?" checks (for example, visited nodes, or marking objects as processed).

### 50. Memory leak examples.

- Timers and intervals that are never cleared.
- Event listeners that are never removed (especially on long-lived elements or `window`).
- Detached DOM nodes still referenced from JavaScript.
- Accidental globals (assigning to an undeclared variable in sloppy mode).
- Closures holding large data longer than needed.
- Caches and arrays that grow forever (use a limit, an LRU, or a `WeakMap`).

Find them with DevTools → Memory → heap snapshots, comparing before and after an action.

## Modules

### 51. CommonJS vs ES modules?

| | CommonJS | ES modules |
| --- | --- | --- |
| syntax | `require()`, `module.exports` | `import`, `export` |
| loading | synchronous, at run time | static structure, analysed before running |
| exports | a copy of the value at require time | **live bindings** |
| top-level `await` | no | yes |
| `this` at top level | `module.exports` | `undefined` |
| tree shaking | hard | easy |
| in Node | `.cjs`, or `.js` by default | `.mjs`, or `.js` with `"type": "module"` |

ES modules are the standard for new code. Recent Node versions can even `require()` most ES modules. [Node.js fundamentals](/notes/nodejs-fundamentals).

### 52. Dynamic import?

`import("./chart.js")` loads a module **at run time** and returns a promise. It's used for **code splitting**: load heavy code only when needed (a chart when the tab opens, an admin page on navigation). React's `lazy()` uses it.

### 53. Tree shaking?

The bundler removes exports that are never imported. It works because static `import`/`export` can be analysed without running the code. It needs ES modules, and packages that mark themselves side-effect-free (`"sideEffects": false`).

### 54. How do modules work internally?

**ES modules** load in three phases: **construction** (fetch and parse files, follow `import`s to build the module graph), **instantiation** (create live bindings between exports and imports) and **evaluation** (run each module once, in dependency order). **CommonJS** wraps each file in a function `(exports, require, module, __filename, __dirname) => { … }`, runs it synchronously on the first `require`, and caches `module.exports`. Both run a module only once and cache it.

## Classes

### 55. Class vs constructor function?

Classes are syntax over constructor functions and prototypes, with stricter behaviour: they must be called with `new`, are always strict, sit in the TDZ until declared, and support `extends`, `super`, private `#fields` and `static` natively. [Table](/notes/javascript-objects-prototypes).

### 56. Private fields (`#balance`)?

Fields that start with `#` are truly private: accessing them from outside the class is a **SyntaxError**. Unlike the old `_balance` convention, nothing outside can read or change them.

### 57. Static methods?

Methods on the **class itself**, not on instances: `Account.compare(a, b)`, `Math.max`, `Array.from`. Used for helpers and factories.

### 58. Method overriding?

A subclass defines a method with the same name as its parent's; lookups find the subclass version first on the prototype chain. Call the parent's version with `super.method()`.

### 59. Can JavaScript do method overloading?

No. Defining two methods with the same name keeps only the last one. Emulate it inside one method by checking the number or types of arguments, or by using default parameters and an options object.

## Browser

### 60. DOM vs BOM vs virtual DOM?

The **DOM** is the page as a tree of objects. The **BOM** is the browser around it: `window`, `location`, `history`, `navigator`, `screen`. The **virtual DOM** is a JavaScript copy of the UI that libraries like React diff to apply the minimum changes. [Details](/notes/javascript-dom-events).

### 61–65. Delegation, bubbling, capturing, stopPropagation, preventDefault.

Events travel **down** (capture), reach the **target**, then travel **up** (bubble); listeners run in the bubble phase by default. **Delegation** puts one listener on a parent and uses `e.target.closest(selector)`. `stopPropagation()` stops the event reaching other elements; `preventDefault()` stops the browser's default action (following a link, submitting a form) but not propagation. [Diagram and examples](/notes/javascript-dom-events).

### 66. `target` vs `currentTarget`?

`e.target` is the element actually clicked (possibly a child). `e.currentTarget` is the element the listener is attached to. In delegation, `currentTarget` is the parent and `target` is the child.

## Tricky output questions

```js
console.log(typeof null);        // 67: "object", a bug from the first version, kept for compatibility
console.log([] + []);            // 68: "": both arrays become empty strings
console.log([] + {});            // 69: "[object Object]": "" + "[object Object]"
console.log({} + []);            // 70: "[object Object]" here; typed alone in a console it's 0 (see below)
console.log(0 == false);         // 71: true: false becomes 0
console.log([] == false);        // 72: true: false → 0, [] → "" → 0
console.log(null == undefined);  // 73: true: a special rule for loose equality
console.log(null === undefined); //     false: different types
console.log(NaN == NaN);         // 74: false: NaN equals nothing; use Number.isNaN
console.log(typeof NaN);         // 75: "number": NaN is a numeric value meaning "invalid number"
```

**70 explained:** at the start of a statement, `{}` is parsed as an **empty block**, so `{} + []` typed alone is `+[]`, which is `0`. Inside `console.log(...)` it's an expression, so it's `"[object Object]"`. All coercion rules are in [JavaScript basics](/notes/javascript-basics).

## Coding questions

All of these are solved in [machine coding](/notes/javascript-machine-coding).

| # | Problem | Key idea |
| --- | --- | --- |
| 76 | Flatten `[1, [2, [3, [4]]]]` | recursion or an explicit stack; built in: `arr.flat(Infinity)` |
| 77 | Flatten an object to `"a.b.c"` keys | recurse with a path prefix |
| 78 | Group users by age | `reduce` into an object; built in: `Object.groupBy` |
| 79 | Deep compare objects | same keys count, recurse, handle `NaN` and dates |
| 80 | LRU cache | `Map` keeps insertion order: delete and re-set on access |
| 81 | EventEmitter | `Map` of event name → `Set` of listeners; return unsubscribe |
| 82 | Custom Promise | state, value, handler queue, `then` returns a new promise |
| 83 | Retry function | loop with `try`/`catch` and exponential backoff |
| 84 | Scheduler | a queue plus a running counter, start the next when one finishes |
| 85 | Limit concurrent promises | N workers pulling from a shared index |
| 86 | Observable | value + set of subscribers notified on change |
| 87 | Publish-subscribe | the EventEmitter idea: publishers don't know subscribers |
| 88 | Singleton | a static private instance, or just a module export |
| 89 | Compose | `fns.reduceRight((acc, fn) => fn(acc), x)` |
| 90 | Pipe | `fns.reduce((acc, fn) => fn(acc), x)` |

## Real interview scenarios

### 91. How would you optimise a slow JavaScript application?

**Measure first**: DevTools Performance panel, Lighthouse and the Core Web Vitals (LCP, INP, CLS). Then: ship less JavaScript (code splitting, dynamic `import`, tree shaking), break **long tasks** (over 50 ms) into chunks or move them to a Web Worker, debounce and throttle busy events, virtualise long lists, avoid layout thrashing (batch DOM reads then writes), memoise expensive work, cache network responses, and optimise images. Measure again to confirm.

### 92. How does React use the event loop?

React state updates are **batched** (automatically since React 18), so several `setState` calls in one event cause one render. React's scheduler splits rendering into small units of work and **yields back to the browser** between them (scheduling tasks with `MessageChannel`), so clicks and typing stay responsive during big renders. `useEffect` runs after the browser paints; `useLayoutEffect` runs before paint.

### 93. Why is JavaScript single-threaded?

It was designed to script web pages, and the DOM isn't thread-safe: two threads changing the same element would need locks and would create race conditions. One thread plus an event loop and non-blocking I/O gives concurrency without those problems.

### 94. Can JavaScript become multi-threaded?

Yes, through **Web Workers** in browsers and **worker_threads** in Node. Each worker has its own thread, event loop and memory, and talks by messages. `SharedArrayBuffer` with `Atomics` allows shared memory. Your main-thread code is still single-threaded.

### 95. What are Web Workers?

Scripts running on a background thread. They can't touch the DOM; they communicate with `postMessage`. Use them for CPU-heavy work (parsing, image processing, compression) so the UI never freezes. [Example](/notes/javascript-dom-events).

### 96. How would you handle 100,000 DOM elements?

Don't render them all: paginate, or **virtualise** (render only the visible rows). If you must create many, build them in a `DocumentFragment` and insert once, use one delegated listener, and split work into chunks so the page stays responsive. [Details](/notes/javascript-dom-events).

### 97. How does V8 optimise JavaScript?

V8 parses code to bytecode, which the **Ignition** interpreter runs while collecting **type feedback**. Hot functions are compiled to machine code by faster tiers (**Sparkplug**, then the optimising **Maglev** and **TurboFan**) using that feedback. If an assumption breaks (a function suddenly receives a string instead of a number), V8 **deoptimises** back to bytecode. Consistent types and object shapes keep code fast.

### 98. Hidden classes and inline caching?

V8 gives every object a hidden class (a "shape") describing its properties and their memory offsets. Objects created with the same properties in the same order share a shape. **Inline caches** remember, at each property access in your code, the shape seen and the offset to use, making repeated access very fast (monomorphic). Many different shapes at one site (megamorphic) are slower. Tips: initialise all properties in the constructor in the same order, avoid `delete`, and don't mix types in one property.

### 99. Explain the JavaScript engine architecture.

An engine (V8, SpiderMonkey, JavaScriptCore) has a **parser** (source → AST), an **interpreter** (AST → bytecode, run with feedback), **JIT compilers** (hot bytecode → optimised machine code), a **heap** managed by the garbage collector, and the **call stack**. Timers, `fetch`, the DOM and the event loop are **not** part of the engine: the host (browser or Node with libuv) provides them.

### 100. Build a Promise library from scratch.

Start with the custom `MyPromise` class (states, handler queue, microtask scheduling, chaining, adopting returned promises), then add `catch`, `finally`, static `resolve`/`reject`, and `all`/`race`/`any`/`allSettled` on top. [Custom Promise](/notes/javascript-machine-coding) and [combinators](/notes/javascript-async).

## Recommended resources

Free and trusted; use them in this order:

1. **[javascript.info](https://javascript.info/)**: the best structured tutorial. Do the tasks at the end of each chapter.
2. **[MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)**: the reference for exact behaviour.
3. **[You Don't Know JS Yet](https://github.com/getify/You-Dont-Know-JS)** by Kyle Simpson: deep dives into scope, closures, `this` and objects.
4. **[Namaste JavaScript](https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP)** by Akshay Saini: video explanations of execution context, hoisting, closures and the event loop, in Hinglish.
5. **[roadmap.sh: JavaScript](https://roadmap.sh/javascript)**: a checklist of what to learn next.
6. **[GreatFrontEnd](https://www.greatfrontend.com/)** and **[BFE.dev](https://bigfrontend.dev/)**: practice for coding and output questions.
7. **[Jake Archibald's tasks and microtasks article](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)** and **[Philip Roberts' talk "What the heck is the event loop anyway?"](https://www.youtube.com/watch?v=8aGhZQkoFbQ)**: the two best event loop explanations.

Start from the beginning: [JavaScript basics](/notes/javascript-basics).
