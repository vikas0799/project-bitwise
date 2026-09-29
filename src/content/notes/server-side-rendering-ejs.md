---
title: "Server-Side Rendering with EJS, and SSR vs CSR"
description: Server-side vs client-side rendering with a timeline diagram, when to use each, hydration and hybrid rendering in Next.js. Then EJS with Express, every EJS tag, loops and conditions, partials and layouts, forms, render vs redirect, the Post/Redirect/Get pattern and XSS-safe output.
author: Vikas Patel
---

**Rendering** means turning your data and templates into the HTML the browser displays. The big question is **where** that happens: on the server, or in the browser. This note compares the two, then builds a server-rendered app with **EJS** and Express.

## SSR vs CSR

![Timelines: SSR sends full HTML so content shows early; CSR sends empty HTML and JavaScript renders the content later](/images/backend/ssr-vs-csr.svg "SSR shows content sooner; CSR needs the JavaScript to download and run first.")

**Server-side rendering (SSR):** the server fetches the data, builds the **complete HTML** and sends it. The browser shows it immediately.

```js
app.get("/", (req, res) => {
  res.render("home", { user: "Asha" }); // server sends <h1>Hello Asha</h1>
});
```

**Client-side rendering (CSR):** the server sends an almost **empty HTML page** plus a JavaScript bundle. The browser downloads and runs the JavaScript, which fetches data from an API and builds the page. A React app made with Vite works this way.

```html
<body>
  <div id="root"></div>              <!-- empty until JavaScript runs -->
  <script type="module" src="/assets/app.js"></script>
</body>
```

| | SSR | CSR |
| --- | --- | --- |
| where HTML is built | server | browser |
| first content visible | **fast** | slower: waits for JS download and API calls |
| SEO and link previews | **great**: the HTML has the content | weaker: crawlers must run the JavaScript |
| navigation between pages | full page load (unless hybrid) | **instant, app-like** |
| server load | higher: renders on every request | lower: serves static files plus an API |
| works without JavaScript | yes | no |
| examples | EJS, Django, Rails, Next.js | React + Vite SPA, Angular |

**Use SSR** for content that must load fast and rank on search: blogs, news, landing pages, product pages. **Use CSR** for app-like tools behind a login: dashboards, admin panels, chat, editors. A simple analogy: SSR is a cooked meal delivered to your table; CSR is a meal kit you cook yourself.

### Hybrid rendering and hydration

Modern frameworks (**Next.js**, Nuxt, SvelteKit, Remix / React Router) mix both:

- The server sends ready HTML for a fast first view (**SSR**), or pre-builds it at deploy time (**SSG**, static site generation).
- Then JavaScript **hydrates** the page: it attaches event listeners to the existing HTML, so from then on the page behaves like a CSR app.
- Next.js adds React Server Components and incremental regeneration, choosing per page or even per component.

## EJS: templates for Express

**EJS** (Embedded JavaScript) is HTML with small JavaScript tags. It's the simplest way to learn SSR, and fine for small server-rendered apps.

```bash
npm install express ejs
```

```js
import express from "express";
import path from "node:path";

const app = express();
app.set("view engine", "ejs");                                // which template engine
app.set("views", path.join(import.meta.dirname, "views"));    // where templates live (default: ./views)
app.use(express.urlencoded({ extended: true }));              // read HTML form posts into req.body
app.use(express.static("public"));                            // CSS, images, client JS

app.get("/", (req, res) => {
  res.render("home", { title: "Bitwise", courses: ["JavaScript", "Node.js", "DSA"] });
});

app.listen(3000);
```

`res.render("home", data)` finds `views/home.ejs`, fills it with `data`, and sends the resulting HTML.

## EJS tags

| Tag | What it does |
| --- | --- |
| `<% code %>` | runs JavaScript (if, loops), outputs nothing |
| `<%= value %>` | outputs the value **HTML-escaped** (safe) |
| `<%- value %>` | outputs **raw** HTML (only for trusted HTML, such as an included partial) |
| `<%# comment %>` | a comment, not sent to the browser |
| `<%%` | prints a literal `<%` |
| `-%>` | trims the newline after the tag |
| `<%_` and `_%>` | strip whitespace before / after the tag |

