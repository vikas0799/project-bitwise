---
title: EJS Templating
description: Rendering dynamic HTML with EJS: tags, loops, forms, render vs redirect.
author: Vikas Patel
---

### 1. What is EJS?

EJS (Embedded JavaScript) is a templating engine used with Node.js and Express to generate dynamic HTML pages. It allows you to embed JavaScript logic directly inside HTML.

You can:

- Inject backend data into HTML
- Use loops and conditions
- Render dynamic content

---

## 2. Express Setup for EJS

### app.set('view engine', 'ejs')

```
app.set('view engine','ejs');
```

#### Explanation:

- This tells Express to use EJS as the templating engine.
- After setting this, you don’t need to specify the `.ejs` extension in `res.render()`.

Example:

```
res.render('home');
```

This will automatically render `home.ejs`.

---

### app.set('views', path)

```
app.set('views','./views');
```

#### Explanation:

- This defines the directory where your EJS templates are stored.

Default behavior:

- Express looks for a folder named `views`.

Custom path example:

```
app.set('views','./templates');
```

---

### Difference between `view engine` and `views`

| Feature | view engine | views |
| --- | --- | --- |
| Purpose | Sets the template engine | Sets the directory path |
| Example | 'ejs' | './views' |
| Required | Yes (for EJS usage) | No (default exists) |
|  |  |  |
|  |  |  |

---

## 3. res.render()

```
res.render('home', { name:"Harsh" });
```

#### Explanation:

- Renders an EJS file
- Passes data (object) to the template

Example in `home.ejs`:

```
<h1>Hello <%= name %></h1>
```

Output:

```
Hello Harsh
```

---

## 4. EJS Templating Tags

These tags are the core of EJS.

---

### 1. `<% %>` Scriptlet Tag (No Output)

Used for control flow like conditions and loops.

```
<% if (user) { %>
    <h1>User exists</h1>
<% } %>
```

- Executes JavaScript
- Does not directly output anything

---

### 2. `<%_` Whitespace Slurping (Before)

Removes whitespace before the tag.

```
<%_ if (true) { %>
    Hello
<% } %>
```

Used to keep output HTML clean.

---

### 3. `<%= %>` Escaped Output

Outputs value safely (HTML escaped).

```
<h1><%= name %></h1>
```

If input is:

```
"<script>alert(1)</script>"
```

It will render as plain text, not executable code.

---

### 4. `<%- %>` Unescaped Output

Outputs raw HTML.

```
<%- "<h1>Hello</h1>" %>
```

Output:

```
<h1>Hello</h1>
```

Warning:

- This can lead to XSS attacks
- Use only with trusted data

---

### 5. `<%# %>` Comment Tag

```
<%# This is a comment %>
```

- Not executed
- Not visible in output

---

### 6. `<%%` Literal `<%`

```
<%%= name %>
```

Output:

```
<%= name %>
```

Used when you want to display EJS syntax itself.

---

### 7. `%>` Closing Tag

Used to close EJS tags.

---

### 8. `%>` Trim Newline

Removes newline after the tag.

```
<% if (true) { -%>
Hello
<% } %>
```

Prevents extra blank lines.

---

### 9. `_%>` Remove Whitespace After

Removes all whitespace after the tag.

```
<%_ if (true) { _%>
Hello
<% } %>
```

---

## 5. Practical Example

### Route

```
app.get('/', (req,res) => {
const users= ["Harsh","Aman","Ravi"];
res.render('index', { users });
});
```

---

### index.ejs

```
<h1>User List</h1>

<ul>
    <% users.forEach(user => { %>
        <li><%= user %></li>
    <% }) %>
</ul>
```

---

## 6. When to Use Which Tag

| Tag | Use |
| --- | --- |
| `<% %>` | Logic (if, loops) |
| `<%= %>` | Safe output |
| `<%- %>` | Raw HTML |
| `<%# %>` | Comments |
| `<%%` | Print EJS syntax |

---

## 7. Common Mistakes

- Forgetting to set `view engine`
- Wrong folder name for views
- Using `<%- %>` with user input (security issue)
- Missing `%>` closing tag
- 

/practice

### Project Structure

```
project/
│
├── views/
│   ├── home.ejs
│   ├── register.ejs
│   ├── login.ejs
│   └── dashboard.ejs
│
├── public/
│   └── style.css
│
├── app.js
└── package.json
```

---

### app.js

