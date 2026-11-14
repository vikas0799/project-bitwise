---
title: Routing in the Backend
description: How a server maps method + path to a handler. Static and dynamic routes, path and query parameters, pagination, nested routes, route order, versioning and deprecation, 404 catch-all routes, and a small router built from scratch in JavaScript.
author: Bitwise School
---

When a food delivery app opens a restaurant page, it might send `GET /api/restaurants/4512/menu`. Somewhere on the server, one specific function has to run for that request and not the thousand others the API supports. Picking that function is **routing**.

> **Routing** is the mapping from a request's **method + path** to the **handler** function that should run for it.

Every request answers two questions:

- **What do you want to do?** That is the HTTP method: `GET` to read, `POST` to create, `PUT`/`PATCH` to update, `DELETE` to remove. ([Chapter 01](/system-design/01-http-and-cors/) covers methods in depth.)
- **Which thing do you want to do it to?** That is the path: `/api/books`, `/api/users/42`. The thing a path points to is called a **resource**.

The router combines the two answers and calls the matching **handler**: the function that validates input, talks to the database and sends a response.

## Method + path is the key

The router treats the method and the path **together** as one lookup key. `GET /api/books` and `POST /api/books` share a path, but they are two different keys, so they run two different handlers.

![Five requests matched against a route table of method and path patterns, each calling one handler, with a 404 fallback](/images/system-design/routing-table.svg "Requests on the left, the route table in the middle, the handler that runs on the right.")

In Express this table is just a list of `app.METHOD(path, handler)` calls:

```js
import express from "express";

const app = express();
app.use(express.json());

app.get("/api/books", listBooks);          // read the list
app.post("/api/books", createBook);        // add a book
app.get("/api/books/:id", getBook);        // read one book
app.put("/api/books/:id", replaceBook);    // replace one book
app.delete("/api/books/:id", deleteBook);  // delete one book

app.listen(3000);
```

Five routes, two paths. The method is what tells them apart.

## Static routes

A **static route** is a fixed string with nothing variable in it, like `/api/books` or `/api/health`. Matching it is a plain string comparison: the path either equals `/api/books` or it doesn't. Most APIs start with static routes for collections: one to list items, one to create an item.

## Dynamic routes and path parameters

You can't write a route for every book in the database. A **dynamic route** has a placeholder segment that matches any value:

```js
app.get("/api/books/:id", (req, res) => {
  // GET /api/books/42  →  req.params.id === "42"
});
```

The `:id` part is a **path parameter** (also called a route parameter). The colon syntax is used by almost every framework: Express, Fastify, Gin in Go, Spring uses `{id}`, FastAPI uses `{id}`. The idea is identical.

Path parameters identify **which resource** the request is about. Read `GET /api/users/42` out loud and it says "get the user whose id is 42". That readability is the point of REST-style URLs.

One thing trips up beginners: **everything in a URL is a string**. `req.params.id` is `"42"`, not `42`. Convert it, and reject bad values before they reach your database:

```js
app.get("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id must be a positive whole number" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});
```

## Query parameters

A **query string** comes after a `?` at the end of the URL. It holds `key=value` pairs separated by `&`:

```text
/api/books?genre=fiction&sort=-price&page=2&limit=10
```

Query parameters don't pick the resource. They **adjust the response**: filter it, sort it, search it or split it into pages. They are optional, and their order doesn't matter.

Why not put this in the body? Because by convention `GET` requests have no body. The query string is how a `GET` sends extra options. It also makes the URL shareable: you can bookmark or send someone `?genre=fiction&page=2` and they see the same page.

Special characters must be **URL-encoded**: a space becomes `%20` (or `+` inside a query string) and `&` becomes `%26`. Don't build query strings by hand; let the browser do it:

```js
const params = new URLSearchParams({ q: "paneer pizza", page: "2" });
fetch(`/api/search?${params}`);   // → /api/search?q=paneer+pizza&page=2
```

On the server, Express decodes the query into `req.query`. Values are strings, and a key repeated twice (`?tag=veg&tag=spicy`) becomes an array, so check types before using them.

### Pagination with query parameters

Returning 50,000 books in one response would be slow for the server, the network and the phone. **Pagination** returns one page at a time, controlled by query parameters:

```js
app.get("/api/books", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const filter = req.query.genre ? { genre: String(req.query.genre) } : {};

  const [books, total] = await Promise.all([
    Book.find(filter).skip((page - 1) * limit).limit(limit),
    Book.countDocuments(filter),
  ]);

  res.json({
    data: books,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});
```

The client reads `page` and `totalPages` from the response to show "Page 2 of 37" and to build the next request. Notice the defaults (page 1, 10 items) and the cap (never more than 50), so a request with no query or a silly `limit=100000` still behaves.

