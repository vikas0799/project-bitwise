---
title: OOP in JavaScript
description: Encapsulation, abstraction, inheritance, polymorphism, classes, this, static methods, getters and setters.
author: Vikas Patel
---

### What is OOP?

**Object-Oriented Programming (OOP)** is a programming paradigm where we organize code using **objects** that contain **properties (data)** and **methods (behavior)**.

JavaScript supports OOP through **prototypes** and the modern **`class` syntax** (introduced in ES6).

---

## Four Pillars of OOP

1. Encapsulation
1. Abstraction
1. Inheritance
1. Polymorphism

---

## 1. Encapsulation

**Definition:**

Encapsulation means **bundling data and methods together** inside an object and controlling access to them.

#### Example

```js
class BankAccount {
  constructor(owner, balance) {
    this.owner = owner;
    this.balance = balance;
  }

  deposit(amount) {
    this.balance += amount;
  }

  withdraw(amount) {
    this.balance -= amount;
  }
}

const account = new BankAccount("Vikas", 1000);

account.deposit(500);

console.log(account.balance); // 1500

// only public and private access modifier
//  balance=2000  (public access modifier
//  #balance= 2000 ( private access modifier
```

#### Private Fields (ES2022)

```js
class BankAccount {
  #balance = 1000;

  deposit(amount) {
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount();

account.deposit(500);

console.log(account.getBalance()); // 1500
```

❌

```js
console.log(account.#balance);
```

This throws an error because `#balance` is private.

---

## 2. Abstraction

**Definition:**

Hide internal implementation and expose only what the user needs.

Example:

```js
class Car {
  start() {
    this.#injectFuel();
    this.#startEngine();

    console.log("Car Started");
  }

  #injectFuel() {
    console.log("Fuel Injected");
  }

  #startEngine() {
    console.log("Engine Started");
  }
}

const bmw = new Car();

bmw.start();
```

Output

```
Fuel Injected
Engine Started
Car Started
```

The user only calls `start()` without knowing the internal steps.

---

## 3. Inheritance

**Definition:**

A child class can inherit properties and methods from a parent class.

```js
class Animal {
  eat() {
    console.log("Eating...");
  }
}

class Dog extends Animal {
  bark() {
    console.log("Woof");
  }
}

const dog = new Dog();

dog.eat();
dog.bark();
```

Output

```
Eating...
Woof
```

---

## super Keyword

Used to call the parent constructor or methods.

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);

    this.breed = breed;
  }
}

const dog = new Dog("Tommy", "Labrador");

console.log(dog);
```

Output

```js
{
  name: "Tommy",
  breed: "Labrador"
}
```

---

## 4. Polymorphism

**Definition:**

The same method behaves differently (multiple varriants) depending on the object. 

```js
class Animal {
  speak() {
    console.log("Animal Sound");
  }
}

class Dog extends Animal {
  speak() {
    console.log("Woof");
  }
}

class Cat extends Animal {
  speak() {
    console.log("Meow");
  }
}

const dog = new Dog();
const cat = new Cat();

dog.speak(); // Woof
cat.speak(); // Meow
```

Output

```
Woof
Meow
```

This is **method overriding**.

---

## Constructor

A constructor runs automatically when an object is created.

```js
class Student {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

const s1 = new Student("Vikas", 24);

console.log(s1);
```

---

## this Keyword

`this` refers to the current object.

```js
class User {
  constructor(name) {
    this.name = name;
  }

  greet() {
    console.log(`Hello ${this.name}`);
  }
}

const user = new User("Vikas");

user.greet();
```

Output

```
Hello Vikas
```

---

## Static Methods

Static methods belong to the class, not its instances.

```js
class MathUtil {
  static add(a, b) {
    return a + b;
  }
}

console.log(MathUtil.add(10, 20));
```

Output

```
30
```

---

## Getter and Setter

```js
class Person {
  constructor(name) {
    this._name = name;
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
  }
}

const person = new Person("Vikas");

console.log(person.name);

person.name = "Rahul";

console.log(person.name);
```

---

## Factory Function

```js
function createUser(name) {
  return {
    name,

    greet() {
      console.log(`Hello ${this.name}`);
    }
  };
}

const user = createUser("Vikas");

user.greet();
```

---

## Constructor Function (Before ES6)

```js
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function () {
  console.log(`Hello ${this.name}`);
};

const p = new Person("Vikas");

p.greet();
```

---

## ES6 Class (Modern)

```js
class Person {
  constructor(name) {
    this.name = name;
  }

  greet() {
    console.log(`Hello ${this.name}`);
  }
}

const p = new Person("Vikas");

p.greet();
```

---

## Factory vs Constructor vs Class

| Feature | Factory Function | Constructor Function | ES6 Class |
| --- | --- | --- | --- |
| Uses `new` | ❌ No | ✅ Yes | ✅ Yes |
| Easy to understand | ✅ | ⚠️ | ✅ |
| Uses prototype | ❌ Usually no | ✅ | ✅ |
| Modern syntax | ⚠️ | ❌ | ✅ |

---

## Interview Questions

#### 1. What are the four pillars of OOP?

- Encapsulation
- Abstraction
- Inheritance
- Polymorphism

---

#### 2. Difference between Class and Object?

| Class | Object |
| --- | --- |
| Blueprint | Instance of a class |
| Logical entity | Real entity |
| Created once | Can have many instances |

---

#### 3. Difference between Constructor Function and Class?

- Constructor functions use function syntax and prototypes manually.
- Classes provide cleaner syntax over the same prototype-based mechanism.

---

#### 4. Difference between Method Overloading and Method Overriding?

- **Overloading:** Same method name with different parameters (**not supported directly in JavaScript**).
- **Overriding:** Child class replaces the parent method.

---

#### 5. Why does JavaScript use prototypes?

To implement inheritance efficiently by sharing methods instead of copying them into every object.

---

## Quick Revision

| Concept | Purpose |
| --- | --- |
| Class | Blueprint for objects |
| Object | Instance of a class |
| Constructor | Initializes object |
| `this` | Refers to the current instance |
| `extends` | Inherits from a parent class |
| `super()` | Calls the parent constructor or methods |
| Static Method | Called on the class itself |
| Getter/Setter | Controlled access to properties |
| Prototype | Shares methods between objects |
| Factory Function | Creates objects without `new` |

#### Interview Tip

Although JavaScript has a `class` keyword, **under the hood it is still prototype-based**. The `class` syntax is syntactic sugar over JavaScript's prototype inheritance model. This is one of the most common JavaScript interview questions.
