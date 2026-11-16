---
title: Validations and Transformations
description: Check every piece of client data at the front door. Where validation lives, the 400 vs 500 story, type, syntax, semantic and cross-field checks, casting and normalising input, stripping unknown fields, and why frontend validation never replaces backend validation, with Zod and Express.
author: Bitwise School
---

Every API receives data it didn't create: a JSON body, a query string, an id in the path, headers. Some of it comes from your own app. Some comes from a buggy old app version, a curious student with Postman, or an attacker. Validation and transformation are the habits that keep all of it from reaching your business logic in a shape you didn't expect.

> **Validation** asks: *is this data exactly what my API expects?*
>
> **Transformation** asks: *how do I reshape it into what my code wants to work with?*

They aren't a library you install once. They're a set of rules you apply to every endpoint, and they serve two goals:

1. **Data integrity**: whatever reaches your service code and database has the right fields, types, ranges and meaning.
2. **Security**: untrusted input can never push your system into a state you didn't plan for.

## Everything from the client is untrusted

The front door isn't just the request body. Treat all of these as untrusted until checked:

| Input | Example | In Express |
| --- | --- | --- |
| JSON body | `{ "email": "asha@example.com" }` | `req.body` |
| Query parameters | `?page=2&limit=20` | `req.query` |
| Path parameters | the `42` in `/users/42` | `req.params` |
| Headers | `X-Request-Id`, `Accept-Language` | `req.get(...)` |
| Cookies | `sid=...` | `req.cookies` |

## Where validation lives

Most backends are organised in three layers (covered fully in [Chapter 06](/system-design/06-controllers-services-and-middlewares/)):

| Layer | Its one job |
| --- | --- |
| **Controller** (handler) | everything HTTP: read the request, validate it, call the service, pick the status code and response shape |
| **Service** | business logic: place the order, send the email, call the payment gateway |
| **Repository** | talk to the database: queries, inserts, updates |

Validation belongs **at the very start of the controller**: after the router has matched the route, and before any service method runs. In practice it's a reusable middleware that you give a **schema**, a description of what valid data looks like.

The full journey of a request:

1. The request arrives and the router matches it to a route.
2. **The validation and transformation step runs.**
3. Only if the data passed, the controller calls the service.
4. The service runs business logic and may call the repository.
5. The result travels back up and the controller sends the response.

Why there, exactly? Because bad data should be rejected while rejecting it is still **cheap**: before a database connection is used, before an email is queued, before a payment is attempted.

## Why it matters: 500 vs 400

Say `POST /api/books` expects a `title`. The `books` table has `title TEXT NOT NULL`. A client sends `{ "title": null }`.

Without validation, the `null` flows through the controller, the service and the repository into an `INSERT`. Postgres refuses it (`null value in column "title" violates not-null constraint`), the query throws, and the client gets **500 Internal Server Error**: "something broke on our side". That's wrong twice over. The *client* made the mistake, and they get nothing they can fix.

With validation, the controller catches it instantly and replies **400 Bad Request** with `"title is required"`. The database is never touched.

![A bad request reaching the database and failing with 500, compared with the same request rejected by validation with a clear 400](/images/system-design/validation-gate.svg "Validation turns a confusing 500 into an actionable 400, and protects everything behind it.")

```json
{
  "error": "Invalid request",
  "details": [
    { "in": "body", "field": "title", "message": "title is required" },
    { "in": "body", "field": "price", "message": "price must be a number" }
  ]
}
```

Notice that a good error response lists **every** problem at once, so the client can fix them in one go. Many APIs use 400 for all validation failures; some use **422** when the JSON is fine but the values break your rules (as in [Chapter 03](/system-design/03-serialization-and-deserialization/)). Pick one convention and use it everywhere.

## How a field is checked, step by step

A good validator checks each field in layers. Each layer only runs if the one before it passed, so the error message is always about the *first* real problem:

1. **Exists?** Is `name` there at all? If not: `name is required`.
2. **Right type?** It's there, but is it a string, or did the client send a number or an array? If not: `name must be a string`.
3. **Constraints?** It's a string, but is it 2 to 100 characters long? If not: a message about the length.

In Node.js, **Zod** is the most popular way to write these rules. You describe the shape once, and `safeParse` checks it and returns either clean data or a list of problems:

```js
import { z } from "zod";

const CreateBook = z.object({
  title: z
    .string({ error: (issue) => (issue.input === undefined ? "title is required" : "title must be a string") })
    .trim()
    .min(2, "title must be at least 2 characters")
    .max(100, "title must be at most 100 characters"),
  price: z.number({ error: "price must be a number" }).positive("price must be more than 0"),
});

const result = CreateBook.safeParse({ title: "  Clean Code ", price: 499 });
// result.success === true, result.data === { title: "Clean Code", price: 499 }
```

Other ecosystems have the same idea: Pydantic in Python, `go-playground/validator` struct tags in Go, Bean Validation annotations in Java.

### A reusable validation middleware

