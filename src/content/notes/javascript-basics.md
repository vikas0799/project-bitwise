---
title: "JavaScript Basics: Variables, Types and Coercion"
description: var, let and const, the eight data types, typeof, operators including ?? and ?., truthy and falsy values, == vs === and the tricky coercion outputs asked in interviews, loops and control flow.
author: Vikas Patel
---

JavaScript runs in every browser and, through Node.js, on servers. It's easy to start and full of small surprises, and interviewers love those surprises. This note covers the foundations and the "why" behind the tricky outputs, so you can explain them instead of memorising them.

> Try every snippet yourself: open the browser console (F12 → Console) or save it in a file and run `node file.js`.

## var, let and const

| | `var` | `let` | `const` |
| --- | --- | --- | --- |
| scope | function | block `{ }` | block `{ }` |
| hoisted | yes, as `undefined` | yes, but in the TDZ | yes, but in the TDZ |
| redeclare in same scope | allowed | error | error |
| reassign | allowed | allowed | not allowed |
| global `var` becomes a `window` property | yes | no | no |

```js
if (true) {
  var a = 1;
  let b = 2;
}
console.log(a); // 1: var ignores the block
// console.log(b); // ReferenceError: b is not defined

const user = { name: "Asha" };
user.name = "Ravi"; // allowed: const stops reassignment, not changes inside the object
// user = {};        // TypeError: Assignment to constant variable
```

**Rule of thumb:** use `const` by default, `let` when the value must change, and avoid `var` in new code. The **temporal dead zone (TDZ)** is the time between entering a scope and reaching the `let`/`const` line, when the variable exists but can't be used. It's explained in [How JavaScript runs](/notes/javascript-execution-context).

## Data types

JavaScript has **seven primitive types** and **objects**:

| Type | Example | `typeof` |
| --- | --- | --- |
| string | `"hello"` | `"string"` |
| number | `42`, `3.14`, `NaN`, `Infinity` | `"number"` |
| bigint | `12345678901234567890n` | `"bigint"` |
| boolean | `true` | `"boolean"` |
| undefined | `undefined` | `"undefined"` |
| null | `null` | `"object"` (a famous bug) |
| symbol | `Symbol("id")` | `"symbol"` |
| object | `{}`, `[]`, functions, dates | `"object"` (functions: `"function"`) |

- **Primitives** hold a value, are **immutable** and are compared **by value**.
- **Objects** are stored **by reference**: two variables can point to the same object. See [Objects, prototypes and classes](/notes/javascript-objects-prototypes).
- `typeof null === "object"` is a bug from the first version of JavaScript, kept for compatibility. Check for null with `value === null`.
- To check for an array, use `Array.isArray(value)` (because `typeof [] === "object"`).

## Operators you should know well

```js
// Nullish coalescing: fall back only on null or undefined
const port = 0;
console.log(port || 3000); // 3000 (|| treats 0 as missing)
console.log(port ?? 3000); // 0    (?? keeps 0 and "")

// Optional chaining: stop safely when something is missing
const student = { profile: null };
console.log(student.profile?.city); // undefined, no crash
console.log(student.getName?.());   // undefined, no crash

// Spread and rest
const a = [1, 2];
const b = [...a, 3];                 // [1, 2, 3]
const sum = (...nums) => nums.reduce((s, n) => s + n, 0);
console.log(sum(1, 2, 3));           // 6
```

## Truthy and falsy

In a condition, every value becomes `true` or `false`. There are exactly **eight falsy values**:

`false`, `0`, `-0`, `0n`, `""` (empty string), `null`, `undefined`, `NaN`

**Everything else is truthy**, including `"0"`, `"false"`, `[]`, `{}` and `function () {}`. That's why `if ([])` runs.

## == vs === and type coercion

- `===` (strict equality) compares **type and value**, with no conversion. Use it by default.
- `==` (loose equality) **converts** the values first, using rules that surprise people.

The rules behind the classic questions:

1. `null == undefined` is `true`, and neither equals anything else with `==`.
2. If one side is a **boolean**, it's converted to a number first (`true` → 1, `false` → 0).
3. When comparing an **object** with a primitive, the object is converted to a primitive (arrays become strings: `[]` → `""`, `[1, 2]` → `"1,2"`).
4. A **string** compared with a **number** is converted to a number (`""` → 0).
5. `NaN` is not equal to anything, not even itself.

```js
console.log(0 == false);          // true:  false → 0
console.log([] == false);         // true:  false → 0, [] → "" → 0
console.log(null == undefined);   // true:  special rule
console.log(null === undefined);  // false: different types
console.log(NaN == NaN);          // false: use Number.isNaN(x)
console.log(typeof NaN);          // "number": NaN is a numeric value meaning "not a valid number"
console.log("5" + 3);             // "53": + with a string joins
console.log("5" - 3);             // 2:    - always converts to numbers
console.log([] + []);             // "":   both become ""
console.log([] + {});             // "[object Object]"
console.log({} + []);             // "[object Object]" inside console.log(...)
```

The last one depends on context: typed alone on a console line, `{} + []` is read as an **empty block** followed by `+[]`, which is `0`. Inside `console.log(...)` it's an expression, so you get `"[object Object]"`. Interviewers ask exactly this.

## Control flow and loops

```js
const marks = 82;
const grade = marks >= 90 ? "A" : marks >= 75 ? "B" : "C"; // ternary chains: keep them short

switch (grade) {
  case "A":
    console.log("Excellent");
    break;             // without break, execution falls through to the next case
  case "B":
    console.log("Good");
    break;
  default:
    console.log("Keep going");
}

const scores = [72, 95, 60];
for (const score of scores) console.log(score);           // values: 72, 95, 60
for (const index in scores) console.log(index);           // keys: "0", "1", "2" (strings!)
const course = { name: "JS", weeks: 8 };
for (const key in course) console.log(key, course[key]);  // object keys
```

- `for...of` loops over **values** of iterables (arrays, strings, maps, sets).
- `for...in` loops over **keys** of objects. Don't use it for arrays.
- `break` exits a loop; `continue` skips to the next iteration.

## Common mistakes

- Using `==` and getting coerced by accident. Use `===`.
- Thinking `const` makes objects immutable. It only stops reassignment. Use `Object.freeze` for shallow immutability.
- Checking `if (value)` when `0` or `""` are valid values. Use `value != null` or `??`.
- Comparing to `NaN` with `===`. Use `Number.isNaN(value)`.
- Relying on `typeof` for arrays and null.

## Interview questions

1. What are the differences between `var`, `let` and `const`? (scope, hoisting, TDZ, redeclaration, reassignment, window property)
2. Why is `typeof null` `"object"`?
3. What's the difference between `==` and `===`? Predict `[] == false`, `null == 0`, `"" == 0`.
4. List all falsy values.
5. What's the difference between `||` and `??`?
6. `for...in` vs `for...of`?

For more practice, see the [top JavaScript interview questions](/notes/javascript-interview-questions).

## Further reading

- [MDN: JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide): the most reliable reference
- [javascript.info](https://javascript.info/): the best free tutorial, chapter by chapter
- [MDN: Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)

Next: [How JavaScript runs: execution context, hoisting and scope](/notes/javascript-execution-context).
