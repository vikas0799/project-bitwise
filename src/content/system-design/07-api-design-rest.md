---
title: "API Design: REST Done Right"
description: What REST really means and where it came from, Fielding's six constraints, naming resources, choosing methods, custom actions, pagination, sorting and filtering, honest status codes, consistent errors (RFC 9457), versioning, and a complete REST API in Express you can run and test.
author: Bitwise School
---

Almost every backend you'll build is an API that other people's code depends on: your own frontend, a mobile app, another team, maybe a paying customer. A well-designed API feels obvious: once you've used one endpoint, you can guess the rest. This chapter turns REST from a buzzword into a set of habits you can apply to every endpoint.

## Where REST came from

In 1990, **Tim Berners-Lee** started the World Wide Web and, within about a year, created the URL, HTTP, HTML, the first web server and the first browser. Then the web grew far faster than anyone planned for.

**Roy Fielding**, one of the people behind the Apache web server and a co-author of the HTTP/1.1 specification, studied what made the web able to grow at all. In his **2000 PhD dissertation** he described those properties as an architectural style and named it **REST: REpresentational State Transfer**. The dissertation is still worth reading, because it explains *why* the rules exist.

The three words are real ideas you use every day:

- **Representational**: one resource can be shown in different formats. The same user can be sent as JSON to an app, HTML to a browser, or CSV to an export tool. The resource is one thing; its representations are many.
- **State**: the current data of a resource. A shopping cart's state is the items in it, their quantities and the total right now.
- **Transfer**: moving those representations between client and server, using HTTP methods.

So every API call is really "move a representation of some resource's current state, over HTTP".

## The six constraints

Fielding listed six constraints. Following them is what gives a system REST's scalability.

| Constraint | What it says | What you get |
| --- | --- | --- |
| **Client-server** | the client owns the UI; the server owns data and business logic | each side can change independently |
| **Uniform interface** | one standard way to talk to every resource | every service looks and behaves alike |
| **Layered system** | each layer only sees the layer next to it | add CDNs, proxies and load balancers without changing clients |
| **Cacheable** | responses say whether they can be cached | less server load, faster responses |
| **Stateless** | the server keeps no memory of earlier requests | any server can handle any request: horizontal scaling |
| **Code on demand** (optional) | the server may send code (like JavaScript) to the client | more flexible clients |

The **uniform interface** has four parts: every resource has a **URL**; you change a resource by sending a **representation** of it (the JSON in a PATCH); every message is **self-descriptive** (method, headers and `Content-Type` say how to read it); and **HATEOAS** (hypermedia as the engine of application state): responses include links to what you can do next. HATEOAS is the one part most real APIs skip.

![A client, CDN, load balancer, three stateless API servers and a database, labelled with the REST constraints each layer represents](/images/system-design/rest-constraints.svg "Statelessness is what lets the load balancer send any request to any server.")

In practice, **stateless** and **layered** matter most. Because no server remembers you, a load balancer can spread requests across three identical servers, or thirty. And because the client only talks to the next layer, you can slide a CDN, a cache or an API gateway in front without the client noticing. That's how a small app grows into one serving millions.

## Why REST still confuses people

REST's conventions formed when websites were **multi-page apps (MPAs)**: each click asked the server for a full HTML page. Today we mostly build **single-page apps (SPAs)**: the browser downloads JavaScript once, routes on the client, and only asks the server for JSON. The server became a pure data API, and some old conventions feel ambiguous against that.

This chapter doesn't invent new rules. It picks one clear, standard style so you stop debating "is this RESTful?" on every endpoint and spend your time on business logic.

## Naming resources

A typical API URL:

```text
https://api.coursehub.in/v1/courses/system-design-basics/lessons?sort=order
└─────┘ └──────────────┘ └─┘ └──────────────────────────────┘ └────────┘
scheme   api subdomain   version   resource path (hierarchy)      query
```

The common shape is `https://` + an `api.` subdomain + a version like `/v1` + the resource path. It's a convention, not a law, but most consumers will expect it.

