---
title: Promises, Prototypes and this
description: Promise states and methods, wrapper classes and autoboxing, the prototype chain, call/apply/bind and classes.
author: Vikas Patel
---

### Topics Covered

1. Promises
1. Prototypes
1. Bindings (`this`)
1. Classes

---

## 1. Promises

### What is a Promise?

A **Promise** is a JavaScript object that represents the **eventual completion or failure of an asynchronous operation**.

Instead of waiting for a task to finish, JavaScript continues executing the remaining code.

```
Promise
   |
   |---- Pending
   |
   |---- Fulfilled (Resolved)
   |
   |---- Rejected
```

#### Promise States

#### 1. Pending

The promise has started but hasn't completed yet.

#### 2. Fulfilled (Resolved)

The asynchronous operation completed successfully.

#### 3. Rejected

The operation failed.

---

### Creating a Promise

```js
const promise = new Promise((resolve, reject) => {

    let success = true;

    if(success){
        resolve("Data fetched successfully");
    }else{
        reject("Something went wrong");
    }

});
```

---

### Consuming a Promise

```js
promise
.then((result)=>{
    console.log(result);
})
.catch((error)=>{
    console.log(error);
})
.finally(()=>{
    console.log("Completed");
});
```

---

### Promise Methods

#### Promise.all()

Runs multiple promises simultaneously.

- Waits for all promises
- Returns an array of results
- Rejects immediately if any promise fails

```js
Promise.all([p1,p2,p3])
.then(res=>console.log(res))
.catch(err=>console.log(err));
```

---

#### Promise.race()

Returns the result of the first promise that settles.

```js
Promise.race([p1,p2,p3])
.then(res=>console.log(res))
.catch(err=>console.log(err));
```

---

#### Promise.all vs Promise.race

| Promise.all() | Promise.race() |
| --- | --- |
| Waits for all promises | Returns first completed promise |
| Returns array | Returns single value |
| Fails if one fails | First settled promise wins |

---

## 2. Prototypes

## JavaScript Wrapper Classes, Autoboxing, Mutable vs Immutable & Prototype Chain

---

## 1. Primitive vs Object

### Primitive Types (7)

```js
String
Number
Boolean
BigInt
Symbol
null
undefined
```

Characteristics

- Store actual value
- Immutable
- Compared by value
- No custom properties
- Stored by value

Example

```js
let name = "Vikas";

name.age = 22;

console.log(name.age); // undefined
```

---

### Objects

```js
Object
Array
Function
Date
Map
Set
RegExp
```

Characteristics

- Mutable
- Stored by reference
- Can have custom properties

```js
let obj = {};

obj.age = 22;

console.log(obj.age);
```

Output

```
22
```

---

## 2. Wrapper Classes

Wrapper classes allow primitive values to behave like objects temporarily.

JavaScript has **5 Wrapper Classes**.

| Primitive | Wrapper Class |
| --- | --- |
| string | String |
| number | Number |
| boolean | Boolean |
| bigint | BigInt |
| symbol | Symbol |

> ❌ `null` and `undefined` do **not** have wrapper classes.

---

## 3. Autoboxing

Autoboxing is the automatic conversion of a primitive into a temporary wrapper object when you access methods or properties.

Example

```js
let str = "john";

console.log(str.toUpperCase());
```

Internally

```js
let temp = new String("john");

temp.toUpperCase();

temp = null;
```

Temporary wrapper object is destroyed immediately after the operation.

---

### Another Example

```js
let n = 12.345;

console.log(n.toFixed(2));
```

Internally

```js
let temp = new Number(12.345);

temp.toFixed(2);

temp = null;
```

---

## 

---

## 5. Prototype Chain

Example

```js
let str = new String("john");
```

Prototype chain

```
str
 │
 ▼
String Object
 │
 ▼
String.prototype
 │
 ▼
Object.prototype
 │
 ▼
null
```

Method lookup

```
str.toUpperCase()

↓

Search in object

↓

Search in String.prototype

↓

Method found

↓

Execute

↓

Stop
```

---

## 6. Mutable vs Immutable

### Immutable

Primitive values are immutable.

