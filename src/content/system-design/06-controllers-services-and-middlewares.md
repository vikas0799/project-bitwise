---
title: Controllers, Services and Middlewares
description: What happens inside the server between a request arriving and a response leaving. The entry point, routing, controller, service and repository layers, middleware and next(), why middleware order matters, the common middlewares, and the request context for auth data, tracing and cancellation, with Express.
author: Bitwise School
---

The earlier chapters followed a request *outside* the server: how it's built, sent and answered. This chapter zooms *inside* the server, and traces everything that happens between the moment a request arrives and the moment the response leaves. That sequence is called the **request lifecycle**.

![A request passing through the entry point, middleware, router, controller, service and repository to the database, with the request context alongside](/images/system-design/request-layers.svg "The request travels left to right. The result climbs back up the same path.")

## Entry point and routing

Your server **listens on a port**, such as 3000. When a request arrives, the operating system hands it to whichever process is listening on that port. That's the **entry point**: `app.listen(3000)` in Express.

Next comes **routing** ([Chapter 02](/system-design/02-routing-in-backend/)). The router looks at the method and path and picks the **handler**, also called a **controller**: the function you wrote for that route.

## Why split the code into three layers?

Once routing has picked a handler, a well-organised backend splits the work into three layers: **controllers**, **services** and **repositories**.

Nothing forces you to. You *can* write the whole feature inside one route handler, and for a tiny project that's fine. The split is a design pattern called **separation of concerns**, and it pays off as the codebase grows:

- each layer has one job, so bugs are easier to locate,
- you can change one layer (swap MongoDB for Postgres, say) without rewriting the others,
- business logic can be reused: by an HTTP route, a background job, a CLI script,
- services can be unit-tested without starting a server or a database.

A typical Express folder layout:

```text
src/
  app.js                    ← creates the app, registers middleware and routes
  routes/books.js           ← URL + method → controller
  controllers/bookController.js
  services/bookService.js
  repositories/bookRepo.js
  middlewares/              ← auth.js, validate.js, requestId.js, errorHandler.js
  errors.js                 ← domain error classes
```

## The controller layer

The controller **controls the flow of data**: from the client into your system, and from your system back to the client. The framework hands it two objects for every request:

- the **request object** (`req`): method, path, headers, query, params and body,
- the **response object** (`res`): how you set the status code and headers and send the body.

Inside, a controller does the same steps every time:

1. **Extract** what it needs: query parameters for a GET, the body for POST/PUT/PATCH, path parameters for a specific resource.
2. **Deserialize (bind)** the raw JSON into native objects ([Chapter 03](/system-design/03-serialization-and-deserialization/)). In Express, `express.json()` middleware already did this, so `req.body` is an object. In Go or Python you usually do it inside the handler. Broken JSON means a 400.
3. **Validate** every input ([Chapter 05](/system-design/05-validations-and-transformations/)).
4. **Transform**: apply defaults and normalise. Good API design makes query parameters optional, so `GET /books` with no `?sort=` should still work, with the controller filling in `sort = "title"`.
5. **Delegate** to a service, passing clean data plus context such as the logged-in user's id.
6. **Respond**: choose the right status code and send the result.

```js
// controllers/bookController.js
import { bookService } from "../services/bookService.js";

export const bookController = {
  async list(req, res) {
    const { sort, page } = req.valid.query;           // validated, defaults filled in
    res.json(await bookService.list({ sort, page }));
  },

  async getOne(req, res) {
    res.json(await bookService.getById(req.valid.params.id));
  },

  async create(req, res) {
    // The owner comes from the verified login (req.user), never from the request body
    const book = await bookService.create(req.user.id, req.valid.body);
    res.status(201).location(`/api/books/${book.id}`).json(book);
  },
};
```

```js
// routes/books.js
import express from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { bookController } from "../controllers/bookController.js";

const ListQuery = z.object({
  sort: z.enum(["title", "date"]).default("title"),
  page: z.coerce.number().int().min(1).default(1),
});
const IdParams = z.object({ id: z.coerce.number().int().positive() });
const NewBook = z.object({ title: z.string().trim().min(2), author: z.string().trim().min(2), isbn: z.string().regex(/^\d{13}$/) });

export const books = express.Router();
books.get("/", validate({ query: ListQuery }), bookController.list);
books.get("/:id", validate({ params: IdParams }), bookController.getOne);
books.post("/", requireAuth, validate({ body: NewBook }), bookController.create);
```

