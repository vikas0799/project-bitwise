---
title: JavaScript Revision: Foundations to Advanced
description: Variables, data types, scope, hoisting, closures, arrays, objects, higher-order functions, async JavaScript, the DOM and browser APIs, with interview questions.
author: Vikas Patel
---

### **JavaScript Foundations**

#### 🔹 Introduction to JavaScript

- What is JavaScript?
- JavaScript vs HTML vs CSS
- Where JavaScript runs (Browser, Server)
- JavaScript Engine (Brief)
- Ways to write JavaScript
  - Inline
  - Internal
  - External
- `script` tag & file linking
- Console & Developer Tools

#### 🔹 Variables in JavaScript

- What is a variable?
- Variable declaration & initialization
- Naming rules & best practices

#### 🔹 `var`, `let`, `const`

- `var` keyword
- `let` keyword
- `const` keyword
- Difference: `var` vs `let` vs `const`
- Re-declaration & re-assignment rules

```js
var a = 10;
let b = 20;
const c = 30;

```

```js
var a = 10;
var a = 20; // allowed
let b = 10;
// let b = 20; ❌ not allowed
b = 30; // allowed
const c = 50;
// c = 60 ❌ not allowed
```

#### 🔹 Data Types

- Primitive Data Types
  - Number
  - String
  - Boolean
  - Undefined
  - Null
  - Symbol (intro)
  - BigInt (intro)

```js
let age = 25;                     // Number
let name = "Vikas";               // String
let isActive = true;              // Boolean
let score;                        // Undefined
let emptyValue = null;            // Null
let uniqueId = Symbol("id");      // Symbol (intro)
let bigNumber = 12345678901234567890n; // BigInt (intro)

```

- Non-Primitive Data Types
  - Object
  - Function

```js
let obj = { name: "JS" };
let arr = [1, 2, 3];
let fn = function () {};

```

- `typeof` operator

```js
typeof 10;        // "number"
typeof null;      // "object"
typeof undefined; // "undefined"

```

#### 🔹 Operators

- Arithmetic Operators
- Assignment Operators
- Comparison Operators
- Logical Operators
- Unary Operators
- Ternary Operator
- Operator Precedence (basic)

```js
let sum = 10 + 5;                 // Arithmetic Operator (+)
let x = 10; x += 5;              // Assignment Operator (+=)
let isEqual = (5 === "5");        // Comparison Operator (===)
let canVote = age >= 18 && indian;// Logical Operator (&&)
let count = ++i;                 // Unary Operator (++)
let result = marks >= 40 ? "Pass" : "Fail"; // Ternary Operator (?:)
let value = 10 + 5 * 2;          // Operator Precedence (* before +)
== vs === kya diffrence hain ?
```

#### 🔹 Conditional Statements

- `if`
- `if else`
- `else if`
- Nested `if`
- `switch case`
- Truthy & Falsy values

---

```js
/* Output kya hoga */
console.log(1 < 2 < 3);
console.log(3 > 2 > 1);
console.log(1 < 2 && 2 < 3);
console.log(3 > 2 && 2 > 1);

```

- Ao dekhte hain Answer

### **Control Flow & Functions**

#### 🔹 Loops

- Why loops are needed
- `for` loop
- `while` loop
- `do...while` loop
- Nested loops
- `break` statement
- `continue` statement

```js
// for(let i=0;i<10;i++){
//     console.log(i);
    
// }
let i=0;
while(i<10){
console.log(i);
i++;
}
```

#### 🔹 Functions

- What is a function?
- Function declaration
- Function expression
- Parameters & arguments
- Return statement
- Function calling
- Default parameters
- Arrow functions (intro)
- Difference: normal vs arrow function (basic)

```js
// What is a function → reusable block of code

// function add(a,b){
// console.log("hi");
// console.log(a+b);   
// return a*b ;
// }

//anonymus fn
// let sum=function (){
//     console.log("hi");
//     console.log("bye");
    
    
// };

//arrow fn
let sum=(a,b)=>{
    console.log("hi");
    console.log("bye");
    return a+b;
    
};
// console.log(sum);
console.log(sum(2,3));

```

