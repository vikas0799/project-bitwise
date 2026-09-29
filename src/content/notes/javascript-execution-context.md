---
title: "How JavaScript Runs: Execution Context, Hoisting and Scope"
description: Execution contexts and their memory and execution phases, the call stack, hoisting of var, let, const and functions, the temporal dead zone, lexical environments, the scope chain and shadowing, with output questions.
author: Vikas Patel
---

Most "predict the output" questions come down to one idea: **before JavaScript runs your code, it sets up memory for it**. Once you understand execution contexts, hoisting, the TDZ and the scope chain stop being magic.

## Execution context

An **execution context** is the environment in which a piece of code runs. It holds the variables, the functions and the value of `this` for that code.

- The **global execution context** is created when your script starts.
- A new **function execution context** is created **every time a function is called**.

Each context is created in two phases:

![Code, its memory phase with a, b and greet, its execution phase, and the call stack](/images/js/execution-context.svg "In the memory phase var gets undefined, let/const stay uninitialised (TDZ), and function declarations are stored whole.")

1. **Memory (creation) phase:** JavaScript scans the code and reserves memory.
   - `var` variables are created and set to `undefined`.
   - `let` and `const` variables are created but **not initialised**. Touching them throws an error (the TDZ).
   - **Function declarations** are stored completely, so they can be called before the line where they appear.
2. **Execution phase:** the code runs line by line, assigning real values and calling functions.

## The call stack

Contexts are managed with a **stack**. The global context sits at the bottom. Calling a function **pushes** its context on top; returning **pops** it. JavaScript runs only the context on top, which is why it's called **single-threaded**.

```js
function multiply(a, b) {
  return a * b;
}
function square(n) {
  return multiply(n, n);
}
console.log(square(4)); // 16
// stack while multiply runs: [global, square, multiply]
```

Recursion that never stops keeps pushing contexts until you get `RangeError: Maximum call stack size exceeded`.

## Hoisting

**Hoisting** is the result of the memory phase: declarations are known before the code runs, as if they were "moved to the top".

```js
console.log(x);     // undefined: var is hoisted and set to undefined
var x = 5;

sayHi();            // "hi": function declarations are hoisted whole
function sayHi() {
  console.log("hi");
}

// console.log(y);  // ReferenceError: Cannot access 'y' before initialization
let y = 10;

// greet();         // TypeError: greet is not a function (it's undefined here)
var greet = function () {
  console.log("hello");
};
```

| Declaration | Hoisted? | Value before its line |
| --- | --- | --- |
| `var x` | yes | `undefined` |
| `let` / `const` | yes | inaccessible (TDZ → ReferenceError) |
| `function f() {}` | yes, whole function | callable |
| `var f = function () {}` | only `f` | `undefined` (calling it → TypeError) |
| `class A {}` | yes | inaccessible (TDZ) |

### The temporal dead zone (TDZ)

The TDZ is the period from the start of a scope until the `let`/`const`/`class` line runs. The variable exists but can't be read or written. It exists to catch bugs: using a variable before it's ready is almost always a mistake.

```js
let value = "outer";
function show() {
  // console.log(value); // ReferenceError: the inner `value` is in its TDZ,
  let value = "inner";   // even though an outer `value` exists
  console.log(value);    // "inner"
}
show();
```

## Scope and the scope chain

**Scope** decides where a variable can be used.

- **Global scope:** outside every function and block.
- **Function scope:** inside a function (`var`, `let`, `const`).
- **Block scope:** inside `{ }` (`let` and `const` only).

JavaScript uses **lexical scope**: what a function can see depends on **where it's written**, not where it's called. When a variable isn't found in the current scope, JavaScript looks in the enclosing scope, then the next one out, up to the global scope. That path is the **scope chain**.

![Nested global, outer and inner scopes with lookups going outward](/images/js/scope-chain.svg "Lookups go outward, never inward: the outer function can't see inner's variables.")

```js
const app = "Bitwise";
function outer() {
  const course = "JS";
  function inner() {
    const topic = "scope";
    console.log(topic, course, app); // scope JS Bitwise
  }
  inner();
}
outer();
```

Every execution context holds a **lexical environment**: its own variables plus a reference to its **outer** environment. Following those references is exactly the scope chain. Keeping that reference alive after a function returns is what makes [closures](/notes/javascript-functions-closures) work.

### Shadowing

A variable in an inner scope with the same name as an outer one **shadows** it: the inner one wins inside that scope.

```js
let level = "global";
{
  let level = "block";  // shadows the outer level inside this block
  console.log(level);   // "block"
}
console.log(level);     // "global"
```

## Strict mode

`"use strict"` (automatic in ES modules and classes) turns silent mistakes into errors: assigning to an undeclared variable throws instead of creating a global, and `this` in a plain function call is `undefined` instead of the global object. Write modern code in modules and you get it for free.

## Output questions

```js
var a = 1;
function test() {
  console.log(a); // undefined: the local var a is hoisted and shadows the global a
  var a = 2;
}
test();
```

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 3, 3, 3: one shared var i, read after the loop ends
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j)); // 0, 1, 2: let creates a new j for each iteration
}
```

```js
console.log(typeof hoisted); // "function"
function hoisted() {}
var hoisted = 5;             // at run time this assignment replaces the function
console.log(typeof hoisted); // "number"
```

## Interview questions

1. What is an execution context? What happens in the memory phase and the execution phase?
2. Explain hoisting for `var`, `let`, `const`, function declarations and function expressions.
3. What is the temporal dead zone, and why does it exist?
4. What is lexical scope? How does the scope chain work?
5. Why does the `var` loop print `3, 3, 3` and the `let` loop `0, 1, 2`?

## Further reading

- [javascript.info: Variable scope, closure](https://javascript.info/closure)
- [MDN: Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)
- [MDN: Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)

Next: [Functions and closures](/notes/javascript-functions-closures).
