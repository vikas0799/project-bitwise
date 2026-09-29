---
title: "Objects, Prototypes and Classes in JavaScript"
description: Objects and destructuring, primitives vs objects, wrapper classes and autoboxing, the prototype chain with diagrams, Object.create, constructor functions, prototype vs __proto__, instanceof, classes, inheritance, private fields, static members and OOP in JavaScript.
author: Vikas Patel
---

JavaScript's object model is different from Java or C++. There are no real classes underneath: objects inherit directly from other objects through **prototypes**, and `class` is a cleaner syntax on top of that. Understand prototypes and the rest of JavaScript's OOP makes sense.

## Objects in practice

```js
const course = { title: "JavaScript", weeks: 8, tags: ["web"] };

course.level = "beginner";          // add
course["weeks"] = 10;               // bracket access, useful for dynamic keys
delete course.tags;                 // remove

const { title, weeks: duration } = course;   // destructuring with a rename
const updated = { ...course, weeks: 12 };    // copy with one change (shallow)

console.log(Object.keys(course));    // ["title", "weeks", "level"]
console.log(Object.entries(course)); // [["title","JavaScript"], ["weeks",10], ["level","beginner"]]
console.log("title" in course);      // true
```

Spreading only copies the top level; nested objects are still shared. See [shallow vs deep copy](/notes/shallow-vs-deep-copy).

## Primitives vs objects

| Primitives (7) | Objects |
| --- | --- |
| `string`, `number`, `bigint`, `boolean`, `symbol`, `null`, `undefined` | `Object`, `Array`, `Function`, `Date`, `Map`, `Set`, `RegExp` … |
| store the actual value | store a **reference** |
| **immutable** | **mutable** |
| compared by value | compared by reference |
| can't hold custom properties | can hold custom properties |

```js
let name = "Vikas";
name.age = 22;
console.log(name.age); // undefined: primitives can't keep properties

let obj = {};
obj.age = 22;
console.log(obj.age);  // 22

let a = 10;
let b = a;             // copies the value
b = 20;                // a is still 10

const o1 = { age: 20 };
const o2 = o1;         // copies the reference: both point to one object
o2.age = 30;
console.log(o1.age);   // 30
```

## Wrapper classes and autoboxing

If primitives aren't objects, how does `"john".toUpperCase()` work? Through **wrapper classes** and **autoboxing**.

JavaScript has **five wrapper classes**: `String`, `Number`, `Boolean`, `BigInt` and `Symbol`. (`null` and `undefined` have none, which is why `null.toString()` throws.)

When you access a property or method on a primitive, JavaScript **temporarily wraps** it in an object, finds the method on the wrapper's prototype, calls it, and throws the wrapper away.

![Steps from a primitive string to a temporary String wrapper to String.prototype and the result](/images/js/autoboxing.svg "Autoboxing: a temporary wrapper is created, used and discarded.")

```js
let str = "john";
console.log(str.toUpperCase());  // "JOHN"
// roughly what happens:
// let temp = new String("john");
// temp.toUpperCase();
// temp = null;

console.log((12.345).toFixed(2)); // "12.35": the same idea with Number
console.log(typeof "John");            // "string"
console.log(typeof new String("John")); // "object": a real wrapper object
```

This also explains why `"John".age = 20` seems to do nothing: the property goes onto a temporary wrapper that's immediately discarded, and the next access creates a brand-new wrapper.

Never create wrappers yourself (`new String`, `new Number`, `new Boolean`). They are objects, so `new Boolean(false)` is **truthy** and comparisons break. Use plain literals.

### Inspecting what's there

```js
const s = new String("john");
console.log(Object.keys(s));                   // ["0", "1", "2", "3"]: own enumerable properties
console.log(Object.getOwnPropertyNames(s));    // ["0", "1", "2", "3", "length"]: also non-enumerable
console.log(Object.getPrototypeOf(s) === String.prototype);            // true
console.log(Object.getPrototypeOf(String.prototype) === Object.prototype); // true
console.log(Object.getPrototypeOf(Object.prototype));                  // null
```

`Object.keys` returns only **enumerable** own properties; `length` isn't enumerable, so only `getOwnPropertyNames` shows it. In the browser, `console.dir(s)` lets you expand the whole chain interactively.

## The prototype chain

Every object has a hidden link, `[[Prototype]]`, to another object: its **prototype**. When you read a property that the object doesn't have, JavaScript looks at the prototype, then the prototype's prototype, and so on until it finds it or reaches `null`.

![Prototype chains of a Student instance and a String object meeting at Object.prototype](/images/js/prototype-chain.svg "Methods live once on the prototype and are shared by every instance.")

```js
function Student(name) {
  this.name = name;           // own property: each student gets its own
}
Student.prototype.study = function () {
  return `${this.name} is studying`;   // shared: one copy for all students
};

const s1 = new Student("Vikas");
const s2 = new Student("Rahul");
console.log(s1.study());                  // "Vikas is studying"
console.log(s1.study === s2.study);       // true: the same function, not a copy
console.log(s1.hasOwnProperty("study"));  // false: it lives on the prototype
```