## The service layer

The service is where the **actual work** happens. One rule matters more than any other:

> **A service knows nothing about HTTP.** No `req`, no `res`, no status codes, no headers. Reading a service method, you shouldn't be able to tell whether it's called by an API, a cron job or a test.

It's just a function: data in, work done, data out. The controller decides *how to report* the result over HTTP; the service decides *what happens*.

A service often **orchestrates** several things: calls one or more repository methods, combines their results, talks to external APIs, sends an email or a notification. Some services never touch the database at all.

When something goes wrong in business terms (a duplicate ISBN, a missing book), the service throws a **domain error** that describes the problem in plain words, not an HTTP status. One error-handling middleware translates those errors into status codes.

```js
// errors.js
export class AppError extends Error {}
export class NotFoundError extends AppError {}
export class ConflictError extends AppError {}
```

```js
// services/bookService.js
import { bookRepo } from "../repositories/bookRepo.js";
import { NotFoundError, ConflictError } from "../errors.js";
import { mailer } from "./mailer.js";

const PAGE_SIZE = 20;

export const bookService = {
  list: ({ sort, page }) => bookRepo.findAll({ sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),

  async getById(id) {
    const book = await bookRepo.findById(id);
    if (!book) throw new NotFoundError(`Book ${id} not found`);
    return book;
  },

  async create(ownerId, data) {
    if (await bookRepo.existsByIsbn(data.isbn)) throw new ConflictError("A book with this ISBN already exists");
    const book = await bookRepo.insert({ ...data, ownerId });
    await mailer.send(ownerId, `"${book.title}" is now listed`);
    return book;
  },
};
```

## The repository layer

The repository has one concern: **talking to the database**. It takes data from the service, builds the query (insert, filter, sort, join), runs it and returns the result. No business rules here.

Keep each method to **one job and one kind of result**. Don't write `getBooks(id?)` that returns one book when you pass an id and a list when you don't. Write `findAll()` and `findById(id)`. Callers always know what they'll get back.