---

***Ao Kuch Karte hain function ki help se***

- Calculator using function ( 2 numbers aur ek operator (`+ - * /`) lo aur result return karo)
- Answer

### **JavaScript Execution Concepts**

#### 🔹 Scope in JavaScript

- What is scope?
- Global scope
- Function scope
- Block scope
- Scope chain
- Variable accessibility

#### 🔹 Hoisting

- What is hoisting?
- Hoisting with `var`
- Hoisting with `let`
- Hoisting with `const`
- Function hoisting
- Variable hoisting vs function hoisting

#### 🔹 Temporal Dead Zone (TDZ)

- What is TDZ?
- Why TDZ exists
- `let` & `const` behavior
- TDZ vs hoisting
- Common TDZ errors

***let and const hoisting?***

Yes, **technically they are hoisted**, but not in the way you might expect if you are used to `var`.

- **`var` Hoisting:** The variable is hoisted *and* initialized with `undefined`. You can access it before the declaration, but it will be `undefined`.
- **`let` /** **`const` Hoisting:** The variable is hoisted but **remains uninitialized**. Accessing it before the line of code results in a `ReferenceError`.

This period of time—between the start of the block and the actual declaration line—where the variable exists but cannot be touched is called the **Temporal Dead Zone (TDZ)**.

#### The Difference in Action

Here is the code comparison:

**1.** **`var` (Accessible as** **`undefined` )**

`console.log(a); // Output: undefined (No error)
var a = 10;`

**2.** **`let` /** **`const` (The Dead Zone)**

`console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 20;`

**Why does this happen?**

When the code is compiled, the engine *does* see `let b`. It reserves space for `b` in memory (hoisting), but it refuses to give it a default value. It forces you to wait until the line `let b = 20` runs to give it a value.

---

#### Lets Undersatand Memory and Code execution

```js

display();
function display(){
    var a = 90;
    var b = 20;
    console.log(a);
    console.log(b);
}
var a = 90;
console.log(b);
```

```js

let globalNum = 100;

function outer() {
    let outerNum = 200;

    function inner() {
        let innerNum = 300;
        console.log(globalNum); // 100
        console.log(outerNum);  // 200
        console.log(innerNum);  // 300
    }

    inner();
}
outer();

```

```js
/* output Kya hoga */
var a = 10;

function test() {
    var a = 20;
    console.log(a);
}

test();
console.log(a);

```

***Lect-03***

Function expression hoisting and short form syntax return always

Array in JS

hetro in nature, typeof(arr)

array traversing

- for
- for of
- for in (generally for object)

array methods

- push,pop
- shift, unshift
- slice vs splice

Object in JS 

object data types →key value

special key→. space ,empty string , last name

dot(.) vs []

object edit (obj.age=90)

object traversal (for in )

arr.name=”vikas” array is object

**Lect-3 -extra**

Higher Order Function (arg passing or return fn)

closure start, lexical env(already discussed in hoisting)

closure output based practice

counter practice 

**Lect-4**

**closure bank implementation (data encapsulation)**

```js
function secureBankAccount() {
    let balance = 0;

    function deposit(val) {
        balance += val;
        return `After Deposit: ₹${balance}`
    }

    function withdrawl(val) {
        balance -= val;
        return `After Withdrawl: ₹${balance}`
    }

    function getBalance() {
        return balance;
    }

    return {
        deposit, withdrawl, getBalance
    }
}

let account = secureBankAccount();

// Balance: 0
console.log(account.deposit(100)); // Balance: 100
console.log(account.withdrawl(50)); // Balance: 50

console.log(account.getBalance()); // Output:50
```

**closure cart implementation**

```js
function newCart() {
    let cart = [];

    return {
        "addToCart": function (item) {
            cart.push(item);
        },
        "clearCart": function () {
            cart = []
        },
        getCart: function () {
            return cart;
        }
    }
}

