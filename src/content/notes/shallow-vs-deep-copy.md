---
title: Shallow Copy vs Deep Copy
description: References, spread, Object.assign, structuredClone and the pitfalls of the JSON method.
author: Vikas Patel
---

### Introduction

When working with objects and arrays in JavaScript, copying data is a common task. However, **not all copies are the same**.

JavaScript provides two ways to copy objects:

- **Shallow Copy**
- **Deep Copy**

Understanding the difference is essential because it affects how changes to one object impact another.

---

## Memory Representation

Consider the following object:

```js
const user = {
  name: "John",
  age: 25
};
```

Memory

```
user
 │
 ▼
{
  name: "John",
  age: 25
}
```

The variable `user` stores a **reference (memory address)** to the object, not the object itself.

---

## What is a Shallow Copy?

A **shallow copy** creates a **new outer object**, but **nested objects and arrays are still shared by reference**.

```
Original Object
      │
      ▼
{
   name: "John",
   address ──────────────┐
}                        │
                         ▼
                  { city: "Delhi" }

        │

Shallow Copy

{
   name: "John",
   address ──────────────┘
}
```

Both objects point to the **same nested object**.

---

## Example 1: Reference Assignment (Not a Copy)

```js
const user1 = {
  name: "John"
};

const user2 = user1;

user2.name = "Vikas";

console.log(user1.name);
console.log(user2.name);
```

Output

```
Vikas
Vikas
```

Explanation

Both variables point to the **same object**.

---

## Example 2: Object Spread (Shallow Copy)

```js
const user1 = {
  name: "John",
  age: 25
};

const user2 = {
  ...user1
};

user2.name = "Vikas";

console.log(user1);
console.log(user2);
```

Output

```js
user1
{
  name: "John",
  age: 25
}

user2
{
  name: "Vikas",
  age: 25
}
```

The outer object is copied successfully.

---

## Example 3: Nested Object Problem

```js
const user1 = {
  name: "John",
  address: {
    city: "Delhi"
  }
};

const user2 = {
  ...user1
};

user2.address.city = "Lucknow";

console.log(user1.address.city);
console.log(user2.address.city);
```

Output

```
Lucknow
Lucknow
```

Why?

Because

```
user1.address
        │
        ▼
   { city: "Lucknow" }
        ▲
        │
user2.address
```

Only the first level was copied.

The nested object is shared.

---

## Other Ways to Create a Shallow Copy

### Object.assign()

```js
const copy = Object.assign({}, original);
```

---

### Spread Operator

```js
const copy = {
  ...original
};
```

---

### Array Spread

```js
const arr = [1,2,3];

const copy = [...arr];
```

---

### Array.slice()

```js
const copy = arr.slice();
```

---

## What is Deep Copy?

A **deep copy** creates a completely independent copy of the object.

Every nested object and array is copied into new memory.

```
Original

{
   name
   address
      │
      ▼
 { city }
}

Deep Copy

{
   name
   address
      │
      ▼
 { city }
}

Different memory locations
```

---

## Example 1: structuredClone()

```js
const user1 = {
  name: "John",
  address: {
    city: "Delhi"
  }
};

const user2 = structuredClone(user1);

user2.address.city = "Lucknow";

console.log(user1.address.city);
console.log(user2.address.city);
```

Output

```
Delhi
Lucknow
```

Perfect deep copy.

---

## Example 2: JSON Method

```js
const copy = JSON.parse(JSON.stringify(original));
```

Example

```js
const user1 = {
  name: "John",
  address: {
    city: "Delhi"
  }
};

const user2 = JSON.parse(JSON.stringify(user1));

user2.address.city = "Lucknow";

console.log(user1.address.city);
console.log(user2.address.city);
```

Output

```
Delhi
Lucknow
```

---

## Limitations of JSON Method

It does **not** copy correctly:

- Date
- Map
- Set
- RegExp
- Function
- undefined
- Symbol
- BigInt
- Circular References

Example

```js
const obj = {
  date: new Date()
};

const copy = JSON.parse(JSON.stringify(obj));

console.log(copy.date);
```

Output

```
"2026-08-04T12:00:00.000Z"
```

It becomes a string instead of a `Date` object.

---

## Why structuredClone() is Better

It correctly copies

- Nested Objects
- Arrays
- Date
- Map
- Set
- Blob
- File
- ArrayBuffer
- Typed Arrays

Example

```js
const map = new Map([
  ["a",1]
]);

const copy = structuredClone(map);

console.log(copy);
```

---

## Shallow Copy vs Deep Copy

| Feature | Shallow Copy | Deep Copy |
| --- | --- | --- |
| New Outer Object | ✅ | ✅ |
| Nested Objects Copied | ❌ | ✅ |
| Nested Arrays Copied | ❌ | ✅ |
| Shares References | ✅ | ❌ |
| Safe for Nested Data | ❌ | ✅ |

---

## Comparison Example

```js
const original = {
  name: "John",
  address: {
    city: "Delhi"
  }
};

const shallow = {
  ...original
};

const deep = structuredClone(original);

shallow.address.city = "Lucknow";

console.log(original.address.city);
console.log(shallow.address.city);
console.log(deep.address.city);
```

Output

```
Lucknow
Lucknow
Delhi
```

---

## Interview Questions

### Is spread operator a deep copy?

No.

It creates only a **shallow copy**.

---

### Is Object.assign() a deep copy?

No.

It also creates a **shallow copy**.

---

### Which is the best way to create a deep copy?

Use

```js
structuredClone()
```

---

### When should we use deep copy?

Whenever an object contains:

- Nested Objects
- Nested Arrays
- Maps
- Sets
- Complex Data Structures

---

## Quick Revision

#### Shallow Copy

```
New Outer Object

↓

Nested objects are shared

↓

Changes affect original
```

#### Deep Copy

```
New Outer Object

↓

New Nested Objects

↓

Completely Independent
```

---

## Final Summary

A **shallow copy** duplicates only the first level of an object. Any nested objects or arrays continue to share the same references, so modifying nested data in the copy also changes the original.

A **deep copy** recursively duplicates every level of the object, ensuring that the copied object is completely independent. In modern JavaScript, `structuredClone()` is the recommended way to create deep copies because it correctly handles many built-in data types that the older `JSON.parse(JSON.stringify())` technique cannot.