```js
// validate({ params, query, body }) checks each part of the request against its schema
export const validate = (schemas) => (req, res, next) => {
  const details = [];
  req.valid = {};

  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (result.success) {
      req.valid[part] = result.data;   // the cleaned, transformed data
    } else {
      for (const issue of result.error.issues) {
        details.push({ in: part, field: issue.path.join("."), message: issue.message });
      }
    }
  }

  if (details.length > 0) return res.status(400).json({ error: "Invalid request", details });
  next();
};

app.post("/api/books", validate({ body: CreateBook }), async (req, res) => {
  const book = await bookService.create(req.valid.body);   // only clean data goes further
  res.status(201).json(book);
});
```

The cleaned data goes into `req.valid` instead of overwriting `req.query`, because in Express 5 `req.query` is a read-only getter.

## Four kinds of validation

These aren't an official list, but they cover almost everything you'll meet. For each field, ask yourself: *how strict and how specific do I need to be?*

### 1. Type validation

Is the value the right **type**: string, number, boolean, array, object? It applies inside arrays and nested objects too: if `tags` must be an array of strings, `["veg", 42]` fails on element `1`.

```js
const CreateDish = z.object({
  name: z.string(),
  price: z.number(),
  isVeg: z.boolean(),
  tags: z.array(z.string()),
  nutrition: z.object({ calories: z.number().int(), protein: z.number() }),
});
```

### 2. Syntactic validation

