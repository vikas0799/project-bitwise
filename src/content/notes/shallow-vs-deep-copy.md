---
title: "Shallow Copy vs Deep Copy in JavaScript"
description: Copy by value vs copy by reference, shallow copies with spread, Object.assign and slice, deep copies with structuredClone, where JSON.parse(JSON.stringify()) fails, writing your own deep clone, and freeze vs seal vs preventExtensions.
author: Vikas Patel
---

Copying objects is one of the most common sources of bugs in JavaScript, especially in React and Redux, where you must never change state directly. The whole topic comes down to one fact: **variables hold references to objects, not the objects themselves.**

## Copy by value vs copy by reference

```js
let a = 10;
let b = a;          // primitives: the value is copied
b = 20;
console.log(a);     // 10

const user1 = { name: "John" };
const user2 = user1; // objects: only the reference is copied
user2.name = "Alex";
console.log(user1.name); // "Alex": one object, two names for it
console.log(user1 === user2); // true
```

`const user2 = user1` is **not a copy at all**. Both variables point to the same object in memory.

## Shallow copy vs deep copy

![An object, its shallow copy sharing the nested address object, and its deep copy with its own address](/images/js/shallow-vs-deep-copy.svg "A shallow copy duplicates the top level only. A deep copy duplicates every level.")

- A **shallow copy** creates a new outer object, but **nested objects and arrays are still shared**.
- A **deep copy** duplicates **every level**, so the copy is fully independent.

```js
const user = { name: "Asha", address: { city: "Delhi" } };

const shallow = { ...user };
shallow.name = "Ravi";              // fine: top-level values were copied
shallow.address.city = "Mumbai";    // changes user too: address is shared
console.log(user.name, user.address.city); // "Asha" "Mumbai"

const deep = structuredClone(user);
deep.address.city = "Pune";
console.log(user.address.city);     // still "Mumbai"
console.log(deep.address === user.address); // false
```

## Ways to make a shallow copy

```js
const obj = { a: 1, nested: { b: 2 } };
const arr = [1, [2, 3]];

const c1 = { ...obj };               // spread (most common)
const c2 = Object.assign({}, obj);   // Object.assign
const c3 = [...arr];                 // array spread
const c4 = arr.slice();              // slice
const c5 = Array.from(arr);          // Array.from
```

All of them copy only the top level. For flat data (no nested objects), a shallow copy is all you need, and it's cheap.

### Object.assign vs spread

| | `Object.assign(target, ...sources)` | `{ ...source }` |
| --- | --- | --- |
| creates a new object | only if the target is `{}` | always |
| can modify an existing object | yes, it mutates the target | no |
| setters on the target | **triggers** them | defines plain properties |
| depth | shallow | shallow |

```js
const defaults = { theme: "light", lang: "en" };
const settings = { ...defaults, theme: "dark" }; // later keys win: { theme: "dark", lang: "en" }
```

### Immutable updates (React and Redux style)

Copy **every level you change**, and share the rest:

```js
const state = { user: { name: "Asha", skills: ["JS"] }, theme: "light" };

const next = {
  ...state,
  user: { ...state.user, skills: [...state.user.skills, "React"] },
};
console.log(state.user.skills); // ["JS"]: the original is untouched
console.log(next.theme === state.theme); // unchanged parts are shared, which is fine
```

## Deep copy with structuredClone

`structuredClone(value)` is built into every modern browser and Node 17+. It's the right default for deep copies.

```js
const original = {
  date: new Date("2026-01-01"),
  tags: new Set(["js", "node"]),
  scores: new Map([["asha", 90]]),
  nested: { deep: { value: 1 } },
};
original.self = original;                    // circular reference

const copy = structuredClone(original);
console.log(copy.date instanceof Date);      // true
console.log(copy.tags.has("node"));          // true
console.log(copy.self === copy);             // true: circular references are kept
console.log(copy.nested.deep === original.nested.deep); // false
```

**Limits:** it throws on **functions** and DOM nodes, and it doesn't keep **prototypes**, so class instances come back as plain objects (their methods are lost).

## Why JSON.parse(JSON.stringify()) fails

The old trick works only for plain JSON-like data:

```js
const data = {
  when: new Date("2026-01-01"),
  greet() {},
  missing: undefined,
  big: NaN,
  ids: new Set([1, 2]),
};
console.log(JSON.parse(JSON.stringify(data)));
// { when: "2026-01-01T00:00:00.000Z", big: null, ids: {} }
```

| Value | After the JSON round trip |
| --- | --- |
| `Date` | becomes a **string** |
| functions, `undefined`, symbols | **removed** from objects |
| `NaN`, `Infinity` | become `null` |
| `Map`, `Set` | become `{}` |
| circular reference | **throws** `TypeError` |
| `BigInt` | **throws** `TypeError` |
| class instances | lose their prototype |

## Writing your own deep clone

A common interview task. Handle primitives, arrays, dates, maps, sets and **circular references** (with a `WeakMap` of what's already copied):

```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value; // primitives and functions
  if (seen.has(value)) return seen.get(value);                    // circular reference

  if (value instanceof Date) return new Date(value);
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

  const out = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value)); // keep the prototype
  seen.set(value, out);
  for (const key of Reflect.ownKeys(value)) {          // includes symbol keys
    out[key] = deepClone(value[key], seen);
  }
  return out;
}

const a = { list: [1, { x: 2 }], when: new Date(0) };
a.me = a;
const b = deepClone(a);
console.log(b.list[1] !== a.list[1], b.me === b, b.when.getTime()); // true true 0
```

Functions are returned as they are: they're shared, not copied, which is what you want almost always.

## freeze vs seal vs preventExtensions

Sometimes you don't want a copy; you want to stop changes.

| | add properties | delete properties | change values |
| --- | --- | --- | --- |
| `Object.preventExtensions(o)` | no | yes | yes |
| `Object.seal(o)` | no | no | yes |
| `Object.freeze(o)` | no | no | no |

```js
"use strict";
const config = Object.freeze({ port: 3000, db: { host: "localhost" } });
// config.port = 4000;        // TypeError in strict mode (silently ignored in sloppy mode)
config.db.host = "remote";    // works! freeze is shallow too
console.log(Object.isFrozen(config), Object.isFrozen(config.db)); // true false
```

For full immutability, freeze recursively ("deep freeze"), or use a library like Immer, which lets you write mutating code and produces immutable copies.

## Quick revision

| Method | Depth | Keeps Date/Map/Set | Circular refs | Functions |
| --- | --- | --- | --- | --- |
| `=` assignment | not a copy | — | — | — |
| spread / `Object.assign` / `slice` | shallow | shared, not copied | shared | shared |
| `JSON.parse(JSON.stringify())` | deep | no | throws | removed |
| `structuredClone()` | deep | yes | yes | throws |
| custom `deepClone` | deep | as you implement | with a `WeakMap` | shared |

## Interview questions

1. Is the spread operator a deep copy? Is `Object.assign`?
2. What are the failure cases of `JSON.parse(JSON.stringify(obj))`?
3. Implement a deep clone that handles circular references.
4. `Object.assign` vs spread.
5. `freeze` vs `seal` vs `preventExtensions`. Is `freeze` deep?
6. Why do React and Redux need immutable updates?

## Further reading

- [MDN: structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
- [MDN: Shallow copy](https://developer.mozilla.org/en-US/docs/Glossary/Shallow_copy) and [Deep copy](https://developer.mozilla.org/en-US/docs/Glossary/Deep_copy)
- [MDN: Object.freeze()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

Next: [Machine coding round problems](/notes/javascript-machine-coding).