**Rule 1: resources are plural nouns.** `/courses` for the list, and `/courses/42` for one course, not `/course/42`. The collection is plural; the id picks one member. URLs name **things**; the HTTP method supplies the verb. Not `/getCourses` or `/createCourse`.

**Rule 2: no spaces, underscores or capital letters.** To put a readable name in a URL, make a **slug**: lowercase it and replace spaces with hyphens. "System Design Basics" becomes `system-design-basics`.

```js
const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

slugify("System Design: Basics!");   // "system-design-basics"
```

**Rule 3: the slash means "belongs to".** `/courses/42/lessons` reads as "the lessons of course 42". Collection, then one member, then that member's sub-collection. Keep it to two or three levels ([Chapter 02](/system-design/02-routing-in-backend/) covers nested routes).

## Choosing the method

The method expresses intent. [Chapter 01](/system-design/01-http-and-cors/) covers methods and idempotency in detail; here is the API designer's summary:

| Method | Use it to | Idempotent? | Body |
| --- | --- | --- | --- |
| `GET` | read | yes, and safe | no |
| `POST` | create, or run a custom action | **no** | yes |
| `PUT` | replace a resource completely | yes | the **whole** resource |
| `PATCH` | change some fields | usually | only the changed fields |
| `DELETE` | remove | yes | no |

**Idempotency is about the effect on the server, not the response.** `GET /courses` is still idempotent even if someone else adds a course between your two calls: *your* call changed nothing. `DELETE /courses/42` returns 204 then 404, but after either call the course is gone.

### The PUT trap

`PUT` **replaces**. If a user has `name`, `email` and `city`, and you send `PUT /users/7` with only `{"city": "Pune"}`, you've just erased the name and email. Any field you forget to send is gone. If you only have some of the fields, use `PATCH`. Most SPA-era APIs mostly use `PATCH`, since you rarely replace a whole record. For a public API, stick to the real meanings, because consumers will assume them.

When two people edit the same record, use `ETag` + `If-Match` so a stale save gets **412 Precondition Failed** instead of silently overwriting the other person's change ([Chapter 01](/system-design/01-http-and-cors/) has the full example).

### POST is the one that isn't idempotent

Ten identical `POST /courses` requests create ten courses with ten different ids. That's why a retried payment can charge twice. The fix is an **idempotency key**, covered in [Chapter 01](/system-design/01-http-and-cors/).

## Custom actions: beyond CRUD

Some operations don't fit create, read, update or delete: "publish a course", "duplicate a course", "send a reminder email". REST leaves `POST` open-ended for exactly these. Put the action as a **verb at the end** of the specific resource's path:

```text
POST /v1/courses/42/publish
POST /v1/courses/42/duplicate
POST /v1/enrollments/918/send-reminder
```

The path still reads naturally: all courses → course 42 → the action to run on it.

Why is publishing not just `PATCH { "status": "published" }`? Because publishing a course might also email every student on the waitlist, generate certificates, notify the search index and lock the syllabus. The status change is a *side effect* of the action, not the action itself. When the operation is bigger than a field change, make it a custom action.

A custom action usually returns **200 OK** with the result, not 201, because it doesn't necessarily create anything. (Duplicating a course *does* create one, so `duplicate` returns 201 with a `Location`.) Never assume "POST means 201".

## List endpoints: paginate, sort, filter

A list endpoint must never dump the whole table. Serializing thousands of rows is slow, the network becomes the bottleneck, and users only look at the first 10 to 20 items anyway.

### Pagination

The client controls it with `page` and `limit`, and the response carries enough to build "Page 2 of 7" or know when infinite scroll should stop:

```json
{
  "data": [ { "id": 41, "title": "Caching" }, { "id": 40, "title": "Queues" } ],
  "pagination": { "page": 2, "limit": 2, "totalItems": 13, "totalPages": 7 }
}
```