let cart = newCart(); // DRY : DONT REPEAT YOURSELF
cart.addToCart("Mobile");
cart.addToCart("Laptop");
cart.addToCart("Jacket");

console.log(cart.getCart());
cart.clearCart();
cart.addToCart("Ipad");
console.log(cart.getCart());

let cart1 = newCart();
cart1.addToCart("ABC");
console.log(cart1.getCart());
```

***object-destructring***

```js
let obj = {
    name: "Vikas",
    dist:"azamgarh"
};

let { name: fullName = "Guest",dist, age = 18 } = obj;

console.log(fullName); // Vikas
console.log(age);      // 18
console.log(dist);     //azamgarh

//let name = "Vikas";
//let age = 25;

//let user = {
   // name,
   // age
//};

console.log(user);
```

template litrals (backtics)

```js
let fname="satyam kumar";
let age=23;

// console.log("my name is satyam and age is 23");
console.log(`my name is ${fname} and age is ${age}`);
```

rest and spread-operator (…)

**Lect-05**

map reduce filter sort HOF

```js
// let arr=[1,12,5,8,9];

//     let ans=arr.filter((Element,index,arr)=>{
//         if(Element%2==0){
//             return true;
//         }
//         else{
//             return false;
//         }
//     })

//     console.log(ans);
    

// let ans=arr.map((Element,index, arr)=>{
//     console.log(Element,index,arr);
    
//     // return Element*3
//     if(Element%2==0){
//         return Element*2;
//     }
//     else{
//         return 3*Element
//     }
// })

// console.log(ans);

let arr=[5,12,5,8,9];
        // reduce(Callback,accumulator-initial-value)
// let ans=arr.reduce(callback,0)
let ans=arr.reduce((acc,Element,index,arr)=>{
    console.log(acc,Element,index,arr);
    // acc=acc+Element;
    if(acc<Element)
        acc=Element;
    return acc;
    
},arr[0]);

console.log(ans);

let arr=[23,45,3,223,1];
// arr.sort();  lexographically sorting
//sort number
arr.sort((a,b)=>{
    return b-a;
})
console.log(arr);
```

currying 

```js
/*function add(num) {
    if (!num) return 0;

    return function helper(v) {
        if (!v) return num;

        num += v;
        return helper;
    }
}*/
let add = function (num) {
    if (!num) return 0;

    return function helper(v) {
        if (!v) return num;

        num += v;
        return helper;
    }
}

console.log(add())
console.log(add(1)())
console.log(add(1)(2)())
console.log(add(1)(2)(3)())
console.log(add(1)(2)(3)(4)())
```

 memoization

```js
function fact(n) {
    let ans = 1;
    for (let i = 1; i <= n; i++) ans *= i;

    return ans;
}

function memoize(fn) {
    let cache = {};

    return function (n) {
        if (cache[n]) {
            console.log("Returning the answer of", n, "from cache");
            return cache[n];
        }
        console.log("Calculating the answer for", n);
        let ans = fn(n);
        return cache[n] = ans;
    }
}

let myFact = memoize(fact);
console.log(myFact(5)); // Calculate kia
console.log(myFact(5)); // Cache se nikal kar diya
```

**Lect-06**

Async Programming

web API/callStack/

even loop

date object

```js
console.log("maggi laya");

let t1=new Date();
t1=t1.getSeconds();

while(new Date().getSeconds()<t1+2){
    console.log("maggi bnana start..");
   console.log("wait 2 second");
       
}

console.log("maggi ban gai , kha lo");

```

**sync task** 

- Tasks execute **one after another** Next line waits until the current line finishes.

**async task**

Tasks start and **move to background**, allowing next code to run immediately.

Handled by:

- Web APIs (browser)
- Node APIs (libuv)
- Event Loop + Callback Queue

**Advance JS Concepts**

### 1. JS Functions

#### What is a Function?

A function is a reusable block of code that performs a specific task.

```js
function greet(name) {
    return `Hello ${name}`;
}