This style is **offset pagination**. It gets slow on huge tables, because the database still walks past every skipped row, and pages shift when new rows arrive. Feeds like Instagram use **cursor pagination** instead: the response includes a `nextCursor` (for example, the id of the last item), and the next request asks for `?cursor=<that id>&limit=20`.

## Path parameter or query parameter?

Both put data in the URL, so it's easy to mix them up. Use this rule:

| Question | Use | Example |
| --- | --- | --- |
| Does it decide **which** resource? | path parameter | `/api/orders/981` |
| Does it only **filter, sort, search or page** the result? | query parameter | `/api/orders?status=delivered&page=2` |

`/api/search/paneer` *works*, but it's the wrong tool: the search term is an option, not the identity of a resource. `/api/search?q=paneer` says what it means.

![The URL /api/v1/users/123/posts/456?sort=new&page=2 split into prefix, version, static parts, path parameters and a query string](/images/system-design/url-anatomy.svg "The path says which resource. The query string says how you want it.")

## Nested routes

When one resource belongs to another, nest them in the path:

| Route | Returns |
| --- | --- |
| `GET /api/users` | all users |
| `GET /api/users/123` | user 123 |
| `GET /api/users/123/posts` | all posts by user 123 |
| `GET /api/users/123/posts/456` | post 456, which belongs to user 123 |

Each level is its own endpoint with its own handler, and each one narrows the result. In Express, group the inner routes in a `Router` and pass `mergeParams: true` so the inner handlers can see the outer `:userId`:

```js
const posts = express.Router({ mergeParams: true });

posts.get("/", async (req, res) => {
  res.json(await Post.find({ author: req.params.userId }));
});

posts.get("/:postId", async (req, res) => {
  const post = await Post.findOne({ _id: req.params.postId, author: req.params.userId });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

app.use("/api/users/:userId/posts", posts);
```

Keep nesting shallow. Two levels is usually plenty. Instead of `/api/users/1/posts/2/comments/3/likes`, expose `/api/comments/3/likes`: a comment's id already tells you which post and user it belongs to.

## Route order matters

Express checks routes **in the order you register them** and runs the first match. That bites when a static route looks like a dynamic one:

```js
// Wrong: "me" is captured as :id, so this handler never runs
app.get("/api/users/:id", getUser);
app.get("/api/users/me", getCurrentUser);

// Right: specific routes first, patterns after
app.get("/api/users/me", getCurrentUser);
app.get("/api/users/:id", getUser);
```

Rule of thumb: **static before dynamic, specific before general, catch-all last.**

## What happens to one request

Putting it together, this is the journey of `GET /api/books/42?fields=title` through an Express app:

1. **Arrive**: Node parses the raw HTTP request into `req`.
2. **Global middleware**: logging, `express.json()`, CORS and auth run for every request.
3. **Match**: the router walks its table and finds `GET /api/books/:id`.
4. **Extract**: `req.params.id = "42"`, `req.query.fields = "title"`.
5. **Handle**: your handler validates, queries the database and builds a result.
6. **Respond**: `res.json(book)` serializes it and sends status 200.

If no route matches at step 3, the request falls through to your 404 handler. If anything throws at step 5, Express passes the error to your error-handling middleware. The [Express note](/notes/express-routing-middleware) covers middleware and error handling in detail.

## Versioning and deprecation

APIs change. Suppose your app shows prices as rupees, so v1 of the products endpoint returns `"price": 499`. Later you add other currencies and need `"price": { "amount": 49900, "currency": "INR" }` (amount in paise). If you change the existing route, every installed copy of the old app breaks the moment you deploy.

**Versioning** lets both shapes live side by side:

| Route | Response |
| --- | --- |
| `GET /api/v1/products` | `{ "id": 7, "name": "Thali", "price": 499 }` |
| `GET /api/v2/products` | `{ "id": 7, "name": "Thali", "price": { "amount": 49900, "currency": "INR" } }` |

```js
const v1 = express.Router();
v1.get("/products", (req, res) => {
  res.json(products.map(({ id, name, pricePaise }) => ({ id, name, price: pricePaise / 100 })));
});

const v2 = express.Router();
v2.get("/products", (req, res) => {
  res.json(products.map(({ id, name, pricePaise }) => ({ id, name, price: { amount: pricePaise, currency: "INR" } })));
});

app.use("/api/v1", v1);
app.use("/api/v2", v2);
```

Then you **deprecate** v1: announce a date it will stop working, give clients time to move, and only then delete it. You can tell clients in the response itself:

```js
v1.use((req, res, next) => {
  res.set("Sunset", "Sun, 31 Jan 2027 23:59:59 GMT");               // when v1 goes away
  res.set("Link", '</api/v2/products>; rel="successor-version"');   // where to go instead
  next();
});
```

Putting the version in the path is the most common approach because it is visible and easy to route. Some APIs put it in a header (`Accept: application/vnd.foodapp.v2+json`) or a query parameter (`?version=2`) instead. Pick one style and use it everywhere.