If the client sends no `page` or `limit`, use defaults (page 1, 20 items), and cap `limit` (say at 100) so nobody can request a million rows. For very large or fast-changing lists, use **cursor pagination** instead ([Chapter 02](/system-design/02-routing-in-backend/)).

### Sorting

Two parameters: `sortBy` (which field) and `sortOrder` (`asc` or `desc`). Even with no sort parameters, **always sort by something**: without an `ORDER BY`, a database may return rows in a different order each time, and pages would overlap or skip items. A sensible default is newest first: `sortBy=createdAt&sortOrder=desc`. Only allow sorting by fields on an **allow-list**, never by any column name the client invents.

### Filtering

Resource fields become optional query parameters that narrow the list: `?level=beginner`, `?level=beginner&free=true`.

## Status codes: be honest

The full table is in [Chapter 01](/system-design/01-http-and-cors/). The ones you'll use on almost every endpoint:

| Code | When |
| --- | --- |
| `200 OK` | read, update or custom action succeeded |
| `201 Created` | a POST created something; return it, with a `Location` header |
| `204 No Content` | a DELETE succeeded; nothing to return |
| `400 Bad Request` | malformed input |
| `401` / `403` | not logged in / logged in but not allowed |
| `404 Not Found` | the **one specific** resource doesn't exist |
| `409 Conflict` | clashes with current state: duplicate slug, deleting a course that has enrolled students |
| `422 Unprocessable Content` | valid JSON, but breaks a business rule |
| `429 Too Many Requests` | rate limited; respect `Retry-After` |
| `500` / `503` | the server failed / is overloaded or in maintenance |

**The 404 rule people get wrong:** return 404 only when a client asks for **one specific resource** that doesn't exist (`GET /courses/999`). If a **list** matches nothing (`GET /courses?level=expert`), that's still a successful search: return **200** with `"data": []`.

The **first digit** is a quick triage tool: 4xx means fix your request, 5xx means it isn't your fault (retry with backoff, or tell the server team).

Never return `200` with `{"success": false}` in the body. The status code exists so clients, proxies and monitoring tools can understand the outcome without reading the body.

## A worked example: a course platform

Start from the **screens**, not the database. Looking at the designs for a course platform, the nouns users interact with are **courses**, **lessons**, **students** and **enrollments**. Those are your resources. Each one gets the same set of endpoints:

| Action | Method and route | Success |
| --- | --- | --- |
| List courses | `GET /v1/courses` | 200, paginated |
| Create a course | `POST /v1/courses` | 201, the new course + `Location` |
| Get one course | `GET /v1/courses/:id` | 200 (or 404) |
| Update some fields | `PATCH /v1/courses/:id` | 200, the updated course |
| Delete | `DELETE /v1/courses/:id` | 204 |
| Publish (custom action) | `POST /v1/courses/:id/publish` | 200, the published course |
| A course's lessons | `GET /v1/courses/:id/lessons` | 200, paginated |

Notice the symmetry. List and create share `/courses` and differ only by method. Get, update and delete share `/courses/:id`. Custom actions add a verb. `lessons` and `enrollments` follow exactly the same pattern, so a frontend developer who learns one resource already knows the others.

## Golden rules

1. **Find the nouns in the UI first.** The screens and the product team tell you what users touch, and that shapes your resources.
2. **Design the interface before writing code.** Sketch routes, request bodies and responses in Postman, Insomnia or an OpenAPI file first. Consumers should never need to read your source code or guess.
3. **Provide sane defaults.** No `page` → 1. No `limit` → 20. No `sortBy` → newest first. No `status` on create → `draft`. Only require what you truly can't infer.
4. **Be ruthlessly consistent.**
   - JSON keys in **camelCase** everywhere (or snake_case everywhere: just never both).
   - **No abbreviations**: if it's `description` in one place, it's never `desc` in another.
   - Dates in **ISO 8601** (`2026-11-14T10:30:00Z`).
   - **One pagination shape** and **one error shape** for every resource.
5. **Ship interactive docs.** Generate Swagger/OpenAPI docs from day one ([Chapter 25](/system-design/25-openapi-specification/)). Frontend developers use them to integrate, and you use them to test.