console.log(greet("Vikas"));
```

#### Types of Functions

#### Function Declaration

```js
function add(a, b) {
    return a + b;
}
```

#### Function Expression

```js
const add = function(a, b) {
    return a + b;
};
```

#### Arrow Function

```js
const add = (a, b) => a + b;
```

#### Anonymous Function

```js
setTimeout(function () {
    console.log("Hello");
}, 1000);
```

#### IIFE (Immediately Invoked Function Expression)

```js
(function () {
    console.log("Executed");
})();
```

#### Higher Order Function

A function that accepts another function or returns one.

```js
function greet(fn) {
    fn();
}

greet(() => console.log("Hello"));
```

#### Callback Function

```js
function display(name, callback) {
    console.log(name);
    callback();
}

display("Vikas", () => console.log("Completed"));
```

#### Closure

```js
function outer() {
    let count = 0;

    return function () {
        count++;
        return count;
    };
}

const counter = outer();

console.log(counter());
console.log(counter());
```

#### Currying

```js
function multiply(a) {
    return function(b) {
        return a * b;
    }
}

console.log(multiply(5)(4));
```

#### Function Methods

- call()
- apply()
- bind()

```js
person.print.call(obj);
person.print.apply(obj);
const fn = person.print.bind(obj);
```

---

## 2. JS Objects

Objects store key-value pairs.

```js
const user = {
    name: "Vikas",
    age: 25
};
```

#### Access

```js
user.name
user["age"]
```

#### Add

```js
user.city = "Lucknow";
```

#### Delete

```js
delete user.city;
```

#### Object Methods

```js
Object.keys(obj)
Object.values(obj)
Object.entries(obj)
Object.assign()
Object.freeze()
Object.seal()
```

#### Destructuring

```js
const {name, age} = user;
```

#### Spread

```js
const obj2 = {...user};
```

---

## 3. JS Classes

ES6 way to create objects.

```js
class Person {

    constructor(name){
        this.name = name;
    }

    greet(){
        console.log(this.name);
    }

}

const p = new Person("Vikas");
```

#### Inheritance

```js
class Student extends Person{

    study(){
        console.log("Studying");
    }

}
```

#### Static Method

```js
class MathUtil{

    static add(a,b){
        return a+b;
    }

}
```

---

## 4. JS JSON

JSON = JavaScript Object Notation

```js
const user = {
    name:"Vikas",
    age:25
};
```

Convert object to JSON

```js
JSON.stringify(user);
```

Convert JSON to object

```js
JSON.parse(jsonData);
```

---

## 5. JS Asynchronous

### Synchronous

Runs line by line.

### Asynchronous

Doesn't block execution.

#### Callback

```js
setTimeout(()=>{
console.log("Done");
},1000);
```

#### Promise

```js
const promise = new Promise((resolve,reject)=>{

resolve("Success");

});
```

Consume

```js
promise.then(res=>console.log(res))
.catch(err=>console.log(err));
```

#### Async Await

```js
async function getData(){

const data = await fetch(url);

}
```

#### Event Loop

Call Stack

↓

Web APIs

↓

Callback Queue

↓

Event Loop

---

## 6. JS Modules

Export

```js
export const PI = 3.14;

export function add(){}
```

Default Export

```js
export default function(){}
```

Import

```js
import {PI} from "./math.js";

import add from "./math.js";
```

---

## 7. JS Meta & Proxy

### Proxy

Intercept object operations.

```js
const user = {

name:"Vikas"

};

const proxy = new Proxy(user,{

get(target,prop){

return target[prop];

}

});
```

#### Reflect

```js
Reflect.get(obj,"name");
Reflect.set(obj,"age",25);
```

---

## 8. JS Typed Arrays

Used for binary data.

```js
const arr = new Uint8Array([10,20,30]);

console.log(arr);
```

Types

- Int8Array
- Uint8Array
- Float32Array
- Float64Array

---

## 9. JS DOM Navigation

Select Elements

```js
document.getElementById()

document.querySelector()