```js
// repositories/bookRepo.js
import { pool } from "../db.js";   // a pg Pool

const SORT_COLUMNS = { title: "title", date: "created_at" };   // never put user input directly into SQL

export const bookRepo = {
  async findAll({ sort, limit, offset }) {
    const { rows } = await pool.query(
      `SELECT id, title, author FROM books ORDER BY ${SORT_COLUMNS[sort]} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query("SELECT * FROM books WHERE id = $1", [id]);
    return rows[0] ?? null;
  },

  async existsByIsbn(isbn) {
    const { rowCount } = await pool.query("SELECT 1 FROM books WHERE isbn = $1", [isbn]);
    return rowCount > 0;
  },

  async insert({ title, author, isbn, ownerId }) {
    const { rows } = await pool.query(
      "INSERT INTO books (title, author, isbn, owner_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, author, isbn, ownerId]
    );
    return rows[0];
  },
};
```

Values go in as `$1, $2` parameters, so they can never be run as SQL. The sort column can't be a parameter, so it comes from a fixed allow-list. [Chapter 08](/system-design/08-databases/) goes deeper into databases.

## The whole round trip

For `GET /api/books?sort=date`:

1. Middleware runs (CORS, logging, auth if needed).
2. The router picks `bookController.list`.
3. The controller validates the query and fills in `page = 1`.
4. It calls `bookService.list(...)`, which calls `bookRepo.findAll(...)`.
5. Rows come back to the service, and the service returns them to the controller.
6. The controller sends `200 OK` with the JSON.

In short: **controllers move data in and out, services do the work, repositories talk to the database.** Status codes are chosen in only one place: the controller, or the error handler for failures.

## Middleware

Look at the lifecycle again and notice the gaps: between the entry point and routing, between routing and the handler, between the handler and the response. Functions that run in those gaps are **middleware**, literally code that runs in the middle.

A middleware is like a handler with one extra power. It receives `req` and `res`, so it can read the request, change it, set response headers or even send a response. It also receives **`next`**, a function that passes control to whatever comes next in the chain.

A middleware ends in one of two ways:

1. Do its job, then call **`next()`** so the request continues.
2. **Send a response itself** and *don't* call `next()`. The request stops right there, before reaching any handler. That's how a failed login check or a rate limit rejects requests cheaply.

```js
// A middleware that times every request
export function timing(req, res, next) {
  const start = performance.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${(performance.now() - start).toFixed(1)}ms`);
  });
  next();   // continue down the chain
}
```

![A request passing through Express middleware to a route handler, with the auth and error paths](/images/backend/express-middleware.svg "Each middleware either calls next() or ends the request itself.")

### Why middleware at all?

For the same reason we write functions: to avoid repeating code. Logging, security headers, body parsing, authentication and compression must happen on almost every request across hundreds of endpoints. A helper function would still need calling in every handler. Middleware runs **automatically** for every request that passes through it.

### Order matters

Middleware runs **in the order you register it**. That order changes behaviour:

- **CORS early**, so disallowed origins are turned away before any work is done.
- **Logging early**, so even rejected requests are logged.
- **Body parsing before** anything that reads `req.body`.
- **Authentication before** the routes that need it.
- A **404 handler after** all routes.
- The **error handler last**. Errors only travel *forward*, so an error handler can only catch errors from middleware and routes registered **before** it.

```js
// app.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import { requestId } from "./middlewares/requestId.js";
import { timing } from "./middlewares/timing.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { books } from "./routes/books.js";

const app = express();

app.use(helmet());                                         // security headers
app.use(cors({ origin: ["https://foodapp.in"] }));         // CORS, early
app.use(requestId);                                        // a trace id for every request
app.use(timing);                                           // logging
app.use(compression());
app.use(express.json({ limit: "100kb" }));                 // parse JSON bodies
app.use("/api", rateLimit({ windowMs: 60_000, limit: 100 }));

app.use("/api/books", books);                              // routes

app.use((req, res) => res.status(404).json({ error: "Route not found" }));   // after all routes
app.use(errorHandler);                                     // always last

export default app;
```

### Common middlewares

| Middleware | What it does | Where |
| --- | --- | --- |
| **CORS** | adds `Access-Control-Allow-*` headers for allowed origins ([Chapter 01](/system-design/01-http-and-cors/)) | early |
| **Security headers** | CSP, HSTS, `nosniff`, frame protection (`helmet`) | early |
| **Request id** | gives each request a unique id for tracing | early |
| **Logging** | records method, path, status and duration | early |
| **Body parsing** | turns JSON or form bodies into `req.body` | before routes |
| **Rate limiting** | too many requests from one client → **429 Too Many Requests** | before routes |
| **Authentication** | verifies the session or token; failure → **401**; success → puts the user on `req.user` | before protected routes |
| **Compression** | gzip or Brotli for large responses | anywhere before the response |
| **Error handler** | turns any thrown error into a clean JSON response with the right status | **last** |

### The global error handler

Express recognises an error handler because it takes **four** arguments. In Express 5, if an `async` handler throws or a promise rejects, Express passes the error here automatically, so you don't need a `try/catch` in every controller.

```js
// middlewares/errorHandler.js
import { NotFoundError, ConflictError } from "../errors.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
  if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Body is not valid JSON" });

  console.error({ requestId: req.id, err });                   // log the details for yourself...
  res.status(500).json({ error: "Something went wrong", requestId: req.id });   // ...but never leak them
}
```

[Chapter 12](/system-design/12-error-handling-and-fault-tolerance/) covers error handling and fault tolerance in depth.

## The request context

The auth middleware verified a token and stored the user somewhere, so the controller could read it later. That "somewhere" is the **request context**.

> **Request context**: storage that belongs to **one request**. Every request gets its own, and it never leaks into another request.

A request passes through many separate functions: CORS, logging, auth, permission checks, the controller, the error handler. The context gives them a shared place to read and write per-request data without passing it around by hand. Every framework has one: in Express it's the `req` object itself (and `res.locals`), in Go it's `context.Context`, in Java servlets it's request attributes.

### Use 1: who is logged in

The auth middleware writes the verified identity into the context:

```js
// middlewares/auth.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const [scheme, token] = (req.get("Authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Please log in" });
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    req.user = { id: claims.sub, role: claims.role };   // into the request context
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

Downstream, `bookController.create` reads the owner from `req.user.id`. It must **never** take a `userId` from the request body: a malicious client would simply send someone else's id. Identity comes only from what your auth middleware verified. The role stored there drives permission checks ([Chapter 04](/system-design/04-authentication-and-authorization/)).

### Use 2: tracing a request

An early middleware gives every request a unique id. Every log line includes it, the response returns it in a header, and calls to other services forward it. When a user reports "my order failed at 10:42", that one id lets you find every log line the request produced, across every service it touched.

Passing `req` into every function just to log the id gets messy, especially deep inside a repository. Node's built-in **`AsyncLocalStorage`** solves that: data you store at the start of a request is available anywhere in the async code that request triggers.

```js
// middlewares/requestId.js
import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

export const requestContext = new AsyncLocalStorage();

export function requestId(req, res, next) {
  const id = req.get("X-Request-Id") ?? crypto.randomUUID();
  req.id = id;
  res.set("X-Request-Id", id);
  requestContext.run({ requestId: id }, next);   // everything after this sees the store
}

// Anywhere, even in a repository, without passing req around
export const log = (message, extra = {}) =>
  console.log(JSON.stringify({ message, requestId: requestContext.getStore()?.requestId, ...extra }));
```

### Use 3: cancellation and deadlines

If the user closes the tab, or a request takes too long, there's no point continuing slow work for it. The context is the natural place to carry a **cancellation signal**. In Node that's an `AbortSignal`, which `fetch` and many database drivers accept:

```js
app.get("/api/reports/sales", requireAuth, async (req, res) => {
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) controller.abort();   // the client went away before we answered
  });
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);   // or 10 s max

  const report = await reportService.build(req.user.id, { signal });   // the service passes it to fetch / DB calls
  res.json(report);
});
```

Go builds this into `context.Context` with `WithTimeout`; in Node you pass the signal down explicitly. Either way, nothing hangs forever waiting for work nobody needs.

## The whole picture

A request reaches the **entry point**, flows through an ordered chain of **middleware**, gets **routed** to a **controller** that validates and transforms its data, which **delegates** to a **service** that runs the business logic and calls **repositories** for database work. Alongside it all, a per-request **context** carries the user's identity, a trace id and a cancellation signal. The result climbs back up, and the controller (or the error handler) picks the status code and sends the response.

## Quick revision

| Term | One line |
| --- | --- |
| Entry point | the port your server listens on |
| Controller / handler | HTTP in and out: extract, bind, validate, transform, delegate, respond |
| Service | business logic; knows nothing about HTTP |
| Orchestration | a service combining repositories, APIs, emails and notifications |
| Repository | database queries only; one method, one kind of result |
| Middleware | runs between steps; gets `req`, `res` and `next` |
| `next()` | pass control on; not calling it ends the request |
| Order | CORS/logging early, auth before protected routes, error handler last |
| Request context | per-request storage: `req.user`, `req.id`, signals |
| AsyncLocalStorage | request data available anywhere in that request's async code |

## Interview questions

1. Walk through what happens inside an Express server from the moment a request arrives to the moment the response is sent.
2. Why separate controllers, services and repositories? When would you not bother?
3. What should never appear in a service? Why?
4. Why should a repository method return only one kind of result?
5. What is middleware? What are the two ways a middleware can finish?
6. Why must the error handler be registered last? How does Express know a function is an error handler?
7. Give a sensible order for CORS, logging, body parsing, auth, routes and error handling.
8. Why must the user id come from the auth middleware and not from the request body?
9. What is a request context? How does `AsyncLocalStorage` help with logging?
10. How would you stop slow work when the client disconnects?

## Further reading

- [Express: writing middleware](https://expressjs.com/en/guide/writing-middleware.html) and [using middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Express: error handling](https://expressjs.com/en/guide/error-handling.html)
- [Node.js: AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage)

Next: [Chapter 07, API Design (REST)](/system-design/07-api-design-rest/).