Only bump the version for **breaking** changes: removing or renaming a field, or changing its type. Adding a new optional field doesn't break anyone, so it doesn't need v2.

## Catch-all routes: a clear 404

What should happen when someone requests `/api/v3/products` and no route exists? Without a catch-all, Express sends a small HTML page saying `Cannot GET /api/v3/products`. A JSON API should answer in JSON, so add a handler **after all other routes**:

```js
// ...all your routes above...

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});
```

It must be last. Registered first, it would swallow every request before your real routes got a chance.

Two related points:

- Express 5 changed wildcard syntax. A bare `*` no longer works in a path; wildcards need a name, like `app.all("/*splat", ...)`. The `app.use` version above needs no wildcard at all.
- If the path exists but the method doesn't (say, `PATCH /api/books` when only `GET` and `POST` exist), the precise status is **405 Method Not Allowed** with an `Allow: GET, POST` header. Many APIs just return 404; 405 is more helpful.

## Build a tiny router yourself

Frameworks make routing look like magic. It isn't. Here is a working router in about 40 lines, using only Node's built-in `http` module:

```js
import http from "node:http";

class Router {
  #routes = [];

  add(method, pattern, handler) {
    const parts = pattern.split("/").filter(Boolean);   // "/api/books/:id" → ["api", "books", ":id"]
    this.#routes.push({ method, parts, handler });
  }

  get(pattern, handler) { this.add("GET", pattern, handler); }
  post(pattern, handler) { this.add("POST", pattern, handler); }

  // Find the first route whose method and segments match. Returns the handler and path params.
  match(method, pathname) {
    const segments = pathname.split("/").filter(Boolean);
    for (const route of this.#routes) {
      if (route.method !== method || route.parts.length !== segments.length) continue;
      const params = {};
      const matched = route.parts.every((part, i) => {
        if (part.startsWith(":")) {
          params[part.slice(1)] = decodeURIComponent(segments[i]);
          return true;
        }
        return part === segments[i];
      });
      if (matched) return { handler: route.handler, params };
    }
    return null;
  }

  handle(req, res) {
    const url = new URL(req.url, "http://localhost");
    const found = this.match(req.method, url.pathname);
    if (!found) return send(res, 404, { error: "Route not found" });   // the catch-all
    req.params = found.params;
    req.query = Object.fromEntries(url.searchParams);
    found.handler(req, res);
  }
}

const send = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

const books = [{ id: 1, title: "Clean Code" }, { id: 2, title: "Atomic Habits" }];
const router = new Router();

router.get("/api/books", (req, res) => send(res, 200, books));
router.get("/api/books/:id", (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  book ? send(res, 200, book) : send(res, 404, { error: "Book not found" });
});

http.createServer((req, res) => router.handle(req, res)).listen(3000);
```

Run it with `node router.js` and try `curl localhost:3000/api/books/2` and `curl localhost:3000/api/nothing`. Every idea from this chapter is in there: method + path as the key, static and dynamic segments, path params, query params and a 404 fallback. `#routes` is a private field, so code outside the class can't tamper with the table.

Real routers are smarter about speed. This one checks every route in a loop, which is fine for 20 routes. Fastify's router stores routes in a **radix tree** (a prefix tree), so finding a match takes roughly the same time with 10 routes or 10,000.

## Quick revision

| Term | Meaning |
| --- | --- |
| Routing | mapping method + path to a handler |
| Handler | the function that runs for a matched route |
| Static route | fixed path, no variables: `/api/books` |
| Dynamic route | path with a placeholder: `/api/books/:id` |
| Path parameter | identifies which resource; always a string |
| Query parameter | optional `key=value` after `?`: filter, sort, search, page |
| Nested route | child resource under a parent: `/users/123/posts/456` |
| Versioning | `/v1/`, `/v2/` so breaking changes don't break old clients |
| Deprecation | announcing an old version will be removed, with a deadline |
| Catch-all | last route that returns a friendly 404 |

## Interview questions

1. What is routing? Why can two routes share the same path?
2. Path parameters vs query parameters: when do you use each? Give an example.
3. Why is `req.params.id` a string, and what can go wrong if you don't convert it?
4. Why must `/users/me` be registered before `/users/:id` in Express?
5. How would you design pagination for a list endpoint? Offset vs cursor pagination.
6. How do you introduce a breaking change to a public API without breaking existing apps?
7. What is the difference between 404 and 405?
8. Where should a catch-all route go, and why?
9. How would you build a router from scratch? How do real routers make matching fast?

## Further reading

- [Express 5 routing guide](https://expressjs.com/en/guide/routing.html)
- [Express: moving to version 5](https://expressjs.com/en/guide/migrating-5.html) (path syntax changes)
- [MDN: URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [RFC 8594: the Sunset header](https://www.rfc-editor.org/rfc/rfc8594)

Next: [Chapter 03, Serialization and Deserialization](/system-design/03-serialization-and-deserialization/).
