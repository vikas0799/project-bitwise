---
title: "Functions and Closures in JavaScript"
description: Function declarations, expressions and arrow functions compared, parameters, callbacks and higher-order functions, IIFEs, closures with diagrams, private state, the loop pitfall, memory leaks, currying, infinite currying and memoisation.
author: Vikas Patel
---

Functions are values in JavaScript: you can store them in variables, pass them to other functions and return them. That one fact gives you callbacks, higher-order functions and **closures**, the most asked JavaScript interview topic after the event loop.

## Ways to write a function

```js
function add(a, b) {            // declaration: hoisted whole
  return a + b;
}

const subtract = function (a, b) { // expression: not usable before this line
  return a - b;
};

const multiply = (a, b) => a * b;  // arrow function: short, no own this
```

### Arrow vs normal functions

| | Normal function | Arrow function |
| --- | --- | --- |
| own `this` | yes, decided by how it's called | no, uses the surrounding `this` |
| `arguments` object | yes | no (use rest `...args`) |
| can be used with `new` | yes | no (TypeError) |
| has `prototype` | yes | no |
| good for | object methods, constructors | callbacks, short helpers |

Arrow functions **can't be constructors** because they have no own `this` and no `prototype` for the new object to inherit from.

## Parameters

```js
function greet(name = "student", ...courses) {     // default value + rest parameter
  return `${name} takes ${courses.length} course(s)`;
}
console.log(greet());                  // "student takes 0 course(s)"
console.log(greet("Asha", "JS", "DSA")); // "Asha takes 2 course(s)"
```

## Callbacks and higher-order functions

A **callback** is a function passed to another function to be called later. A **higher-order function** takes or returns a function.

```js
const marks = [45, 82, 91, 67];
const passed = marks.filter((m) => m >= 50);          // [82, 91, 67]
const boosted = marks.map((m) => Math.min(m + 5, 100)); // [50, 87, 96, 72]
const total = marks.reduce((sum, m) => sum + m, 0);   // 285

function repeat(times, action) {                       // your own higher-order function
  for (let i = 0; i < times; i++) action(i);
}
repeat(3, (i) => console.log(`round ${i}`));
```

## IIFE: run once, keep variables private

An **Immediately Invoked Function Expression** runs as soon as it's defined. It was the main way to create private scope before modules and `let`.

```js
const counter = (function () {
  let count = 0;                 // private: nothing outside can reach it
  return { next: () => ++count };
})();
console.log(counter.next());     // 1
console.log(counter.next());     // 2
```

## Closures

> A **closure** is a function together with the variables from the scope where it was created. The function keeps access to those variables even after the outer function has returned.

![A counter function whose inner function keeps the count variable alive](/images/js/closure.svg "makeCounter has returned, but the inner function still holds a link to its count.")

```js
function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}

const next = makeCounter();
console.log(next()); // 1
console.log(next()); // 2

const other = makeCounter();
console.log(other()); // 1: a separate count for each call to makeCounter
```

Normally a function's local variables disappear when it returns. Here `count` survives because the returned function still **references** it through its lexical environment (see the [scope chain](/notes/javascript-execution-context)).

### Where closures are used

- **Private state**, like `count` above, or a bank balance nobody can change directly.
- **Function factories:** `const double = multiplier(2)`.
- **Event handlers and callbacks** that read variables from the surrounding code.
- **Memoisation, debounce, throttle, once:** each keeps its state in a closure.

```js
function once(fn) {
  let done = false;
  let result;
  return function (...args) {
    if (!done) {
      done = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
const init = once(() => console.log("initialised"));
init(); // "initialised"
init(); // nothing: already done
```

### The loop pitfall

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 3 3 3: all three closures share one var i
}
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 0 1 2: let gives each iteration its own i
}
```

### Closures and memory

A closure keeps its variables alive as long as the closure itself is reachable. If you store a closure that references a huge object (for example in a global array or an event listener you never remove), that object can't be garbage-collected. Remove event listeners and clear timers you no longer need.

## Currying

**Currying** turns `f(a, b, c)` into `f(a)(b)(c)`: each call takes one argument and returns the next function.

```js
const sum3 = (a) => (b) => (c) => a + b + c;
console.log(sum3(1)(2)(3)); // 6
```

**Infinite currying**, `sum(1)(2)(3)(4)()`, keeps adding until it's called with no argument:

```js
function sum(a) {
  return function next(b) {
    if (b === undefined) return a;  // empty call: return the total
    a += b;
    return next;
  };
}
console.log(sum(1)(2)(3)(4)()); // 10
```

A general `curry(fn)` helper is in [machine coding](/notes/javascript-machine-coding).

## Memoisation

**Memoisation** caches results of expensive calls. It needs a closure to keep the cache private:

```js
function memoize(fn) {
  const cache = new Map();
  return function (n) {
    if (cache.has(n)) return cache.get(n);
    const value = fn(n);
    cache.set(n, value);
    return value;
  };
}

const slowSquare = (n) => {
  for (let i = 0; i < 1e6; i++); // pretend this is expensive
  return n * n;
};
const fastSquare = memoize(slowSquare);
console.log(fastSquare(9)); // 81, computed
console.log(fastSquare(9)); // 81, from the cache
```

Memoise only **pure** functions: same input, same output, no side effects.

## Interview questions

1. What is a closure? Give a real use case.
2. Why does the `var` loop with `setTimeout` print the same number three times? Two ways to fix it.
3. Differences between arrow functions and normal functions. Can an arrow function be a constructor? Why not?
4. Implement `once`, `memoize` and `sum(1)(2)(3)()`.
5. Can closures cause memory leaks? How do you avoid them?
6. What is a higher-order function? Name three built-in ones.

## Further reading

- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [javascript.info: Functions](https://javascript.info/function-basics) and [Arrow functions revisited](https://javascript.info/arrow-functions)

Next: [Objects, prototypes and classes](/notes/javascript-objects-prototypes).