```js
let str = "Hello";

str.toUpperCase();

console.log(str);
```

Output

```
Hello
```

Original string never changes.

---

### Mutable

Objects are mutable.

```js
let obj = {
    name:"John"
};

obj.name = "Vikas";

console.log(obj.name);
```

Output

```
Vikas
```

---

## 7. Copy by Value vs Reference

Primitive

```js
let a = 10;

let b = a;

b = 20;
```

Memory

```
a → 10

b → 20
```

---

Object

```js
let obj1 = {
    age:20
};

let obj2 = obj1;

obj2.age = 30;
```

Memory

```
obj1
   │
   ▼
 {age:30}
   ▲
   │
obj2
```

---

## 8. Wrapper Objects

```js
new String("Hello")

new Number(100)

new Boolean(true)

Object(100n)

Object(Symbol())
```

Avoid using wrapper constructors in real code.

Use

```js
let str = "Hello";

let num = 100;

let flag = true;
```

instead of

```js
new String()

new Number()

new Boolean()
```

---

## 9. String Wrapper Properties

```js
let str = new String("john");
```

Own properties

```js
Object.getOwnPropertyNames(str)
```

Output

```js
[
 "0",
 "1",
 "2",
 "3",
 "length"
]
```

---

## 10. Prototype Methods

```js
Object.getOwnPropertyNames(String.prototype)
```

Some methods

```
charAt()

slice()

substring()

split()

replace()

replaceAll()

includes()

startsWith()

endsWith()

trim()

repeat()

match()

search()

toUpperCase()

toLowerCase()

toString()

valueOf()
```

---

## 11. Number Methods

```
toFixed()

toPrecision()

toExponential()

toString()

valueOf()

toLocaleString()
```

Static

```
Number.isInteger()

Number.isNaN()

Number.isFinite()

parseInt()

parseFloat()
```

---

## 12. Boolean Methods

```
toString()

valueOf()
```

---

## 13. BigInt Methods

```
toString()

toLocaleString()

valueOf()
```

---

## 14. Symbol Methods

```
toString()

valueOf()

description
```

Static

```
Symbol.for()

Symbol.keyFor()
```

---

## 15. Object.keys()

```js
let str = new String("john");

Object.keys(str);
```

Output

```js
[
"0",
"1",
"2",
"3"
]
```

Why?

Because `Object.keys()` returns **only enumerable own properties**.

---

## 16. Object.getOwnPropertyNames()

```js
Object.getOwnPropertyNames(str);
```

Output

```
0

1

2

3

length
```

Returns **all own properties**, including non-enumerable ones like `length`.

---

## 17. See all String methods

```js
Object.getOwnPropertyNames(String.prototype);
```

Returns every method defined on `String.prototype`.

---

## 18. Get Prototype

```js
Object.getPrototypeOf(str);
```

Output

```
String.prototype
```

Next

```js
Object.getPrototypeOf(String.prototype);
```

Output

```
Object.prototype
```

Next

```js
Object.getPrototypeOf(Object.prototype);
```

Output

```
null
```

---

## 19. Print Complete Prototype Chain

```js
let proto = str;

while (proto !== null) {
    console.log(proto);
    proto = Object.getPrototypeOf(proto);
}
```

Output

```
String Object

↓

String.prototype

↓

Object.prototype

↓

null
```

---

## 20. Best Commands for Learning Wrapper Classes

```js
let str = new String("john");

// Own enumerable properties
Object.keys(str);

// All own properties
Object.getOwnPropertyNames(str);

// Prototype methods
Object.getOwnPropertyNames(String.prototype);

// Direct prototype
Object.getPrototypeOf(str);

// Interactive inspection in browser DevTools
console.dir(str);
```

---

## 21. Interview Questions

#### Why does `"John".toUpperCase()` work?

Because JavaScript performs **autoboxing**, creating a temporary `String` wrapper object and looking up the method in `String.prototype`.

---

#### Why does `"John".age = 20` not work?

The property is added to a temporary wrapper object, which is immediately destroyed. The next access creates a new wrapper object, so the property no longer exists.

---

#### How many wrapper classes are there in JavaScript?