document.querySelectorAll()
```

Parent

```js
element.parentElement
```

Children

```js
element.children
```

Sibling

```js
element.nextElementSibling

element.previousElementSibling
```

Create Element

```js
const div = document.createElement("div");
```

Append

```js
document.body.append(div);
```

Remove

```js
div.remove();
```

---

## 10. JS Browser API (BOM)

Browser Object Model

Main Objects

- window
- location
- history
- navigator
- screen
- localStorage
- sessionStorage

Examples

```js
location.href

history.back()

navigator.language

screen.width

localStorage.setItem()

sessionStorage.setItem()
```

Timers

```js
setTimeout()

setInterval()

clearTimeout()

clearInterval()
```

---

## 11. JS Web APIs

Provided by browser.

#### Fetch API

```js
fetch(url)
.then(res=>res.json())
.then(data=>console.log(data));
```

#### Local Storage

```js
localStorage.setItem("name","Vikas");
```

#### Session Storage

```js
sessionStorage.setItem("id",101);
```

#### Geolocation

```js
navigator.geolocation.getCurrentPosition();
```

#### Clipboard

```js
navigator.clipboard.writeText("Hello");
```

#### Notifications

```js
Notification.requestPermission();
```

#### WebSocket

```js
const socket = new WebSocket(url);
```

#### Drag & Drop API

```js
dragstart

dragover

drop
```

---

## 12. JS Graphics

### Canvas API

```html
<canvas id="canvas"></canvas>
```

```js
const canvas = document.getElementById("canvas");

const ctx = canvas.getContext("2d");

ctx.fillRect(50,50,100,100);
```

Draw Circle

```js
ctx.beginPath();

ctx.arc(100,100,50,0,2*Math.PI);

ctx.stroke();
```

#### SVG

Vector graphics.

```html
<svg width="100" height="100">

<circle cx="50" cy="50" r="40"/>

</svg>
```

---

## Interview Questions

#### Functions

- Difference between Function Declaration and Expression.
- What is a Higher Order Function?
- What are Closures?
- Explain Currying.
- Explain `call()`, `apply()`, and `bind()`.

#### Objects

- Difference between Object.freeze() and Object.seal().
- Deep Copy vs Shallow Copy.
- Object Destructuring.
- Spread vs Rest Operator.

#### Classes

- Constructor vs Class.
- Inheritance.
- Static Methods.
- Getters and Setters.

#### JSON

- JSON.parse() vs JSON.stringify().
- Why can't JSON store functions?

#### Asynchronous JavaScript

- Callback Hell.
- Promises.
- async/await.
- Event Loop.
- Microtask Queue vs Callback Queue.

#### Modules

- Named Export vs Default Export.
- Benefits of ES Modules.

#### Proxy & Reflect

- What is a Proxy?
- Why use Reflect?

#### Typed Arrays

- What are Typed Arrays?
- Difference from Normal Arrays.

#### DOM Navigation

- `querySelector()` vs `getElementById()`.
- `children` vs `childNodes`.
- `parentNode` vs `parentElement`.
- Event Delegation.

#### Browser APIs

- What is the Browser Object Model (BOM) and uses?
- Difference between `localStorage` and `sessionStorage`.
- How do `setTimeout()` and `setInterval()` work?

#### Web APIs

- Explain the Fetch API.
- What is CORS?
- What is a WebSocket?
- Difference between Cookies, Local Storage, and Session Storage.

#### Graphics

- Canvas vs SVG.
- When should you use Canvas instead of SVG?
- What is the Canvas Rendering Context?

settimeout,settimeinterval

cleartimeout, clearinterval

```js
console.log("hi");

let id1=setInterval(() => {
    console.log("score ..20");
    
}, 2000);

let id2=setTimeout(() => {
    console.log("hi");
clearInterval(id1);
    
}, 7000);
setTimeout(() => {
    clearInterval(id1);
    clearTimeout(id2);
}, 1000);
console.log(id1);
console.log(id2);

console.log("by");

```

---

---
