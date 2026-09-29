---
title: "Express.js: Routing, Middleware, REST APIs and MVC"
description: Build REST APIs with Express 5. Routes and route parameters, req.params, req.query and req.body, status codes, REST design, routers, middleware with diagrams, body parsing, error handling in Express 5, validation, security middleware, MVC folder structure and monolith vs microservices.
author: Vikas Patel
---

**Express** is the most used web framework for Node.js. It's small: it gives you **routing** (which code runs for which URL) and **middleware** (functions every request passes through), and leaves the rest to you. Express **5** is now the default version on npm; this note uses it.

```bash
npm install express
```

## Your first server

```js
import express from "express";

const app = express();
app.use(express.json());                 // parse JSON request bodies into req.body

app.get("/", (req, res) => {
  res.send("Home page");
});

app.listen(3000, () => console.log("http://localhost:3000"));
```

Compare it with the raw `http` server in [Node.js fundamentals](/notes/nodejs-fundamentals): routing, body parsing and responses are one line each.

## Routes and request data

A route is **method + path + handler**.

```js
// Route parameter: /courses/42 → req.params.id === "42" (always a string)
app.get("/courses/:id", (req, res) => {
  res.json({ id: Number(req.params.id) });
});

// Query string: /search?q=node&page=2 → req.query = { q: "node", page: "2" }
app.get("/search", (req, res) => {
  const { q = "", page = "1" } = req.query;
  res.json({ q, page: Number(page) });
});

// Body: POST /courses with JSON { "title": "Express" } → req.body.title
app.post("/courses", (req, res) => {
  res.status(201).json({ id: 7, title: req.body.title });
});
```

| Where | Example | Read with | Use for |
| --- | --- | --- | --- |
| path | `/courses/42` | `req.params.id` | identifying a resource |
| query string | `?q=node&page=2` | `req.query.q` | filters, search, pagination, sorting |
| body | JSON or form data | `req.body` | data to create or update |
| headers | `Authorization: Bearer …` | `req.get("authorization")` | auth tokens, content type |
| cookies | `sid=abc` | `req.cookies` (with cookie-parser) | sessions |

### Sending responses

```js
res.send("text or HTML");               // sets Content-Type automatically
res.json({ ok: true });                 // JSON (use this for APIs)
res.status(404).json({ error: "Not found" });
res.sendStatus(204);                    // status with no body
res.redirect("/login");                 // tell the browser to go to another URL
res.render("home", { user });           // render a template (see server-side rendering)
res.sendFile(path.join(import.meta.dirname, "report.pdf"));
```

Send **exactly one** response per request. Sending twice throws "Cannot set headers after they are sent", usually from a missing `return` before an early `res.status(...)`.

## HTTP status codes you should know

| Code | Meaning | When |
| --- | --- | --- |
| 200 | OK | successful GET, PUT, PATCH |
| 201 | Created | successful POST that created something |
| 204 | No Content | successful DELETE |
| 301 / 302 | Moved permanently / temporarily | redirects |
| 304 | Not Modified | cached copy is still valid |
| 400 | Bad Request | invalid input (validation failed) |
| 401 | Unauthorized | not logged in, or bad token |
| 403 | Forbidden | logged in but not allowed |
| 404 | Not Found | no such route or resource |
| 409 | Conflict | duplicate email, version clash |
| 422 | Unprocessable Content | well-formed but semantically invalid (some APIs use this instead of 400) |
| 429 | Too Many Requests | rate limit hit |
| 500 | Internal Server Error | a bug on the server |
| 503 | Service Unavailable | overloaded or down for maintenance |

**4xx = the client's fault, 5xx = the server's fault.**

## REST API design

**REST** uses URLs for **resources** (nouns) and HTTP methods for **actions**:

| Method and path | Action | Success code |
| --- | --- | --- |
| `GET /courses` | list courses (with `?page=2&limit=20`) | 200 |
| `GET /courses/42` | get one course | 200 (404 if missing) |
| `POST /courses` | create a course | 201 |
| `PUT /courses/42` | replace a course | 200 |
| `PATCH /courses/42` | update some fields | 200 |
| `DELETE /courses/42` | delete a course | 204 |
| `GET /courses/42/lessons` | lessons of course 42 (nested resource) | 200 |

Good habits: plural nouns (`/courses`, not `/getCourses`), consistent JSON error shapes (`{ "error": "..." }`), pagination for lists, and a version prefix for public APIs (`/api/v1/...`). `GET`, `PUT` and `DELETE` should be **idempotent**: repeating them has the same effect as doing them once. `POST` isn't.

