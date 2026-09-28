---
title: Cookies and Sessions
description: Cookies, signed cookies, stateless vs stateful HTTP, express-session and an MVC auth flow.
author: Vikas Patel
---

## COOKIES (Client-Side Storage)

### 🔹 What are Cookies?

Cookies are **small pieces of data** stored in the **browser (client side)** and sent to the server with every request.

👉 Used to:

- Maintain user state (login, preferences)
- Track users (analytics)
- Store small data

👉 Flow:

1. Server sends cookie → `Set-Cookie`
1. Browser stores it
1. Browser sends it back in every request → `Cookie`

---

### 🔹 Example

```
res.cookie("username","harsh");
```

Browser stores:

```
username=harsh
```

---

### 🔹 Types of Cookies

#### 1. Session Cookies

- Temporary
- Deleted when browser closes

#### 2. Persistent Cookies

- Stored for longer time

```
res.cookie("user","harsh", { maxAge:60000 });
```

#### 3. Secure Cookies

- Sent only over HTTPS

#### 4. HttpOnly Cookies

- Not accessible via JavaScript (prevents XSS)

---

### 🔹 What is Stateless vs Stateful?

#### Stateless (HTTP)

- Each request is independent
- Server does NOT remember previous requests

👉 Example:

- Visiting a website → server doesn’t know you visited before

#### Stateful

- Server remembers user data across requests

👉 Cookies help make HTTP **stateful**

---

To read cookies in Express:

```
npm install cookie-parser
```

```js
const cookieParser=require("cookie-parser");
app.use(cookieParser());
```

---

### 🔹 Access Cookies

```
req.cookies
```

Example:

```
app.get("/", (req,res) => {
console.log(req.cookies);
});
```

---

### Cookies can be Tampered

- Stored on client → user can modify
- Not secure for sensitive data

❌ Never store:

- Passwords
- Bank details
- JWT secrets

---

### Signed Cookies (Solution)

Used to detect tampering

```
app.use(cookieParser("secretkey"));
```

Set cookie:

```
res.cookie("name","harsh", { signed:true });
```

Access:

```
req.signedCookies
```

👉 If modified → cookie becomes invalid

---

### Limitations of Cookies

- Size limit (~4KB)
- Sent with every request → increases traffic
- Not secure (client-side)
- Can be disabled by user

---

### Important Note (Write in Notes)

👉 **Never store critical/sensitive data in cookies**

**MVC = Model + View + Controller**

```
                 Client / Browser
                       ↓
                    Routes
                       ↓
                  Controller
                  ↙       ↘
              Model       View
                ↓           ↓
             Database     Response
```

#### Express project structure

```
backend/
│
├── app.js
│
├── routes/
│   └── user.routes.js
│
├── controllers/
│   └── user.controller.js
│
├── middleware/
│   └── auth.middleware.js
│
├── models/
│   └── user.model.js
│
└── views/
    └── dashboard.ejs
```

#### 1. `app.js`

Yahan application setup hota hai.

```js
const express = require("express");
const cookieParser = require("cookie-parser");

const userRoutes = require("./routes/user.routes");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser("secretkey"));

app.use("/", userRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
```

#### 2. `routes/user.routes.js`

Routes decide karti hain ki **kaunsa controller execute hoga**.

```js
const express = require("express");
const router = express.Router();

const {
    login,
    dashboard
} = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.get("/login", login);

router.get(
    "/dashboard",
    authMiddleware,
    dashboard
);

module.exports = router;
```

#### 3. `controllers/user.controller.js`

Controller mein actual request/response logic hota hai.

```js
const login = (req, res) => {

    res.cookie("name", "harsh", {
        signed: true
    });

    res.send("Login successful");
};

const dashboard = (req, res) => {

    const name = req.signedCookies.name;

    res.send(`Welcome ${name}`);
};

module.exports = {
    login,
    dashboard
};
```

#### 4. `middleware/auth.middleware.js`

Protected routes ka authentication:

```js
const authMiddleware = (req, res, next) => {

    const name = req.signedCookies.name;

    if (!name) {
        return res.status(401).send("Please login first");
    }

    next();
};

module.exports = authMiddleware;
```

#### Request ka complete flow

User:

```
GET /dashboard
```

↓

**Route**

```js
router.get("/dashboard", authMiddleware, dashboard);
```

↓

**Middleware**

```js
authMiddleware
```

↓

Cookie check:

```js
req.signedCookies.name
```

↓

Agar cookie hai:

```js
next()
```

↓

**Controller**

```js
dashboard()
```

↓

Response:

```
Welcome harsh
```

---

#### MVC mein kiski kya responsibility?

| Part | Responsibility |
| --- | --- |
| **Model** | Database/data related logic |
| **View** | UI / HTML / EJS |
| **Controller** | Business/request-response logic |
| **Routes** | URL ko controller se connect karna |
| **Middleware** | Authentication, validation, logging etc. |
| **app.js** | Application configuration |

**Important:** Express mein `Routes` aur `Middleware` technically MVC ke 3 core components (Model, View, Controller) ka part nahi hain, but real-world Express projects mein inhe MVC structure ke saath separately organize kiya jata hai.

---

## SESSIONS (Server-Side Storage)

### What is Session?

Session stores user data on the **server**, not in browser.

👉 Browser only stores:

```
Session ID
```

---

### How Session Works

1. User logs in
1. Server creates session
1. Server sends session ID as cookie
1. Browser sends session ID in each request
1. Server retrieves user data using that ID

---

### Install Express Session

```
npm install express-session
```

---

### Setup

```
const session=require("express-session");

app.use(session({
    secret:"mysecret",
    resave:false,
    saveUninitialized:true
}));
```

---

### Using Session

```
app.get("/", (req,res) => {
req.session.username="harsh";
res.send("Session set");
});
```

```
app.get("/get", (req,res) => {
res.send(req.session.username);
});
```

---

### Session ID

- Unique ID for each user
- Stored in cookies
- Used to fetch data from server

---

### 

---

## Cookies vs Sessions (Important Table)

| Feature | Cookies | Sessions |
| --- | --- | --- |
| Storage | Client (browser) | Server |
| Security | Low | High |
| Size | Small (~4KB) | Large |
| Speed | Faster | Slightly slower |
| Data Storage | Direct | Via session ID |