**Five**: `String`, `Number`, `Boolean`, `BigInt`, and `Symbol`.

---

#### Are wrapper classes the same as primitive values?

No.

```js
typeof "John";              // "string"
typeof new String("John");  // "object"
```

---

#### How do methods become available on primitives?

Through **autoboxing** and the **prototype chain**:

```
Primitive
      ↓
Temporary Wrapper Object
      ↓
Wrapper.prototype
      ↓
Object.prototype
      ↓
null
```

This is the complete flow behind how JavaScript primitives behave like objects when you call methods such as `toUpperCase()`, `toFixed()`, or `toString()`.

**Prototype Chain**.

---

### Why Prototypes?

Instead of copying methods into every object,

all objects share one common copy.

Example:

```js
function Student(name){
    this.name = name;
}

Student.prototype.study = function(){
    console.log(this.name + " is studying");
};

const s1 = new Student("Vikas");
const s2 = new Student("Rahul");

s1.study();
s2.study();
```

Only one copy of `study()` exists.

---

### 

---

### Object.create()

Used to create inheritance manually.

```js
const person = {
    greet(){
        console.log("Hello");
    }
};

const student = Object.create(person);

student.name = "Vikas";

student.greet();

 prototype chain -->>
 
student
   |
   ↓
person
   |
   ↓
Object.prototype
```

Output

```
Hello
```

---

## 3. Bindings (`this` Keyword)

Binding means deciding what the keyword **`this`** refers to in a particular execution context.

There are **4 types of bindings**:

1. Default Binding
1. Implicit Binding
1. Explicit Binding
1. New Binding

---

### 1. Default Binding

If no object calls the function,

`this` refers to the global object (or `undefined` in strict mode).

```js
function show(){
    console.log(this);
}

show();
```

---

### 2. Implicit Binding

When a function is called using the **dot operator**, `this` refers to the object before the dot.

```js
const person = {

    name:"Vikas",

    display(){
        console.log(this.name);
    }

};

person.display();
```

Output

```
Vikas
```

---

### 3. Explicit Binding

JavaScript provides three methods to manually set `this`:

- `call()`
- `apply()`
- `bind()`

---

#### call()

Calls the function immediately.

Arguments are passed individually.

```js
function greet(city){
     // this ->user 
    console.log(this.name, city);
}

const user = {
    name:"Vikas"
};

greet.call(user,"Lucknow");
```

Output

```
Vikas Lucknow
```

---

#### apply()

Similar to `call()`

Arguments are passed as an array.

```js
greet.apply(user,["Lucknow"]);
```

---

#### bind()

Returns a new function.

It does **not** execute immediately.

```js
const newFunc = greet.bind(user,"Lucknow");

newFunc();
```

---

### call vs apply vs bind

| call() | apply() | bind() |
| --- | --- | --- |
| Executes immediately | Executes immediately | Returns new function |
| Arguments individually | Arguments as array | Arguments individually |
| Doesn't return function | Doesn't return function | Returns function |

---

### 4. New Binding

Using the `new` keyword creates a **new execution context** and binds `this` to the newly created object.

```js
function Student(name){
    this.name = name;
}

const s1 = new Student("Vikas");

console.log(s1.name);
```

---

## 4. Classes

JavaScript provides **class syntax**, which is a cleaner way to work with prototype-based inheritance. The lecture notes state that JavaScript is not OOP-based in itself and uses classes to simplify prototype chaining.

---

### Class Syntax

```js
class Student{

    constructor(name){
        this.name = name;
    }

    study(){
        console.log(this.name + " is studying");
    }

}

const s1 = new Student("Vikas");

s1.study();
```

---

### Class vs Constructor Function

| Class | Constructor Function |
| --- | --- |
| Modern syntax | Traditional syntax |
| Easier to read | More verbose |
| Uses prototypes internally | Uses prototypes directly |
| Supports `extends` | Manual inheritance |

---

## Complete Flow Diagram