A complete CRUD example with an in-memory array:

```js
const courses = [{ id: 1, title: "JavaScript" }];
let nextId = 2;

app.get("/api/courses", (req, res) => res.json(courses));

app.get("/api/courses/:id", (req, res) => {
  const course = courses.find((c) => c.id === Number(req.params.id));
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

app.post("/api/courses", (req, res) => {
  const title = req.body?.title?.trim();
  if (!title) return res.status(400).json({ error: "title is required" });
  const course = { id: nextId++, title };
  courses.push(course);
  res.status(201).json(course);
});

app.patch("/api/courses/:id", (req, res) => {
  const course = courses.find((c) => c.id === Number(req.params.id));
  if (!course) return res.status(404).json({ error: "Course not found" });
  if (req.body?.title) course.title = req.body.title.trim();
  res.json(course);
});

app.delete("/api/courses/:id", (req, res) => {
  const index = courses.findIndex((c) => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Course not found" });
  courses.splice(index, 1);
  res.sendStatus(204);
});
```

Test it with the browser, `curl`, Postman, or the REST client in your editor. Next, store the data in [MongoDB](/notes/mongodb) or [PostgreSQL](/notes/postgresql-nodejs) instead of an array.

## Middleware

> **Middleware** is a function that runs **between the request arriving and the response being sent**. It gets `(req, res, next)` and can run code, change `req` and `res`, end the response, or call `next()` to pass control on.

![A request flowing through express.json, a logger and requireAuth to the route handler, with auth and error paths](/images/backend/express-middleware.svg "Middleware runs in the order you add it. Each one calls next() or sends a response.")

```js
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();                                    // without next(), the request hangs forever
});
```

**Order matters:** Express runs middleware and routes **top to bottom** in the order you register them. A body parser must come **before** the routes that read `req.body`, and the error handler must come **last**.

### Kinds of middleware

```js
app.use(logger);                                  // application-level: every request
app.use("/admin", requireAdmin);                  // every request under /admin
app.get("/dashboard", requireAuth, showDashboard); // route-level: only this route
app.get("/report", requireAuth, requireRole("teacher"), showReport); // chain several
```

### A real auth middleware

Middleware can **attach data to `req`** for later handlers:

```js
function requireAuth(req, res, next) {
  const token = req.get("authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Login required" });  // end here
  try {
    req.user = verifyToken(token);               // later handlers can read req.user
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ error: "Forbidden" });
```

(`verifyToken` is covered in [authentication](/notes/authentication).)

### Built-in body parsers

**"Why is `req.body` undefined?"** Because no body-parsing middleware ran for that request, or the client sent a different `Content-Type`.

| Content-Type | Middleware |
| --- | --- |
| `application/json` | `express.json()` |
| `application/x-www-form-urlencoded` (HTML forms) | `express.urlencoded({ extended: true })` |
| `text/plain` | `express.text()` |
| `application/octet-stream` | `express.raw()` |
| `multipart/form-data` (file uploads) | `multer` (third-party) |

```js
app.use(express.json({ limit: "100kb" }));       // reject huge bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));               // serve files from ./public at /
```

### Popular third-party middleware

| Package | Purpose |
| --- | --- |
| `helmet` | sets security headers |
| `cors` | allows requests from other origins (your front end on another domain) |
| `express-rate-limit` | limits requests per IP (protects login, OTP, contact forms) |
| `morgan` or `pino-http` | request logging |
| `cookie-parser` | reads cookies into `req.cookies` |
| `multer` | file uploads |
| `compression` | gzip responses |

## Routers: split routes into files

`express.Router()` is a mini app with its own routes and middleware:

```js
// routes/courses.js
import { Router } from "express";
import * as courses from "../controllers/courses.js";

const router = Router();
router.get("/", courses.list);
router.get("/:id", courses.show);
router.post("/", requireAuth, courses.create);
export default router;

// app.js
import courseRoutes from "./routes/courses.js";
app.use("/api/courses", courseRoutes);          // every route above is now under /api/courses
```

## Error handling (Express 5)

An **error-handling middleware** has **four** parameters, and goes **after** all routes:

```js
// 404 for anything that didn't match a route
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// Central error handler: must have 4 parameters
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 ? "Something went wrong" : err.message, // don't leak internals
  });
});
```

The big change in **Express 5**: if an `async` handler **throws or returns a rejected promise**, Express forwards the error to your error handler automatically. In Express 4 the request would hang (or the process would log an unhandled rejection), so everyone wrapped handlers in `try`/`catch` or an `asyncHandler` helper.

