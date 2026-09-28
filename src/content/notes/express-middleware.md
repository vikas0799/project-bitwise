---
title: Express Middleware
description: How middleware works, next(), built-in and third-party middleware, body parsing and error handling.
author: Vikas Patel
---

## Interview Question

**Q:** **`req.body` undefined kyu aata hai?**

**Ans:** Body parsing middleware nahi lagaya gaya.

```
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
```

Ye lagane ke baad Express request body ko parse karke `req.body` me available kar deta hai.

Client
↓
Raw Package (Request Body)
↓
Body Parser Middleware
↓
Opened Package (req.body)
↓
Route Handler

| Content-Type | Middleware |
| --- | --- |
| application/json | `express.json()` |
| application/x-www-form-urlencoded | `express.urlencoded()` |
| text/plain | `express.text()` |
| application/octet-stream | `express.raw()` |
| multipart/form-data | `multer()` |

```js
const express = require('express');
const app = express();
const port = 3000;
const data=require("./data.json");   //json aur js file ko express direcly read kar sakta h , txt ko nahi 

console.log(data);

app.get('/', (req, res) => {
  res.send(data);  

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
```

network par data hamesha bytes/string ke form me transmit hota hai; JSON object ko bhejne se pehle `JSON.stringify()` karke string banaya jata hai aur receive karne par `JSON.parse()` se object me convert kiya jata hai
express handle everything internally

res.send(object);   // Express stringify karega
res.json(object);   // Express stringify karega (recommended for APIs)
res.send(string);   // String as-is send hogi

data.js → module ki tarah export karna parega

data.json → direct require

data.txt → fs module se read karna parega phir parsing karke json me converrt karna parega etc..

## Express.js Middleware

### What is Middleware?

Middleware is a function that executes **between the request and the response cycle**.

When a client sends a request:

```
Client Request
      ↓
 Middleware
      ↓
 Route Handler
      ↓
 Client Response
```

Middleware can:

- Execute code
- Modify `req` and `res`
- End the request-response cycle
- Call the next middleware

---

### Syntax

```js
app.use((req, res, next) => {
    console.log("Middleware executed");
    next();
});
```

#### Parameters

| Parameter | Purpose |
| --- | --- |
| req | Request object |
| res | Response object |
| next | Passes control to next middleware |

---

### Why `next()` is Important?

Without `next()`, the request gets stuck.

#### Wrong

```js
app.use((req, res, next) => {
    console.log("Middleware");
});
```

Browser keeps loading because control never reaches the route.

#### Correct

```js
app.use((req, res, next) => {
    console.log("Middleware");
    next();
});
```

---

### Global Middleware

Runs for every request.

```js
app.use((req, res, next) => {
    console.log("Request received");
    next();
});
```

#### Output

Request to:

```
/
/about
/contact
```

Middleware executes for all routes.

---

### Route Specific Middleware

Runs only for a specific route.

```js
function auth(req, res, next) {
    console.log("Authentication Check");
    next();
}

app.get("/profile", auth, (req, res) => {
    res.send("Profile Page");
});
```

Only `/profile` will use the middleware.

---

### Multiple Middleware

```js
app.use((req, res, next) => {
    console.log("Middleware 1");
    next();
});

app.use((req, res, next) => {
    console.log("Middleware 2");
    next();
});

app.get("/", (req, res) => {
    res.send("Home");
});
```

#### Output

```
Middleware 1
Middleware 2
Home
```

---

### Middleware Execution Order

Express executes middleware in the order they are written.

```js
app.use((req, res, next) => {
    console.log("1");
    next();
});

app.use((req, res, next) => {
    console.log("2");
    next();
});

app.use((req, res, next) => {
    console.log("3");
    next();
});
```

#### Output

```
1
2
3
```

---

### Built-in Middleware

#### 1. express.json()

Converts JSON data into JavaScript object.

```js
app.use(express.json());
```

#### Request

```json
{
   "name":"Vikas"
}
```

#### Access

```js
console.log(req.body.name);
```

---

#### 2. express.urlencoded()

Handles form data.

```js
app.use(express.urlencoded({ extended: true }));
```

#### HTML Form

```html
<form method="POST">
  <input name="name">
</form>
```

#### Access

```js
console.log(req.body.name);
```

---

#### 3. express.static()

Serves static files.

```js
app.use(express.static("public"));
```

Folder Structure:

```
project
│
├── public
│   ├── style.css
│   └── app.js
```

Browser:

```
http://localhost:3000/style.css
```

---

### Custom Middleware

```js
function logger(req, res, next) {
    console.log(`${req.method} ${req.url}`);
    next();
}

app.use(logger);
```

#### Output

```
GET /
POST /login
GET /about
```

---

### Authentication Middleware Example

```js
function auth(req, res, next) {
    let isLoggedIn = true;

    if (isLoggedIn) {
        next();
    } else {
        res.send("Login First");
    }
}

app.get("/dashboard", auth, (req, res) => {
    res.send("Dashboard");
});
```

---

### Middleware Can Modify Request

```js
app.use((req, res, next) => {
    req.user = {
        name: "Vikas",
        role: "Admin"
    };

    next();
});

app.get("/", (req, res) => {
    res.send(req.user.name);
});
```

Output:

```
Vikas
```

---

### Middleware Can End Response

```js
app.use((req, res, next) => {
    res.send("Request Stopped");
});
```

Since response is already sent, next middleware or route won't execute.

---

### Error Handling Middleware

Special middleware with 4 parameters.

```js
app.use((err, req, res, next) => {
    console.log(err.message);

    res.status(500).send("Something went wrong");
});
```

#### Example

```js
app.get("/", (req, res) => {
    throw new Error("Server Error");
});
```

---

### Third Party Middleware

Popular middleware packages:

| Middleware | Purpose |
| --- | --- |
| morgan | Logging |
| cors | Cross-Origin Requests |
| helmet | Security |
| cookie-parser | Read Cookies |
| multer | File Upload |

#### Example

```bash
npm install morgan
```

```js
const morgan = require("morgan");

app.use(morgan("dev"));
```

---

### Real Project Flow

```js
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(authMiddleware);

app.get("/", (req, res) => {
    res.send("Home");
});
```

Execution:

```
Request
   ↓
Morgan
   ↓
JSON Parser
   ↓
URL Encoded Parser
   ↓
CORS
   ↓
Auth Middleware
   ↓
Route Handler
   ↓
Response
```

---

## Interview Questions

#### Q1. What is Middleware?

A function that executes between request and response and has access to `req`, `res`, and `next`.

---

#### Q2. Why is `next()` used?

To transfer control to the next middleware or route handler.

---

#### Q3. Difference between `app.use()` and `app.get()`?

| app.use() | app.get() |
| --- | --- |
| Works for all HTTP methods | Only GET requests |
| Mostly used for middleware | Used for route handling |

---

#### Q4. Can middleware modify request object?

Yes.

```js
req.user = { name: "Vikas" };
```

---

#### Q5. What happens if `next()` is not called?

The request-response cycle stops and the client may keep waiting.

---

#### One-Line Definition

**Middleware is a function that runs before the final route handler, can process the request/response, and decides whether to pass control using** **`next()` .**