## Versioning

Once other teams or companies depend on your API, a renamed field breaks their code in production. Versioning lets you evolve without that.

| Strategy | Looks like | Trade-off |
| --- | --- | --- |
| **URL path** (most common) | `/v1/courses` → `/v2/courses` | obvious, easy to route and debug; the pragmatic default |
| Header | `Accept: application/vnd.coursehub.v2+json` | clean URLs, but invisible in a browser and harder to test |
| Query parameter | `/courses?version=2` | simple, but clutters URLs and complicates caching |

**Only breaking changes need a new version**: removing or renaming a field, changing its type or meaning, removing an endpoint, making an optional field required, changing default behaviour. **Adding** an optional field, endpoint or query parameter breaks nobody; old clients ignore what they don't know.

When retiring a version, announce a timeline, run both versions side by side, and send `Deprecation` and `Sunset` headers on the old one ([Chapter 02](/system-design/02-routing-in-backend/)).

## Errors are part of the contract

Teams design the happy path carefully, then return raw stack traces on failure. But the client's error-handling code depends on your error format just as much. Pick **one error envelope** and use it everywhere:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Some fields are invalid.",
    "details": [
      { "field": "title", "issue": "must be at least 3 characters" },
      { "field": "price", "issue": "must be 0 or more" }
    ],
    "requestId": "req_9f2a3c"
  }
}
```

- **`code`**: a stable string clients can `switch` on. Messages get reworded; codes don't.
- **`message`**: for humans and logs.
- **`details`**: per-field problems, so a form can highlight the exact inputs.
- **`requestId`**: the most useful field in production. A user quotes it in a bug report and you find the exact request in your logs in seconds.

**Never leak internals**: no stack traces, SQL errors or file paths. They don't help the consumer and they hand attackers a map of your system. Log the details on the server against the `requestId`; send the clean envelope to the client.

If you'd rather follow a standard than invent a shape, **RFC 9457 (Problem Details for HTTP APIs)** defines an `application/problem+json` body with `type`, `title`, `status`, `detail` and `instance` fields:

```json
{
  "type": "https://api.coursehub.in/problems/validation-failed",
  "title": "Some fields are invalid.",
  "status": 400,
  "detail": "title must be at least 3 characters",
  "instance": "/v1/courses"
}
```

Either is fine. The only wrong choice is being inconsistent.

## Six constraints or eight principles?

Ask one engineer for "the principles of REST" and you'll hear six; another will list eight. Both are right, because they answer different questions:

- The **six constraints** (above) define what makes a system RESTful. That's the answer for "define REST" in an interview or exam.
- The **eight conventions** are how you design a good API on top of them. That's the answer for "how should I design this endpoint?" in a code review.

| # | Convention | In one line |
| --- | --- | --- |
| 1 | Resources are plural nouns | `/courses/42`, never `/getCourse?id=42` |
| 2 | Methods by intent | GET read, POST create/action, PUT replace, PATCH partial, DELETE remove |
| 3 | Honest status codes | don't hide an error inside a 200 |
| 4 | Stateless | every request carries what it needs (also a Fielding constraint) |
| 5 | Ruthless consistency | one casing, one date format, one pagination and error shape |
| 6 | Versioning | bump only for breaking changes |
| 7 | Page, sort, filter | never dump a table; default everything |
| 8 | Structured errors | one machine-readable envelope on every failure |

They overlap: statelessness is on both lists, `Cache-Control` and `ETag` put the cacheable constraint into practice, and plural-noun URLs plus methods-by-intent *are* the uniform interface in everyday form.

## A complete REST API in Express

Here is everything above in one runnable file: a `tasks` API with listing (page, sort, filter, defaults), CRUD, a custom action, validation and one error envelope. It keeps data in memory so you can run it instantly; swap the `Map` for a database and none of the routes change.

```bash
npm install express zod
```

```js
// tasks.js: a complete REST API for one resource, "tasks". Run: node tasks.js
import express from "express";
import crypto from "node:crypto";
import { z } from "zod";