The type is right (it's a string), but it must follow a **format**:

- **Email**: a local part, `@`, a domain and a top-level domain.
- **Phone**: E.164 format, a `+`, country code and number, like `+919876543210`.
- **Date**: `YYYY-MM-DD`.
- **Indian PIN code**: six digits, not starting with 0.

```js
const Address = z.object({
  email: z.email("enter a valid email"),
  phone: z.e164("phone must look like +919876543210"),
  dateOfBirth: z.iso.date("date must be YYYY-MM-DD"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "pincode must be 6 digits"),
});
```

A side benefit: a client that sends an empty body gets back a list of every required field and its expected format. When docs are missing or outdated, good validation errors act as live documentation.

### 3. Semantic validation

Type and format are fine, but does the value **make sense in the real world**?

- A date of birth can't be in the future.
- An age of 430 is a valid number, but not a valid age.
- A delivery slot must be in the future, not yesterday.

```js
const Profile = z.object({
  dateOfBirth: z.iso.date().refine((d) => new Date(d) <= new Date(), "date of birth can't be in the future"),
  age: z.number().int().min(13, "you must be at least 13").max(120, "enter a real age"),
});
```

Some meaning checks need the database: "is this email already registered?", "is this item in stock?". Those belong in the **service layer**, which owns business rules and data access. Keep the front-door schema to checks that need only the request itself.

### 4. Cross-field (dependent) validation

One field's rules depend on **another field**:

- `confirmPassword` must equal `password`.
- If `paymentMode` is `"upi"`, then `upiId` is required.
- If `isBusinessOrder` is true, a `gstin` is required.
- `endDate` must be after `startDate`.

```js
const Signup = z
  .object({
    email: z.email(),
    password: z.string().min(8, "password must be at least 8 characters"),
    confirmPassword: z.string(),
    isBusinessOrder: z.boolean().default(false),
    gstin: z.string().length(15, "GSTIN must be 15 characters").optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((d) => !d.isBusinessOrder || d.gstin, {
    error: "gstin is required for business orders",
    path: ["gstin"],
  });
```

The `path` puts the error on the right field, so a form can show it in the right place.

## Transformation: casting

Take `GET /api/bookmarks?page=2&limit=20`. The rules: `page` is a number from 1 to 500, `limit` a number from 1 to 100.

There's a catch: **query parameters are always strings.** `page` arrives as `"2"`, not `2`. A schema that demands a number would reject a perfectly correct request. Converting is the server's job, not the client's. Converting one type into another is called **casting** (or coercion), and here it has to happen **before** the number checks:

```js
const Pagination = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

app.get("/api/bookmarks", validate({ query: Pagination }), async (req, res) => {
  const { page, limit } = req.valid.query;   // real numbers now: 2 and 20
  res.json(await bookmarkService.list(req.user.id, { page, limit }));
});
```

Path parameters are strings too: `z.object({ id: z.coerce.number().int().positive() })` turns `/users/42` into the number `42` and rejects `/users/abc`.

Be careful with booleans: `z.coerce.boolean()` turns *any* non-empty string into `true`, including `"false"`. For flags in a query string, accept the exact strings instead: `z.enum(["true", "false"]).transform((v) => v === "true")`.

## Transformation: normalising

After validation, transformations tidy up the data so your service code and database always see one consistent form:

| Field | Client sent | Stored as |
| --- | --- | --- |
| email | `"  Asha.K@Gmail.COM "` | `"asha.k@gmail.com"` |
| phone | `"98765 43210"` | `"+919876543210"` |
| name | `"  asha   kumari "` | `"asha kumari"` |
| city | missing | `"Delhi"` (a default) |

```js
const Customer = z.object({
  name: z.string().trim().min(2).transform((s) => s.replace(/\s+/g, " ")),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, ""))                           // drop spaces and dashes
    .transform((s) => (/^[6-9]\d{9}$/.test(s) ? `+91${s}` : s))         // add +91 to a 10-digit Indian mobile
    .pipe(z.e164("enter a valid phone number")),
  city: z.string().default("Delhi"),
});
```

Normalising matters more than it looks. If one user signs up as `Asha@Gmail.com` and later logs in as `asha@gmail.com`, an un-normalised database sees two different people.

### Strip fields you didn't ask for

Zod object schemas **drop unknown keys** by default. That quietly blocks a classic attack called **mass assignment**: a user signs up with `{ "email": "...", "password": "...", "role": "admin" }`, and careless code passes the whole body to `User.create(req.body)`. With a schema that doesn't list `role`, the field is removed before it ever reaches your model. Use `.strict()` if you'd rather reject unknown keys with an error.

## One pipeline, one place

Keep every input rule for an endpoint, both the checks and the reshaping, in **one schema next to the route**. Anyone reading the code can see in one place what the endpoint accepts and what it does to the data. Transform before validating (casting query strings), after validating (normalising), or both, whatever the field needs.

## Frontend validation never replaces backend validation

| | Frontend validation | Backend validation |
| --- | --- | --- |
| Purpose | **user experience**: instant feedback while typing | **security and data integrity** |
| Optional? | yes, but users will love you for it | **never optional** |
| Can be skipped by | anyone with Postman, curl, an old app version or DevTools | nobody |

Your server will have many clients: the web app, the Android app, an old iOS build, a partner integration, someone testing with Postman. Only the backend check is guaranteed to run for all of them. So design server-side validation to be as strict as possible **without assuming anything about the client**.

When both are wired up, they work together. The form shows "that doesn't look like an email" before any request is sent; once it's fixed, the request goes out and the server validates again.

A nice trick with Zod: since it runs in the browser too, you can put schemas in a shared package and use the same `Signup` schema in the React form (through `@hookform/resolvers/zod`) and in the Express route. Rules can't drift apart.

## Putting it together

```js
import { z } from "zod";

const Params = z.object({ restaurantId: z.coerce.number().int().positive() });

const CreateOrder = z
  .object({
    items: z
      .array(z.object({ dishId: z.coerce.number().int().positive(), quantity: z.number().int().min(1).max(20) }))
      .min(1, "order at least one dish"),
    paymentMode: z.enum(["upi", "card", "cod"]),
    upiId: z.string().regex(/^[\w.-]+@[\w]+$/, "enter a valid UPI id").optional(),
    deliverAt: z.iso.datetime().refine((t) => new Date(t) > new Date(), "delivery time must be in the future"),
    note: z.string().trim().max(200).optional(),
  })
  .refine((o) => o.paymentMode !== "upi" || o.upiId, { error: "upiId is required for UPI", path: ["upiId"] });

// Controller: HTTP in, validated data to the service, HTTP out
app.post(
  "/api/restaurants/:restaurantId/orders",
  requireAuth,
  validate({ params: Params, body: CreateOrder }),
  async (req, res) => {
    const order = await orderService.place(req.user.id, req.valid.params.restaurantId, req.valid.body);
    res.status(201).json(order);
  }
);
```

The service receives typed, normalised, safe data and can focus on business rules: is the restaurant open, are the dishes available, what's the total. It never has to wonder whether `quantity` is secretly the string `"2"`.

## Quick revision

| Idea | One line |
| --- | --- |
| Validation | is the data exactly what the API expects? |
| Transformation | reshape it into what the code wants |
| Where | at the start of the controller, after routing, before any business logic |
| Why | integrity and security; return a clear 400 instead of a confusing 500 |
| Order of checks | exists → type → constraints |
| Four kinds | type, syntactic (format), semantic (makes sense), cross-field |
| Casting | query and path values are strings; coerce them before number checks |
| Normalising | trim, lowercase emails, standard phone format, defaults |
| Unknown fields | strip or reject them to block mass assignment |
| Frontend vs backend | frontend for UX, backend for security; always both |

## Interview questions

1. What's the difference between validation and transformation? Where in the request lifecycle do they run?
2. Why is a 400 better than a 500 for bad input? Who is at fault in each case?
3. Name four kinds of validation with an example of each.
4. Why do query parameters fail a "must be a number" check, and how do you fix it?
5. Which checks belong in the request schema and which belong in the service layer?
6. What is mass assignment and how does schema validation prevent it?
7. Why isn't frontend validation enough? Why add it at all, then?
8. Why should you normalise emails before saving them?
9. How would you design a reusable validation middleware for Express?

## Further reading

- [Zod documentation](https://zod.dev/)
- [OWASP: Input validation cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP: Mass assignment cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)

Next: [Chapter 06, Controllers, Services and Middlewares](/system-design/06-controllers-services-and-middlewares/).