```js
const express = require("express");
const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home Page
app.get("/", (req, res) => {
    res.render("home");
});

// Register Page
app.get("/register", (req, res) => {
    res.render("register");
});

// Login Page
app.get("/login", (req, res) => {
    res.render("login");
});

// Register Form Submit
app.post("/register", (req, res) => {

    console.log(req.body);

    const { name, email } = req.body;

    res.render("dashboard", {
        user: {
            name,
            email
        }
    });
});

// Login Form Submit
app.post("/login", (req, res) => {

    console.log(req.body);

    const { email } = req.body;

    res.render("dashboard", {
        user: {
            name: "Existing User",
            email
        }
    });
});

// req.query Example
app.get("/search", (req, res) => {

    console.log(req.query);

    res.send(`Searching for: ${req.query.keyword}`);
});

// req.params Example
app.get("/user/:id", (req, res) => {

    console.log(req.params);

    res.send(`User ID = ${req.params.id}`);
});

app.listen(3000, () => {
    console.log("Server Running...");
});
```

---

### home.ejs

```html
<!DOCTYPE html>
<html>
<head>
    <title>Home</title>
</head>
<body>

    <h1>Welcome</h1>

    <a href="/register">
        <button>Register</button>
    </a>

    <a href="/login">
        <button>Login</button>
    </a>

</body>
</html>
```

---

### register.ejs

```html
<!DOCTYPE html>
<html>
<head>
    <title>Register</title>
</head>
<body>

<h1>Register</h1>

<form action="/register" method="POST">

    <input
        type="text"
        name="name"
        placeholder="Enter Name"
    >

    <br><br>

    <input
        type="email"
        name="email"
        placeholder="Enter Email"
    >

    <br><br>

    <button type="submit">
        Register
    </button>

</form>

</body>
</html>
```

---

### login.ejs

```html
<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
</head>
<body>

<h1>Login</h1>

<form action="/login" method="POST">

    <input
        type="email"
        name="email"
        placeholder="Enter Email"
    >

    <br><br>

    <input
        type="password"
        name="password"
        placeholder="Enter Password"
    >

    <br><br>

    <button type="submit">
        Login
    </button>

</form>

</body>
</html>
```

---

### dashboard.ejs

```html
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard</title>
</head>
<body>

<h1>Dashboard</h1>

<h2>Name: <%= user.name %></h2>

<h2>Email: <%= user.email %></h2>

</body>
</html>
```

---

## req.query Demo

Browser me:

```
http://localhost:3000/search?keyword=react
```

Output:

```
Searching for: react
```

Console:

```js
{ keyword: 'react' }
```

---

## req.params Demo

Browser me:

```
http://localhost:3000/user/101
```

Output:

```
User ID = 101
```

Console:

```js
{ id: '101' }
```

---

#### Teaching Flow

1. Home Page (`/`)
1. Register Page (`/register`)
1. Login Page (`/login`)
1. Form Submit (`req.body`)
1. Dashboard Render (`res.render`)
1. Search Feature (`req.query`)
1. User Profile Route (`req.params`)

Iske baad next level project me **JSON file me users save karna, login validate karna aur dashboard me user details dikhana** kara sakte ho. Isse `req.body`, `req.query`, `req.params`, EJS aur file handling ek hi project me cover ho jayenge.

#### `res.redirect()` Example

Redirect ka matlab hai ki server browser ko kisi dusre route par bhej deta hai.

---

### Example 1: Login ke baad Dashboard par Redirect

#### app.js

```js
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {

    const { email } = req.body;

    // Dashboard route par redirect
    res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});

app.listen(3000);
```

---

### Example 2: Query ke saath Redirect

```js
app.post("/login", (req, res) => {

    const { email } = req.body;

    res.redirect(`/dashboard?email=${email}`);
});
```

```js
app.get("/dashboard", (req, res) => {

    const email = req.query.email;

    res.render("dashboard", { email });
});
```

#### dashboard.ejs

```html
<h1>Welcome</h1>
<h2><%= email %></h2>
```

URL:

```
http://localhost:3000/dashboard?email=test@gmail.com
```

---

### Example 3: req.params ke saath Redirect

```js
app.post("/login", (req, res) => {

    const userId = 101;

    res.redirect(`/user/${userId}`);
});
```

```js
app.get("/user/:id", (req, res) => {

    res.send(`User ID = ${req.params.id}`);
});
```

Output:

```
User ID = 101
```

---

### `render()` vs `redirect()`

#### render

```js
res.render("dashboard");
```

- Directly `dashboard.ejs` open karega.
- URL change nahi hogi.

Maan lo URL hai:

```
/login
```

To render ke baad bhi browser me:

```
/login
```

dikhega.

---

#### redirect

```js
res.redirect("/dashboard");
```

- Browser ko nayi request bhejne ko bolega.
- URL change ho jayegi.

Browser me:

```
/dashboard
```

dikhega.

---

#### Real-world Flow

```js
app.post("/register", (req, res) => {

    // User save ho gaya

    res.redirect("/login");
});

app.post("/login", (req, res) => {

    // Login successful

    res.redirect("/dashboard");
});
```

Yehi pattern production applications me bahut use hota hai.