```
JavaScript

│

├── Promises
│      ├── Pending
│      ├── Fulfilled
│      ├── Rejected
│      ├── Promise.all()
│      └── Promise.race()
│
├── Prototypes
│      ├── Prototype Chain
│      ├── Inheritance
│      └── Object.create()
│
├── Bindings
│      ├── Default
│      ├── Implicit
│      ├── Explicit
│      │      ├── call()
│      │      ├── apply()
│      │      └── bind()
│      └── New Binding
│
└── Classes
       ├── constructor()
       ├── methods
       └── prototype-based inheritance
```

---

## Interview Questions

#### Promises

- What is a Promise?
- What are the three Promise states?
- Difference between `Promise.all()` and `Promise.race()`.
- What is `.finally()` used for?

#### Prototypes

- What is a prototype?
- Explain the prototype chain.
- How does `Object.create()` work?
- Why are prototypes memory efficient?

#### Bindings

- What is `this` in JavaScript?
- Explain Default, Implicit, Explicit, and New Binding.
- Difference between `call()`, `apply()`, and `bind()`.

#### Classes

- Why are classes considered syntactic sugar?
- Difference between classes and constructor functions.
- How does inheritance work internally in JavaScript?

These notes closely follow the lecture topics and headings from the uploaded PDF, while expanding them with explanations, diagrams, and examples for easier study.

---

## JavaScript Hard Interview Questions

### 1. Explain the Event Loop in detail.

- Call Stack
- Web APIs
- Callback Queue
- Microtask Queue
- Macrotask Queue
- Promise vs setTimeout
- async/await execution

---

### 2. Predict the Output

```js
console.log(1);

setTimeout(() => console.log(2));

Promise.resolve().then(() => console.log(3));

queueMicrotask(() => console.log(4));

console.log(5);
```

---

### 3. What is the difference between

- var
- let
- const

Explain with

- Scope
- Hoisting
- TDZ
- Redeclaration
- Reassignment
- Window object

---

### 4. Explain Closures

Questions

- What is Closure?
- Why are Closures useful?
- Memory leak because of Closure?
- Private variables using Closure.

---

### 5. Implement your own

```js
Array.prototype.map
```

without using map.

---

### 6. Implement

```js
filter()
```

---

### 7. Implement

```js
reduce()
```

---

### 8. Implement

```js
bind()
```

---

### 9. Implement

```js
call()
```

---

### 10. Implement

```js
apply()
```

---

## Objects & Prototype

### 11. Explain Prototype Chain.

---

### 12. Difference between

```js
__proto__
prototype
constructor
```

---

### 13. How does inheritance work in JavaScript?

---

### 14. Create inheritance without using class.

---

### 15. Difference between

```js
Object.create()

new Object()

{}

new
```

---

### 16. Explain

```js
instanceof
```

internally.

---

## this Keyword

### 17. Predict Output

```js
const obj = {
    name: "John",
    show() {
        console.log(this.name);
    }
}

const fn = obj.show;
fn();
```

---

### 18.

```js
const obj = {
    name: "Alex",
    arrow: () => {
        console.log(this.name);
    }
}

obj.arrow();
```

Why?

---

### 19. Difference between Arrow Function and Normal Function.

---

### 20. Can Arrow Function be constructor?

Why?

---

## Async JavaScript

### 21. Explain Promise internally.

---

### 22. Promise chaining vs async-await.

---

### 23. Implement Promise.all()

---

### 24. Implement Promise.race()

---

### 25. Implement Promise.any()

---

### 26. Implement Promise.allSettled()

---

### 27. What happens if one promise rejects?

---

### 28. Difference

```
Promise.resolve()

Promise.reject()
```

---

### 29. Output

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

---

### 30. Output

```js
setTimeout(() => console.log("A"),0);

Promise.resolve().then(()=>console.log("B"));

console.log("C");
```

---

## Execution Context

### 31. Explain Execution Context.

---

### 32. Explain Memory Phase and Execution Phase.

---

### 33. Explain Hoisting internally.

---

### 34. Explain Lexical Environment.

---

### 35. Explain Scope Chain.

---

## Advanced Functions

### 36. Currying

Implement

```js
sum(1)(2)(3)
```

---

### 37. Infinite Currying

```js
sum(1)(2)(3)(4)(5)()
```

---

### 38. Debouncing

Implement from scratch.

---

### 39. Throttling

Implement from scratch.

