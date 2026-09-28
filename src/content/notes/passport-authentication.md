---
title: Passport.js Authentication
description: Session-based login with Passport, passport-local and passport-local-mongoose, step by step.
author: Vikas Patel
---

## 1. Install Packages

Run this command:

```
npm install passport passport-local passport-local-mongoose express-session
```

---

## 2. Create User Model

Create:

```
models/user.js
```

```
const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=new mongoose.Schema({
    email: {
        type:String,
        required:true,
    }
});

// plugin
userSchema.plugin(passportLocalMongoose.default);

module.exports=mongoose.model("User",userSchema);
```

---

## 3. Configure Session Middleware

In your main file (`app.js` or `index.js`):

```
const session=require("express-session");

app.use(session({
    secret:"mysupersecretkey",
    resave:false,
    saveUninitialized:true,
}));
```

---

## 4. Initialize Passport

Import passport:

```
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user");
```

Now add passport middleware:

```
app.use(passport.initialize());
app.use(passport.session());
```

---

## 5. Configure Passport Strategy

Add this below passport middleware:

```
passport.use(new LocalStrategy(User.authenticate()));
```

---

## 6. Serialize & Deserialize User

Add this also:

```
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
```

---

## 7. Create Signup Route

### GET Signup Page

```
app.get("/signup", (req,res) => {
res.render("signup.ejs");
});
```

---

### POST Signup

```
app.post("/signup",async (req,res) => {

try {

let { username, email, password }=req.body;

const newUser=new User({
            email,
            username
        });

const registeredUser=await User.register(newUser,password);

console.log(registeredUser);

res.redirect("/login");

    }catch (err) {
console.log(err);
res.send(err);
    }
});
```

---

## 8. Create Login Route

### GET Login

```
app.get("/login", (req,res) => {
res.render("login.ejs");
});
```

---

### POST Login

```
app.post("/login",
passport.authenticate("local", {
        failureRedirect:"/login",
    }),

async (req,res) => {

res.redirect("/");
    }
);
```

---

## 9. Logout Route

```
app.get("/logout", (req,res,next) => {

req.logout(function(err) {
if(err) {
return next(err);
        }

res.redirect("/");
    });

});
```

---

## 10. Access Logged-in User

Now you can access:

```
req.user
```

ONLY if user is logged in.

Example:

```
app.get("/profile", (req,res) => {

console.log(req.user);

res.send(req.user);
});
```

---

## 11. Make User Available in All EJS Files

Add middleware:

```
app.use((req,res,next) => {
res.locals.currentUser=req.user;
next();
});
```

Now inside EJS:

```
<%= currentUser.username %>
```

---

## 12. Create isLoggedIn Middleware

```
const isLoggedIn= (req,res,next) => {

if(!req.isAuthenticated()) {
return res.redirect("/login");
    }

next();
};
```

Use it:

```
app.get("/secret",isLoggedIn, (req,res) => {
res.send("Welcome");
});
```

---

## 13. Important Folder Structure

```
project/
│
├── models/
│   └── user.js
│
├── views/
│   ├── signup.ejs
│   └── login.ejs
│
├── app.js
```

---

## 14. Very Important Order of Middleware

This order matters:

```
app.use(session({...}));

app.use(passport.initialize());

app.use(passport.session());
```

If order is wrong → `req.user` will be undefined.

---

## 15. Simple Signup Form

```
<form action="/signup" method="POST">

<input type="text" name="username" placeholder="username">

<input type="email" name="email" placeholder="email">

<input type="password" name="password" placeholder="password">

<button>Signup</button>

</form>
```

---

## 16. Simple Login Form

```
<form action="/login" method="POST">

<input type="text" name="username">

<input type="password" name="password">

<button>Login</button>

</form>
```

---

## How Everything Works Internally

### Signup

```
User enters password
        ↓
passport-local-mongoose hashes password
        ↓
stores hashed password in DB
```

---

### Login

```
User enters password
        ↓
passport compares hashed password
        ↓
creates session
        ↓
stores user in req.user
```

---

## What passport-local-mongoose Automatically Gives You

You DON'T need to manually write:

- bcrypt hashing
- salt generation
- compare password
- authenticate logic

Because plugin already provides:

```
User.register()
User.authenticate()
User.serializeUser()
User.deserializeUser()
```

---

## Common Mistakes

### 1. `req.user` undefined

Cause:

- forgot `passport.session()`
- wrong middleware order
- session not configured

---

### 2. `Failed to serialize user`

Cause:

Forgot:

```
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
```

---

### 3. Login always fails

Cause:

Wrong field names.

By default passport expects:

```
username
password
```

---

## Recommended Final Stack

Use:

- Express
- MongoDB
- Mongoose
- Passport
- Passport Local
- Passport Local Mongoose
- Express Session
- Connect Flash

This is the standard authentication setup for many Express apps.