**Why prototypes?** Memory. A thousand students share **one** `study` function instead of carrying a thousand copies.

To print a whole chain:

```js
let proto = s1;
while (proto !== null) {
  console.log(proto.constructor?.name ?? proto);  // Student, Student, Object
  proto = Object.getPrototypeOf(proto);
}
```

### prototype vs `__proto__` vs constructor

| Name | Belongs to | Meaning |
| --- | --- | --- |
| `Student.prototype` | the constructor function | the object that instances will inherit from |
| `s1.__proto__` | an instance | its prototype, the same object as `Student.prototype` (prefer `Object.getPrototypeOf(s1)`) |
| `Student.prototype.constructor` | the prototype | points back to `Student` |

```js
console.log(Object.getPrototypeOf(s1) === Student.prototype); // true
console.log(Student.prototype.constructor === Student);       // true
```

### How instanceof works

`s1 instanceof Student` walks up `s1`'s prototype chain and returns `true` if it meets `Student.prototype` anywhere:

```js
function myInstanceOf(obj, Ctor) {
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto === Ctor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
console.log(myInstanceOf(s1, Student), myInstanceOf(s1, Object), myInstanceOf(s1, Array)); // true true false
```

## Object.create: inheritance without classes

`Object.create(proto)` makes a new, empty object whose prototype is `proto`:

```js
const person = {
  greet() {
    return `Hello, I'm ${this.name}`;
  },
};

const student = Object.create(person);   // student → person → Object.prototype → null
student.name = "Vikas";
console.log(student.greet());            // "Hello, I'm Vikas"
```

`Object.create(null)` creates an object with **no** prototype at all, handy as a pure dictionary with no inherited keys.

| Way to create | Prototype of the new object |
| --- | --- |
| `{}` or `new Object()` | `Object.prototype` |
| `Object.create(proto)` | `proto` |
| `Object.create(null)` | none |
| `new Fn()` | `Fn.prototype` |

### What `new` does

`new Student("Vikas")` performs four steps:

1. Creates a new empty object.
2. Sets its prototype to `Student.prototype`.
3. Calls `Student` with `this` pointing to the new object.
4. Returns that object (unless the function explicitly returns another object).

## Classes: cleaner syntax, same prototypes

`class` doesn't add a new object model. It's **syntactic sugar** over constructor functions and prototypes, with stricter rules and nicer syntax.

```js
class Account {
  #balance = 0;                        // private field: inaccessible outside the class
  static bank = "Bitwise Bank";        // static: belongs to the class, not instances

  constructor(owner) {
    this.owner = owner;
  }

  deposit(amount) {                    // goes on Account.prototype
    if (amount <= 0) throw new Error("Amount must be positive");
    this.#balance += amount;
    return this;
  }

  get balance() {                      // getter: read like a property
    return this.#balance;
  }

  static compare(a, b) {
    return a.balance - b.balance;
  }
}

class SavingsAccount extends Account {
  constructor(owner, rate) {
    super(owner);                      // must call super before using this
    this.rate = rate;
  }

  deposit(amount) {                    // overriding: same name, new behaviour
    super.deposit(amount);
    return this;
  }

  addInterest() {
    return this.deposit(this.balance * this.rate);
  }
}

const acc = new SavingsAccount("Asha", 0.1).deposit(1000).addInterest();
console.log(acc.balance);                                     // 1100
console.log(typeof Account);                                  // "function": classes are functions
console.log(Object.getPrototypeOf(SavingsAccount.prototype) === Account.prototype); // true
```

### Class vs constructor function

| | Class | Constructor function |
| --- | --- | --- |
| syntax | modern, readable | older, more verbose |
| inheritance | `extends` and `super` | manual prototype wiring |
| calling without `new` | TypeError | silently runs with the wrong `this` |
| hoisting | in the TDZ, can't use before declaring | function declarations are hoisted |
| strict mode | always | only if you enable it |
| private fields | `#field` | only through closures |

### OOP pillars in JavaScript

- **Encapsulation:** private `#fields`, or closures.
- **Abstraction:** expose simple methods, hide the details.
- **Inheritance:** `extends`, which is the prototype chain.
- **Polymorphism:** subclasses **override** methods. JavaScript has **no method overloading** (two methods with the same name): the last definition wins, so handle different arguments inside one method.

## Interview questions

1. What's the difference between primitives and objects? What does "immutable primitive" mean?
2. How does `"john".toUpperCase()` work? What is autoboxing? How many wrapper classes are there?
3. Why does `"John".age = 20` not work?
4. Explain the prototype chain. Why are prototypes memory-efficient?
5. Difference between `prototype`, `__proto__` and `constructor`.
6. How does `instanceof` work internally? Implement it.
7. Create inheritance without `class`, using `Object.create` or constructor functions.
8. Why are classes called syntactic sugar? Class vs constructor function.
9. What are private fields and static methods? Does JavaScript support method overloading?

## Further reading

- [MDN: Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [javascript.info: Prototypes, inheritance](https://javascript.info/prototypes) and [Classes](https://javascript.info/classes)

Next: [the `this` keyword](/notes/javascript-this).