```html
<!-- views/home.ejs -->
<h1><%= title %></h1>

<% if (courses.length === 0) { %>
  <p>No courses yet.</p>
<% } else { %>
  <ul>
    <% courses.forEach((course) => { %>
      <li><%= course %></li>
    <% }) %>
  </ul>
<% } %>
```

### `<%=` vs `<%-`: the XSS rule

`<%= %>` **escapes** HTML: a user named `<script>alert(1)</script>` shows up as harmless text. `<%- %>` inserts it **as HTML**, and the script would run in every visitor's browser. That's **cross-site scripting (XSS)**. Rule: **always `<%=` for data**, `<%-` only for your own partials.

## Partials and layouts

Put repeated parts (head, navbar, footer) in **partials** and include them:

```html
<!-- views/partials/header.ejs -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title><%= title %></title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <nav><a href="/">Home</a> <a href="/courses">Courses</a></nav>
```

```html
<!-- views/courses.ejs -->
<%- include("partials/header", { title: "Courses" }) %>
<main>…</main>
<%- include("partials/footer") %>
```

EJS has no built-in layouts. The `ejs-mate` package adds them: `app.engine("ejs", ejsMate)`, then each page starts with `<% layout("layouts/boilerplate") %>` and the layout prints the page with `<%- body %>`.

## Forms, render and redirect

A full register → login → dashboard flow:

```js
app.get("/register", (req, res) => res.render("register", { error: null }));

app.post("/register", async (req, res) => {
  const { name, email } = req.body;               // from <input name="name"> and <input name="email">
  if (!name || !email) {
    return res.status(400).render("register", { error: "All fields are required" });
  }
  await saveUser({ name, email });
  res.redirect("/login");                          // Post/Redirect/Get
});

app.get("/profile/:id", async (req, res) => {      // req.params
  const user = await findUser(req.params.id);
  if (!user) return res.status(404).render("404");
  res.render("profile", { user });
});

app.get("/search", (req, res) => {                  // req.query: /search?q=node
  res.render("search", { q: req.query.q ?? "", results: search(req.query.q) });
});
```

```html
<!-- views/register.ejs -->
<form method="POST" action="/register">
  <% if (error) { %><p class="error"><%= error %></p><% } %>
  <input name="name" required minlength="2" />
  <input name="email" type="email" required />
  <button>Register</button>
</form>
```

| | `res.render("dashboard")` | `res.redirect("/dashboard")` |
| --- | --- | --- |
| what happens | the server sends HTML now | the server tells the browser to make a **new GET request** |
| URL in the address bar | unchanged (still `/login`) | changes to `/dashboard` |
| use it | to show a page, or re-show a form with errors | after a successful POST |

### The Post/Redirect/Get pattern

After a successful form **POST**, always **redirect** instead of rendering. If you render, refreshing the page asks "Resubmit form?" and can create a duplicate order or account. Redirecting to a GET page makes refresh safe. Re-rendering is right only when validation fails and you want to show the form again with errors (status 400).

Never put personal data like emails into redirect URLs (`/dashboard?email=...`): URLs end up in browser history and server logs. Use the [session](/notes/authentication) to remember who's logged in.

## Interview questions

1. SSR vs CSR: which is better for SEO and first load, and why?
2. What is hydration? What is SSG?
3. When would you choose an EJS app, a React SPA, or Next.js?
4. `<%= %>` vs `<%- %>`. How does it relate to XSS?
5. `res.render` vs `res.redirect`. What is the Post/Redirect/Get pattern and why use it?
6. How do you reuse a navbar across EJS pages?

## Further reading

- [EJS documentation](https://ejs.co/#docs)
- [web.dev: Rendering on the web](https://web.dev/articles/rendering-on-the-web)
- [Next.js: Rendering](https://nextjs.org/docs/app/building-your-application/rendering)

Next: [MongoDB](/notes/mongodb).
