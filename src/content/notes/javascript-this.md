---
title: "The this Keyword: Bindings, call, apply and bind"
description: How JavaScript decides what this refers to, with a decision diagram. Default, implicit, explicit and new binding, arrow functions, lost this in callbacks, call vs apply vs bind, polyfills for all three, and the classic output questions.
author: Vikas Patel
---

**Binding** means deciding what the keyword `this` refers to when a function runs. The single most important rule:

> `this` is decided by **how a function is called**, not where it's written. The one exception is arrow functions, which take `this` from where they're written.

## The four bindings (plus arrows)

Work through these questions in order. The first "yes" gives the answer.

![A flowchart: arrow function, then new, then call/apply/bind, then obj.method(), then the default binding](/images/js/this-binding.svg "Check from the top. The first rule that matches decides this.")

### 1. Default binding

A plain function call, with nothing before the dot.

```js
function show() {
  console.log(this);
}
show(); // undefined in strict mode; the global object (window) in old sloppy scripts
```

ES modules and classes are always strict, so in modern code a plain call gives `undefined`.

### 2. Implicit binding

Called with the **dot**: `this` is the object **before the dot**.

```js
const person = {
  name: "Vikas",
  display() {
    console.log(this.name);
  },
};
person.display(); // "Vikas"
```

### 3. Explicit binding: call, apply and bind

You choose `this` yourself.

```js
function greet(city, country) {
  console.log(this.name, city, country);
}
const user = { name: "Vikas" };

greet.call(user, "Lucknow", "India");     // Vikas Lucknow India: runs now, arguments one by one
greet.apply(user, ["Lucknow", "India"]);  // Vikas Lucknow India: runs now, arguments as an array

const greetVikas = greet.bind(user, "Lucknow"); // doesn't run: returns a new function
greetVikas("India");                             // Vikas Lucknow India
```

| | `call()` | `apply()` | `bind()` |
| --- | --- | --- | --- |
| runs the function | immediately | immediately | no, returns a new function |
| arguments | one by one | as an array | one by one (can be preset) |
| returns | the function's result | the function's result | a bound function |
| typical use | borrow a method | spread an array of args | callbacks, event handlers |

A bound function's `this` is **permanent**: calling `bind` again, or `call`/`apply` on it, can't change it (only `new` can).

### 4. new binding

With `new`, `this` is the **brand-new object** being created (see [what `new` does](/notes/javascript-objects-prototypes)).

```js
function Student(name) {
  this.name = name;
}
const s1 = new Student("Vikas");
console.log(s1.name); // "Vikas"
```

### Arrow functions: no own this

An arrow function doesn't have its own `this`. It uses `this` from the **surrounding code** at the place where it's written, and nothing (`call`, `bind`, the dot) can change it.

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++;            // arrow: this is timer, from start()
    }, 1000);
  },
};
```

With a normal `function` inside `setInterval`, `this` would not be `timer`. That's why arrows are great for callbacks **inside** methods, but bad **as** methods.

## Losing this: the most common bug

```js
const obj = {
  name: "John",
  show() {
    console.log(this.name);
  },
};

const fn = obj.show;
fn();                      // strict/module: TypeError (this is undefined)
                           // sloppy browser script: "" (window.name) or undefined