// ---------- Store (swap this for a real database later) ----------
const tasks = new Map();
let nextId = 1;
const now = () => new Date().toISOString();
for (const title of ["Design the schema", "Write the API", "Add pagination", "Deploy to staging"]) {
  const id = nextId++;
  tasks.set(id, { id, title, done: id === 1, createdAt: now(), updatedAt: now() });
}

// ---------- Schemas ----------
const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  done: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});
const IdParams = z.object({ id: z.coerce.number().int().positive() });
const NewTask = z.object({ title: z.string().trim().min(1).max(200), done: z.boolean().default(false) });
const TaskPatch = z.object({ title: z.string().trim().min(1).max(200), done: z.boolean() }).partial().strict();

// ---------- Helpers ----------
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    Object.assign(this, { status, code, details });
  }
}
const parse = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const details = result.error.issues.map((i) => ({ field: i.path.join("."), issue: i.message }));
  throw new ApiError(400, "validation_failed", "Some fields are invalid.", details);
};
const findTask = (id) => {
  const task = tasks.get(id);
  if (!task) throw new ApiError(404, "task_not_found", `Task ${id} does not exist.`);
  return task;
};

// ---------- App ----------
const app = express();
app.use((req, res, next) => {
  req.id = crypto.randomUUID();   // first, so even a broken body gets a request id
  res.set("X-Request-Id", req.id);
  next();
});
app.use(express.json());

app.get("/healthz", (req, res) => res.json({ status: "ok" }));

// List: page, sort, filter, with defaults for everything
app.get("/v1/tasks", (req, res) => {
  const { page, limit, sortBy, sortOrder, done } = parse(ListQuery, req.query);
  let rows = [...tasks.values()];
  if (done !== undefined) rows = rows.filter((t) => t.done === done);
  const dir = sortOrder === "asc" ? 1 : -1;
  rows.sort((a, b) => (a[sortBy] < b[sortBy] ? -dir : a[sortBy] > b[sortBy] ? dir : a.id - b.id));
  const totalItems = rows.length;
  res.json({
    data: rows.slice((page - 1) * limit, page * limit),   // a page past the end is just []
    pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  });
});

app.get("/v1/tasks/:id", (req, res) => {
  const { id } = parse(IdParams, req.params);
  res.json(findTask(id));
});

app.post("/v1/tasks", (req, res) => {
  const input = parse(NewTask, req.body ?? {});
  const id = nextId++;
  const task = { id, ...input, createdAt: now(), updatedAt: now() };
  tasks.set(id, task);
  res.status(201).location(`/v1/tasks/${id}`).json(task);
});

app.patch("/v1/tasks/:id", (req, res) => {
  const { id } = parse(IdParams, req.params);
  const changes = parse(TaskPatch, req.body ?? {});
  const task = { ...findTask(id), ...changes, updatedAt: now() };
  tasks.set(id, task);
  res.json(task);
});

app.delete("/v1/tasks/:id", (req, res) => {
  const { id } = parse(IdParams, req.params);
  findTask(id);
  tasks.delete(id);
  res.sendStatus(204);
});

// Custom action: more than a field update, so it's a POST with a verb at the end
app.post("/v1/tasks/:id/duplicate", (req, res) => {
  const { id } = parse(IdParams, req.params);
  const original = findTask(id);
  const copyId = nextId++;
  const copy = { ...original, id: copyId, title: `${original.title} (copy)`, done: false, createdAt: now(), updatedAt: now() };
  tasks.set(copyId, copy);
  res.status(201).location(`/v1/tasks/${copyId}`).json(copy);
});

// Unknown route → 404 in the same error shape
app.use((req, res, next) => next(new ApiError(404, "route_not_found", `No route for ${req.method} ${req.path}.`)));