---

### 40. Memoization

Implement from scratch.

---

## Polyfills

### 41. Polyfill for

```
map
filter
reduce
bind
call
apply
Promise.all
Promise.race
flat
flatMap
```

---

## Object Questions

### 42.

Difference between

```
freeze
seal
preventExtensions
```

---

### 43.

Deep Copy vs Shallow Copy

---

### 44.

How does

```
JSON.parse(JSON.stringify())
```

fail?

---

### 45.

Implement Deep Clone.

---

### 46.

Difference

```
Object.assign()

Spread (...)
```

---

## Memory Management

### 47.

How does Garbage Collection work?

---

### 48.

WeakMap vs Map

---

### 49.

WeakSet vs Set

---

### 50.

Memory Leak examples.

---

## Modules

### 51.

CommonJS vs ES Modules.

---

### 52.

Dynamic Import.

---

### 53.

Tree Shaking.

---

### 54.

How do modules work internally?

---

## Classes

### 55.

Difference

```
Class

Constructor Function
```

---

### 56.

Private Fields

```js
#balance
```

---

### 57.

Static Methods

---

### 58.

Method Overriding.

---

### 59.

Can JavaScript do Method Overloading?

---

## Browser

### 60.

Difference

```
DOM

BOM

Virtual DOM
```

---

### 61.

Event Delegation.

---

### 62.

Event Bubbling.

---

### 63.

Event Capturing.

---

### 64.

stopPropagation()

---

### 65.

preventDefault()

---

### 66.

Difference

```
target

currentTarget
```

---

## Tricky Output Questions

### 67.

```js
console.log(typeof null);
```

Why?

---

### 68.

```js
console.log([] + []);
```

---

### 69.

```js
console.log([] + {});
```

---

### 70.

```js
console.log({} + []);
```

---

### 71.

```js
console.log(0 == false);
```

---

### 72.

```js
console.log([] == false);
```

---

### 73.

```js
console.log(null == undefined);
console.log(null === undefined);

```

---

### 74.

```js
console.log(NaN == NaN);
```

---

### 75.

```js
console.log(typeof NaN);
```

---

## Coding Questions

### 76.

Flatten Array

```js
[1,[2,[3,[4]]]]
```

---

### 77.

Flatten Object.

---

### 78.

Group By

```js
users.groupBy(age)
```

---

### 79.

Deep Compare Objects.

---

### 80.

Implement LRU Cache.

---

### 81.

Implement EventEmitter.

---

### 82.

Implement Custom Promise.

---

### 83.

Implement Retry Function.

---

### 84.

Implement Scheduler.

---

### 85.

Limit Concurrent Promises.

---

### 86.

Create Observable.

---

### 87.

Implement Publish-Subscribe Pattern.

---

### 88.

Implement Singleton.

---

### 89.

Implement Compose Function.

---

### 90.

Implement Pipe Function.

---

## Real Interview Scenarios

### 91.

How would you optimize a slow JavaScript application?

---

### 92.

How does React use JavaScript's event loop?

---

### 93.

Why is JavaScript single-threaded?

---

### 94.

Can JavaScript become multi-threaded?

---

### 95.

What are Web Workers?

---

### 96.

How would you handle 100,000 DOM elements?

---

### 97.

How does V8 optimize JavaScript?

---

### 98.

Explain Hidden Classes and Inline Caching in V8.

---

### 99.

Explain the JavaScript Engine architecture.

---

### 100.

Build a Promise library from scratch.

---

## Must-Prepare Topics (Asked in MAANG & Top Product Companies)

1. Event Loop (Microtasks vs Macrotasks) or ( task queue vs microtaskqueue )
1. Closures
1. `this` keyword
1. Prototypes & Prototype Chain
1. Execution Context
1. Hoisting & Temporal Dead Zone (TDZ)
1. Call, Apply & Bind (including polyfills)
1. Promises & Async/Await
1. Debouncing & Throttling
1. Currying & Memoization
1. Deep Copy vs Shallow Copy
1. Event Bubbling, Capturing & Delegation
1. Garbage Collection & Memory Leaks
1. Polyfills for common methods
1. Tricky output-based questions