setTimeout(obj.show, 0);   // same problem: setTimeout calls it as a plain function
setTimeout(() => obj.show(), 0);   // fix 1: call it with the dot
setTimeout(obj.show.bind(obj), 0); // fix 2: bind it
```

`const fn = obj.show` copies only the **function**. The link to `obj` came from the dot at call time, and `fn()` has no dot, so the **default binding** applies. The same thing happens when you pass a method as a callback or event handler, and it's why React class components used `this.handleClick = this.handleClick.bind(this)`.

## Output questions

### Arrow function as a method

```js
const obj = {
  name: "Alex",
  arrow: () => {
    console.log(this.name);
  },
};
obj.arrow(); // undefined (or a TypeError in some environments)
```

**Why?** An object literal `{ }` is **not** a scope, so the arrow takes `this` from the code **around the object**: the module or global scope. There, `this` is `undefined` in an ES module (so `this.name` throws a TypeError), `{}` (`module.exports`) in a Node CommonJS file (so you get `undefined`), and `window` in a browser script (so `window.name`, usually `""`). It's **never** `obj`. Use a normal method, `arrow() { … }`, instead.

### Nested normal function

```js
const team = {
  name: "Bitwise",
  members: ["Asha", "Ravi"],
  list() {
    this.members.forEach(function (m) {
      console.log(m, this?.name); // "Asha undefined" (strict): the callback is a plain call
    });
    this.members.forEach((m) => {
      console.log(m, this.name);  // "Asha Bitwise": the arrow uses list()'s this
    });
  },
};
team.list();
```

### Which rule wins?

```js
function whoAmI() {
  return this.id;
}
const a = { id: "a", whoAmI };
const b = { id: "b" };

console.log(a.whoAmI());          // "a": implicit
console.log(a.whoAmI.call(b));    // "b": explicit beats implicit
const bound = whoAmI.bind(a);
console.log(bound.call(b));       // "a": a bound function can't be re-bound
```

Order of precedence: **new → bind/call/apply → obj.method() → default**. Arrows ignore all of them.

## Polyfills for call, apply and bind

A top interview task. The trick for `call` is the implicit binding: temporarily put the function on the object and call it with the dot.

```js
Function.prototype.myCall = function (context, ...args) {
  context = context ?? globalThis;            // null/undefined → global object
  context = Object(context);                  // box primitives like "abc" or 5
  const key = Symbol("fn");                   // unique key: never overwrites a real property
  context[key] = this;                        // `this` is the function myCall was called on
  const result = context[key](...args);       // implicit binding does the work
  delete context[key];
  return result;
};

Function.prototype.myApply = function (context, args = []) {
  return this.myCall(context, ...args);
};

Function.prototype.myBind = function (context, ...preset) {
  const fn = this;
  return function bound(...later) {
    if (new.target) return new fn(...preset, ...later); // `new bound()` ignores the bound this
    return fn.myCall(context, ...preset, ...later);
  };
};

function intro(greeting, mark) {
  return `${greeting}, I'm ${this.name}${mark}`;
}
const me = { name: "Vikas" };
console.log(intro.myCall(me, "Hi", "!"));        // "Hi, I'm Vikas!"
console.log(intro.myApply(me, ["Hello", "."]));  // "Hello, I'm Vikas."
console.log(intro.myBind(me, "Hey")("?"));       // "Hey, I'm Vikas?"
```

## Quick reference

| How it's called | `this` is |
| --- | --- |
| `fn()` | `undefined` (strict) or the global object (sloppy) |
| `obj.fn()` | `obj` |
| `fn.call(x)` / `fn.apply(x)` / `fn.bind(x)()` | `x` |
| `new Fn()` | the new object |
| arrow function | `this` of the surrounding code, fixed forever |
| DOM handler `el.addEventListener("click", function () {})` | `el` (the element) |
| class method passed as a callback | `undefined` (classes are strict) |

## Interview questions

1. What decides the value of `this`? Explain default, implicit, explicit and new binding.
2. `call` vs `apply` vs `bind`. Implement all three.
3. Why does `const fn = obj.show; fn()` lose `this`? Two ways to fix it.
4. Why does an arrow function used as an object method not see the object?
5. Can you change the `this` of an arrow function or a bound function?
6. What is `this` inside an event listener?

## Further reading

- [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [javascript.info: Object methods, "this"](https://javascript.info/object-methods) and [Function binding](https://javascript.info/bind)
- [You Don't Know JS Yet: Objects & Classes](https://github.com/getify/You-Dont-Know-JS), the best deep dive on `this`

Next: [Promises, async/await and the event loop](/notes/javascript-async).