```js
app.get("/api/courses/:id", async (req, res) => {
  const course = await Course.findById(req.params.id);  // if this throws, the error handler runs
  if (!course) {
    const err = new Error("Course not found");
    err.status = 404;
    throw err;                                           // Express 5 catches this too
  }
  res.json(course);
});
```

Other Express 5 changes you may notice when following older tutorials: wildcard routes need a name (`/files/*splat` instead of `/files/*`), optional parameters use braces (`/:file{.:ext}`), `req.query` is read-only, and Node 18 or newer is required.

## Validation: never trust the client

Client-side checks (`<input required minlength="3">`) are for user experience. **Server-side validation** is for security: anyone can send any request with `curl`. Use a schema library such as **Zod** or **Joi**:

```js
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().trim().min(3).max(100),
  price: z.number().int().nonnegative(),
  tags: z.array(z.string()).max(10).default([]),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid input", details: result.error.issues });
  }
  req.body = result.data;                        // cleaned, typed data
  next();
};

app.post("/api/courses", requireAuth, validate(courseSchema), createCourse);
```

The Joi version looks almost the same: `Joi.object({ title: Joi.string().min(3).required() })` and `schema.validate(req.body)`.

## MVC: organising a real app

**MVC** splits an app into three jobs:

- **Model:** data and rules, and talking to the database (a Mongoose model or SQL queries).
- **View:** what the user sees, such as an EJS template, or JSON for an API.
- **Controller:** handles the request: reads input, calls the model, chooses the view.

The **router** maps URLs to controllers.

![Client to router to controller, which asks the model for data and sends a view back](/images/backend/mvc-flow.svg "Each layer has one job, so each is easy to find, change and test.")

```text
course-api/
├── src/
│   ├── app.js            # create the app, add middleware and routers
│   ├── server.js         # start listening (kept separate so tests can import app)
│   ├── routes/           # URL → controller
│   ├── controllers/      # request handling, no SQL, no HTML
│   ├── models/           # schemas and database access
│   ├── middleware/       # auth, validation, errors
│   ├── views/            # EJS templates (if server-rendered)
│   └── config/           # env variables, database connection
├── public/               # static files
├── .env.example
└── package.json
```

```js
// controllers/courses.js
import { Course } from "../models/course.js";

export async function list(req, res) {
  const courses = await Course.find().sort({ createdAt: -1 }).limit(20);
  res.json(courses);                   // an API sends JSON; a web app would res.render("courses", { courses })
}
```

Many teams also add a **service** layer between controllers and models for business logic (for example, "enrolling charges a payment and sends an email"), keeping controllers thin.

### Forms and method-override

HTML forms can only send `GET` and `POST`. For server-rendered apps that need `PATCH` or `DELETE`, the `method-override` package reads a hidden field or query parameter:

```js
import methodOverride from "method-override";
app.use(methodOverride("_method"));
// <form method="POST" action="/courses/42?_method=DELETE"> is handled as DELETE /courses/42
```

APIs called with `fetch` don't need it: `fetch` can use any method.

## Monolith vs microservices

| | Monolith | Microservices |
| --- | --- | --- |
| structure | one codebase, one deployable app | many small services, each with its own database |
| start-up cost | low | high: networking, deployment, monitoring |
| scaling | scale the whole app | scale each service separately |
| failures | one bug can take everything down | failures are isolated, but the network adds new ones |
| best for | most new products and small teams | large teams and very different workloads |

Start with a **well-structured monolith** (MVC, clear modules). Split out services only when a real need appears. More in [system design](/notes/system-design).

## Interview questions

1. What is middleware? What happens if `next()` isn't called?
2. `app.use()` vs `app.get()`.
3. `req.params` vs `req.query` vs `req.body`.
4. Why is `req.body` undefined?
5. How does error handling work in Express? What changed in Express 5 for async handlers?
6. Design REST endpoints for courses and lessons. Which methods are idempotent?
7. 401 vs 403. 400 vs 422. When do you return 201 and 204?
8. Explain MVC. Where does validation go? What does a router do?
9. Why validate on the server if the client already validates?
10. Monolith vs microservices.

## Further reading

- [Express: Guide](https://expressjs.com/en/guide/routing.html) and [Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html)
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [Express: Security best practices](https://expressjs.com/en/advanced/best-practice-security.html)

Next: [Server-side rendering with EJS](/notes/server-side-rendering-ejs).
