---
title: Node.js and Express Basics
description: Node.js, npm, modules, the fs and http modules, Express routes, request data, static files and CRUD.
author: Vikas Patel
---

## 1. What is Node.js?

Node.js is a **JavaScript Runtime Environment** that allows us to run JavaScript outside the browser.

Before Node.js:

- JavaScript worked only in browsers.

After Node.js:

- JavaScript can run on servers.
- We can build APIs, websites, chat apps, real-time apps, etc.

#### Example

```bash
node app.js
```

Node executes JavaScript code on your machine.

---

## 2. Why Use Node.js?

#### Advantages

✅ Fast (uses V8 Engine)

✅ Non-blocking I/O

✅ Event Driven

✅ Same Language (JavaScript) for Frontend & Backend

✅ Large npm ecosystem

---

## 3. Installing Node.js

Download from:

[Node.js Official Website](https://nodejs.org/?utm_source=chatgpt.com)

Verify installation:

```bash
node -v
npm -v
```

---

## 4. What is npm?

npm = Node Package Manager

Used to install libraries/packages.

#### Initialize Project

```bash
npm init -y
```

Creates:

```
package.json
```

---

## 5. Installing Packages

#### Install Express

```bash
npm install express
```

#### Install Nodemon

```bash
npm install -D nodemon
```

Run server:

```bash
nodemon app.js
```

---

## 6. First Node.js Program

```js
console.log("Hello Node.js");
```

Run:

```bash
node app.js
```

---

## 7. Modules in Node.js

Node.js uses modules to organize code.

#### Built-in Modules

- fs
- path
- http
- os

#### Import Module

```js
const fs = require("fs");
```

---

## 8. File System (fs Module)

#### Write File

```js
const fs = require("fs");

fs.writeFileSync("data.txt", "Hello World");
```

---

#### Read File

```js
const data = fs.readFileSync("data.txt", "utf8");

console.log(data);
```

---

#### Append Data

```js
fs.appendFileSync(
    "data.txt",
    "\nNew Line Added"
);
```

---

#### Delete File

```js
fs.unlinkSync("data.txt");
```

---

## 9. Creating a Basic HTTP Server

```js
const http = require("http");

const server = http.createServer((req, res) => {
    res.end("Hello World");
});

server.listen(3000, () => {
    console.log("Server Running");
});
```

Visit:

```
http://localhost:3000
```

---

## 10. What is Express.js?

Express.js is a Node.js framework.

It makes server creation easier.

Without Express:

```js
http.createServer(...)
```

With Express:

```js
app.get(...)
```

Less code and more features.

---

## 11. Installing Express

```bash
npm install express
```

---

## 12. First Express Server

```js
const express = require("express");

const app = express();

app.listen(3000, () => {
    console.log("Server Running");
});
```

---

## 13. Routes

Routes decide what response should be sent.

---

### GET Route

```js
app.get("/", (req, res) => {
    res.send("Home Page");
});
```

---

### About Route

```js
app.get("/about", (req, res) => {
    res.send("About Page");
});
```

---

## 14. Response Methods

#### Send Text

```js
res.send("Hello");
```

#### Send JSON

```js
res.json({
    name: "Vikas",
    role: "Trainer"
});
```

#### Send File

```js
res.sendFile(__dirname + "/index.html");
```

#### Redirect

```js
res.redirect("/dashboard");
```

---

## 15. Middleware

Middleware runs before route handlers.

```js
app.use((req, res, next) => {
    console.log("Middleware Running");
    next();
});
```

#### Flow

```
Request
   ↓
Middleware
   ↓
Route Handler
   ↓
Response
```

---

## 16. Parsing Request Data

### JSON Data

```js
app.use(express.json());
```

---

### Form Data

```js
app.use(express.urlencoded({
    extended: true
}));
```

---

## 17. req Object

Request information comes in `req`.

---

### req.body

```js
app.post("/register", (req, res) => {
    console.log(req.body);
});
```

Output:

```js
{
    name: "Vikas",
    email: "abc@gmail.com"
}
```

---

### req.params

URL Parameters

```js
app.get("/user/:id", (req, res) => {
    console.log(req.params);
});
```

URL:

```
/user/101
```

Output:

```js
{
    id: "101"
}
```

---

### req.query

Query Parameters

```js
app.get("/search", (req, res) => {
    console.log(req.query);
});
```

URL:

```
/search?name=vikas&city=ghaziabad
```

Output:

```js
{
    name: "vikas",
    city: "ghaziabad"
}
```

---

## 18. Serving Static Files

Project Structure

```
project
│
├── public
│   ├── style.css
│   └── script.js
│
└── app.js
```

Server:

```js
app.use(express.static("public"));
```

Now:

```
localhost:3000/style.css
```

---

## 19. EJS Template Engine

Install:

```bash
npm install ejs
```

---

Set View Engine

```js
app.set("view engine", "ejs");
```

---

Render Page

```js
app.get("/", (req, res) => {
    res.render("home");
});
```

---

Pass Data

```js
app.get("/", (req, res) => {
    res.render("home", {
        name: "Vikas"
    });
});
```

EJS File

```html
<h1><%= name %></h1>
```

---

## 20. POST Request Example

Form

```html
<form action="/register" method="POST">
    <input type="text" name="name">
    <button>Submit</button>
</form>
```

Server

```js
app.post("/register", (req, res) => {
    console.log(req.body);

    res.send("Registered");
});
```

---

## 21. CRUD Operations

#### Create

```js
app.post("/users")
```

#### Read

```js
app.get("/users")
```

#### Update

```js
app.put("/users/:id")
```

#### Delete

```js
app.delete("/users/:id")
```

---

## 22. Error Handling Middleware

```js
app.use((err, req, res, next) => {
    console.log(err);

    res.status(500).send(
        "Something Went Wrong"
    );
});
```

---

## 23. 404 Route

Always keep it at the end.

```js
app.use((req, res) => {
    res.status(404).send(
        "Page Not Found"
    );
});
```

---

## 24. Typical Express Project Structure

```
project
│
├── node_modules
├── public
│
├── views
│   ├── home.ejs
│   ├── login.ejs
│
├── routes
│
├── controllers
│
├── models
│
├── package.json
├── app.js
```

---

## 25. Request-Response Lifecycle

```
Browser
   │
   ▼
Request
   │
   ▼
Express Server
   │
   ▼
Middleware
   │
   ▼
Route
   │
   ▼
Controller
   │
   ▼
Response
   │
   ▼
Browser
```

---

## 🎯 Beginner Learning Order

#### Node.js

1. Introduction
1. npm
1. Modules
1. fs Module
1. HTTP Module
1. Event Loop
1. Async Programming

#### Express.js

1. Express Setup
1. Routes
1. Middleware
1. req.body
1. req.params
1. req.query
1. Static Files
1. EJS
1. CRUD
1. Error Handling
1. Authentication
1. MongoDB Integration