// One error envelope for every failure
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") err = new ApiError(400, "invalid_json", "The request body is not valid JSON.");
  if (!(err instanceof ApiError)) {
    console.error(req.id, err);   // full details stay in your logs
    err = new ApiError(500, "internal_error", "Something went wrong.");
  }
  res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details, requestId: req.id } });
});

app.listen(3000, () => console.log("Task API on http://localhost:3000"));
```

Run it with `node tasks.js` (with `"type": "module"` in `package.json`) and try it:

```bash
curl "localhost:3000/v1/tasks?limit=2&sortBy=title&sortOrder=asc&done=false"
```

```bash
curl -i -X POST localhost:3000/v1/tasks -H "Content-Type: application/json" -d '{"title":"Write tests"}'
```

```bash
curl -i -X DELETE localhost:3000/v1/tasks/3
```

What each request returns:

| Request | Response |
| --- | --- |
| `GET /v1/tasks` with valid options, or a page past the end | **200** `{ data, pagination }` (an empty page is `"data": []`) |
| `GET /v1/tasks?sortBy=colour` or `limit=0` | **400** `validation_failed`, with the bad fields listed |
| `GET /v1/tasks/2` | **200** the task |
| `GET /v1/tasks/999` | **404** `task_not_found` |
| `GET /v1/tasks/abc` | **400** `validation_failed` |
| `POST /v1/tasks` with a title | **201** the new task + `Location: /v1/tasks/5` |
| `POST /v1/tasks` with broken JSON / no title | **400** `invalid_json` / `validation_failed` |
| `PATCH /v1/tasks/2` with `{"done": true}` | **200** the updated task |
| `PATCH` with a field that doesn't exist | **400**: unknown keys are rejected |
| `POST /v1/tasks/2/duplicate` | **201** the copy |
| `DELETE /v1/tasks/3`, then again | **204**, then **404** |
| any other route | **404** `route_not_found`, in the same envelope |

Small details worth copying: the request id is attached **before** body parsing, so even a broken-JSON error has one; `sortBy` uses an **allow-list**; `limit` is **capped at 100**; empty lists are `[]`, never `null`; and every error, including unknown routes and crashes, uses the **same envelope**. What's left out on purpose: a real database, authentication ([Chapter 04](/system-design/04-authentication-and-authorization/)) and `If-Match` concurrency checks.

## Quick revision

| Idea | One line |
| --- | --- |
| REST | resources with representations whose state is transferred over HTTP |
| Six constraints | client-server, uniform interface, layered, cacheable, stateless, code on demand (optional) |
| URLs | plural nouns, slugs, slash = hierarchy, verbs only for custom actions |
| PUT vs PATCH | PUT replaces everything (missing fields are erased); PATCH changes some fields |
| Custom action | `POST /resources/:id/verb` when the operation is bigger than a field change |
| Lists | paginate, sort (with a default), filter; cap `limit`; empty result = 200 + `[]` |
| 404 | only for a specific missing resource |
| Versioning | path versions; bump only for breaking changes |
| Errors | one envelope: `code`, `message`, `details`, `requestId`; never leak internals |

## Interview questions

1. What does REST stand for? Explain representation, state and transfer.
2. Name Fielding's six constraints. Which two matter most for scaling, and why?
3. Why are resource names plural nouns? How would you put a course title in a URL?
4. PUT vs PATCH: what goes wrong if you use PUT with only one field?
5. How would you design "publish a course"? Why not a PATCH on `status`?
6. Design a paginated, sortable, filterable list endpoint. What defaults would you choose?
7. A filter matches nothing. 404 or 200? Why?
8. When do you need a new API version? Is adding a field a breaking change?
9. What should an error response contain? What should it never contain?
10. Six constraints vs eight principles: what is the difference?

## Further reading

- [Roy Fielding's dissertation, chapter 5: REST](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
- [MDN: REST glossary entry](https://developer.mozilla.org/en-US/docs/Glossary/REST)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- [Microsoft REST API guidelines](https://github.com/microsoft/api-guidelines)

Next: [Chapter 08, Databases](/system-design/08-databases/).
