---
title: MVC Architecture and Backend Concepts
description: Monolith vs microservices, MVC, routers, method-override, relationships, middleware and validation with Joi.
author: Vikas Patel
---

## 1. Project Structure

### 🏗️ Monolithic Architecture

#### 📌 Definition

A **monolithic application** is a single unified codebase where:

- Frontend + Backend + Database logic are tightly coupled
- Everything runs as one service

#### 📦 Structure Example

```
project/
 ├── routes/
 ├── models/
 ├── views/
 ├── controllers/
 ├── app.js
```

#### ✅ Advantages

- Easy to start (good for beginners)
- Simple deployment
- Less complexity

#### ❌ Disadvantages

- Hard to scale
- Code becomes messy as project grows
- Small change → redeploy whole app

---

### 🔹 Microservices Architecture

#### 📌 Definition

Application is divided into **independent small services**, each handling a specific functionality.

#### 📦 Example

```
user-service/
order-service/
payment-service/
api-gateway/
```

Each service:

- Has its own database
- Runs independently
- Communicates via APIs

#### ✅ Advantages

- Highly scalable
- Independent deployment
- Fault isolation

#### ❌ Disadvantages

- Complex to manage
- Requires DevOps knowledge
- Communication overhead

---

## 🔹 2. MVC Architecture (Very Important)

#### 📌 MVC = Model + View + Controller

#### 🧩 Components

### 1. Model

- Handles database logic
- Represents data structure

Example:

```
const User=mongoose.model("User",userSchema);
```

---

### 2. View

- UI layer (what user sees)
- Example: EJS templates

```
<h1><%= user.name %></h1>
```

---

### 3. Controller

- Business logic
- Connects Model + View

```
app.get("/users",async (req,res) => {
const users=await User.find();
res.render("users", { users });
});
```

---

### 🔁 Flow

```
User Request → Router → Controller → Model → DB
                               ↓
                            View (Response)
```

---

## 🔹 3. Router (Mini Express App)

#### 📌 Concept

Router is like a **mini Express app**

```
const express=require("express");
const router=express.Router();

router.get("/", (req,res) => {
res.send("Home Route");
});

module.exports=router;
```

#### 📌 Use in main app

```
app.use("/users",userRoutes);
```

---

## 🔹 4. Method Override

#### 📌 Problem

HTML forms support only:

- GET
- POST

#### 📌 Solution → `method-override`

```js
const methodOverride=require("method-override");
app.use(methodOverride("_method"));
```

#### 📌 Example

```
<form method="POST" action="/user?_method=PATCH">
```

Now it behaves like:

```
PATCH /user
```

---

## 🔹 5. EJS Mate (Layouts Support)

#### 📌 Problem

EJS doesn’t support layouts by default

#### 📌 Solution → ejs-mate

```
const engine=require("ejs-mate");
app.engine("ejs",engine);
```

#### 📌 Layout Example

```
<!-- layout.ejs -->
<body>
    <%- body %>
</body>
```

---

## 🔹 6. MongoDB Relationships

---

### 🔹 1:1 (One-to-One)

Example:

- User → Profile

```
user.profile=profileId;
```

---

### 🔹 1:Few

- Few related items
- Stored as embedded

```
user.addresses= [ {...}, {...} ];
```

---

### 🔹 1:Many

#### 📌 Two Approaches

#### 1. Embedding

```
post.comments= [{text:"Nice"}, {text:"Good"}];
```

#### 2. Referencing

```
post.comments= [commentId1,commentId2];
```

---

### 🔹 Many:One

Example:

- Many Orders → One User

```
order.user=userId;
```

---

### 🔹 Many:Many

Example:

- Students ↔ Courses

```
student.courses= [courseId];
course.students= [studentId];
```

---

## 🔹 7. Middleware (Very Important)

### 📌 Definition

Functions that run **between request and response**

```
Request → Middleware → Route → Response
```

---

### 🔹 Types

#### 1. Application Middleware

```
app.use((req,res,next) => {
console.log("Middleware");
next();
});
```

---

#### 2. Route Middleware

```
app.get("/dashboard",isLoggedIn, (req,res) => {});
```

---

#### 3. Error Middleware

```
app.use((err,req,res,next) => {
res.send(err.message);
});
```

---

## 🔹 8. MongoDB Middleware (Mongoose)

---

### 🔹 Pre Middleware

Runs **before event**

```
schema.pre("save",function(next) {
console.log("Before Save");
next();
});
```

---

### 🔹 Post Middleware

Runs **after event**

```
schema.post("save",function(doc) {
console.log("After Save");
});
```

---

## 🔹 9. Validation

---

### 🔹 Client-Side Validation

- Done in browser
- Fast feedback

Example:

```html
<input required minlength="3"/>
```

---

### 🔹 Server-Side Validation

- Done in backend
- More secure

```js
if (!req.body.name) {
throw new Error("Name required");
}
```

---

## 🔹 10. Joi Validation (Best Practice)

#### 📌 What is Joi?

A library for **schema-based validation**

---

### 🔹 Example

```
const Joi=require("joi");

const schema=Joi.object({
    name:Joi.string().min(3).required(),
    age:Joi.number().min(18)
});
```

---

### 🔹 Validation Usage

```
const { error }=schema.validate(req.body);

if (error) {
throw new Error(error.details[0].message);
}
```
