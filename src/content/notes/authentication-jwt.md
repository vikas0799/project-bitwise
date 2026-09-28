---
title: Authentication, Hashing and JWT
description: Authentication vs authorization, hashing, salts, bcrypt and JWT-based auth with middleware.
author: Vikas Patel
---

## Authentication & Authorization

### 1. Authentication (AuthN)

👉 **Definition:**

Authentication is the process of **verifying the identity of a user**.

📌 In simple terms:

> "Are you really who you claim to be?"

#### Examples:

- Login with username & password
- OTP verification
- Biometric (fingerprint, face ID)

---

### 2. Authorization (AuthZ)

👉 **Definition:**

Authorization is the process of **deciding what a user is allowed to do**.

📌 In simple terms:

> "What are you allowed to access?"

#### Examples:

- Admin can delete users → ✔️ allowed
- Normal user tries to delete users → ❌ denied

---

### 🔁 Difference Between Authentication & Authorization

| Feature | Authentication | Authorization |
| --- | --- | --- |
| Purpose | Verify identity | Grant permissions |
| Happens | First | After authentication |
| Example | Login | Access dashboard |

---

## 🔑 Hashing (Very Important for Passwords)

### What is Hashing?

👉 Hashing is the process of converting data (like a password) into a **fixed-length string** using a **hash function**.

📌 Example:

```
Password: harsh123
Hash:     5f4dcc3b5aa765d61d8327deb882cf99
```

👉 We **never store actual passwords**, only hashes.

---

### ⚙️ How Hashing Works

1. User enters password
1. System converts it into a hash
1. Stored hash is compared with generated hash
1. If match → login successful

---

## ⭐ Important Properties of Hash Functions

### 1. One-Way Function

👉 Cannot convert hash back to original input

```
password → hash  ✅
hash → password  ❌ (impossible)
```

---

### 2. Avalanche Effect

👉 Small change in input → huge change in output

```
hello123 → Xyz@123
hello124 → Abc#789  (completely different)
```

---

### 3. Deterministic

👉 Same input → same output always

```
hash("harsh") = ABC123
hash("harsh") = ABC123  (always same)
```

---

### 4. Deliberately Slow (for Password Hashing)

👉 Hashing should be **slow** to prevent brute force attacks

📌 Why?

- Attackers try millions of passwords per second

---

- Slow hashing → fewer attempts → more secure

## 🧂 Salt (Very Important Concept)

### What is Salt?

👉 Salt is a **random value added to a password before hashing**

```
password + salt → hash
```

---

### Why Do We Use Salt?

#### 🔴 Problem Without Salt:

Same password → same hash

```
user1: 123456 → abc123
user2: 123456 → abc123  ❌ (same hash)
```

👉 Attackers can use **rainbow tables**

---

#### 🟢 With Salt:

```
user1: 123456 + salt1 → hash1
user2: 123456 + salt2 → hash2
```

✔️ Different hashes for same password

✔️ Prevents precomputed attacks

---

### Key Points About Salt

- Unique for each user
- Stored along with hash
- Makes cracking very difficult

---

## 🔒 Bcrypt (Most Important in Real Apps)

### What is Bcrypt?

👉 **bcrypt** is a **password hashing algorithm** designed for security

---

### Why Use Bcrypt?

✔️ Automatically handles salt

✔️ Slow hashing (configurable)

✔️ Resistant to brute-force attacks

---

### ⚙️ How Bcrypt Works

1. Generate salt
1. Combine password + salt
1. Apply hashing multiple rounds

---

### Example (Node.js)

```js
https://bcrypt-generator.com/
https://www.npmjs.com/package/bcrypt
```

```
const bcrypt=require("bcrypt");

// Hashing password
const password="harsh123";
const hashedPassword=await bcrypt.hash(password,10);

// Comparing password
const isMatch=await bcrypt.compare("harsh123",hashedPassword);
```

---

### 🔁 What is "10" in bcrypt?

👉 It is **salt rounds (cost factor)**

- Higher value → more secure
- Higher value → slower

📌 Recommended: `10–12`

---

## 🚨 Important Security Notes

- ❌ Never store plain passwords
- ❌ Never store sensitive data in cookies
- ✔️ Always hash passwords
- ✔️ Always use salt (bcrypt does it automatically)
- ✔️ Use HTTPS to protect data in transit

#### JWT kya hai?

**JWT (JSON Web Token)** ek token-based authentication mechanism hai. Login ke baad server ek token deta hai, aur client har protected request ke saath token bhejta hai.

#### JWT Structure

```
xxxxx.yyyyy.zzzzz
  │      │     │
Header Payload Signature
```

- **Header** → token type + algorithm
- **Payload** → user ki information
- **Signature** → token ko verify karta hai

---

### 1. Install

```bash
npm install jsonwebtoken
```

---

### 2. JWT Create

Login ke baad:

```js
const jwt = require("jsonwebtoken");

const token = jwt.sign(
    {
        userId: user._id,
        role: user.role
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1d"
    }
);

res.json({
    message: "Login successful",
    token
});
```

`.env`

```
JWT_SECRET=mysecretkey
```

---

### 3. JWT Send from Client

Frontend request:

```js
fetch("/api/cart", {
    headers: {
        Authorization: `Bearer ${token}`
    }
});
```

Header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

### 4. Auth Middleware

`middleware/auth.js`

```js
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token required"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }
};

module.exports = auth;
```

---

### 5. Protected Route

```js
const auth = require("./middleware/auth");

app.get("/cart", auth, (req, res) => {

    console.log(req.user);

    res.json({
        message: "Welcome to cart",
        userId: req.user.userId
    });
});
```

#### Complete Flow

```
Login
  ↓
Email + Password
  ↓
Server verifies user
  ↓
JWT Generate
  ↓
Client gets Token
  ↓
Client sends:
Authorization: Bearer TOKEN
  ↓
auth.js
  ↓
jwt.verify()
  ↓
Valid?
 ├── ❌ 401 Unauthorized
 └── ✅ req.user
          ↓
       next()
          ↓
    Protected Route
```

#### Important Methods

```js
jwt.sign()    // JWT create
jwt.verify()  // JWT verify
jwt.decode()  // Payload read (signature verify nahi karta)
```

**Remember:** JWT me password jaise sensitive data payload me nahi rakhna chahiye. JWT **encrypted nahi hota**, normally just encoded + signed hota hai.
