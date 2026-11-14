---
title: "HTTP and CORS: How Clients and Servers Talk"
description: Statelessness, HTTP versions, request and response messages, headers, methods and idempotency, cookies and JWTs, CORS and preflight requests, status codes, redirects, caching, proxies, WebSockets and HTTPS, with Node.js and Express code.
author: Bitwise School
---

Every time you open an app, refresh a feed or pay with UPI, your phone sends HTTP requests and gets HTTP responses back. Almost all backend work happens on top of this one protocol, so understanding it well pays off in every job interview and every bug you will ever debug.

> **HTTP (HyperText Transfer Protocol)** is the set of rules a client and a server follow to exchange messages: the client sends a **request**, the server sends back a **response**.

This chapter is long because HTTP touches everything. Use the "On this page" list to jump around, and come back to sections as you need them. Code examples use **Node.js with Express 5**.

## Where HTTP sits

In the layered model of networking (see [computer networks](/notes/computer-networks)), HTTP lives at the top, in the **application layer**. It defines what a message *means*: "give me order 981", "here is a new user". It does not care how the bytes physically travel.

That job belongs to the layers underneath. HTTP needs exactly one thing from them: **reliable, in-order delivery**. If half a header went missing, the message would be garbage. So HTTP/1.1 and HTTP/2 run on **TCP**, which numbers every byte, re-sends anything lost and hands data over in order. HTTP/3 runs on **QUIC**, which builds the same guarantees on top of UDP (more on that below).

Before the first HTTP byte flows, TCP does its 3-way handshake (SYN, SYN-ACK, ACK) and, for HTTPS, TLS sets up encryption. As a backend developer you can mostly treat all of that as "a secure pipe was opened". What you design and debug is the HTTP that flows through it.

## Stateless by design

HTTP is **stateless**: the server does not remember anything about you between two requests. Each request must carry everything needed to handle it: which resource, which action, who you are (a cookie or token), what format you want.

That sounds like a weakness. It is actually what lets big systems scale:

- **Any server can handle any request.** A load balancer can send your first request to server A and your next one to server C. Neither needs to know what happened before.
- **Servers can be added or removed freely.** During a sale, you start 20 more servers; afterwards you shut them down. No user "lives" on a particular machine.
- **Crashes lose nothing.** If a server dies mid-request, the client retries and another server answers. There was no in-memory session to lose.

![A client sends requests with a token through a load balancer to three stateless servers that share one database](/images/system-design/http-stateless.svg "Shared data lives in the database or cache, never in one server's memory.")

The cost is that the client must **prove who it is on every request**. That's what cookies, sessions and tokens are for (covered later in this chapter). They add continuity *on top of* HTTP without making the protocol itself stateful.

## The client always starts

In HTTP, the **client always sends first**: a browser, a mobile app, or another server calling your API. The server only ever answers. It cannot suddenly send you a message you didn't ask for.

That's why, for years, chat apps and live scores used **polling**: asking "anything new?" every few seconds. Today we have better tools when the server needs to push data:

- **Server-Sent Events (SSE)**: one long HTTP response that the server keeps writing to. Good for notifications, progress bars and AI chat responses that appear word by word.
- **WebSockets**: the connection is upgraded into a two-way channel where either side can send at any time. Good for chat and multiplayer games.

Both are covered later in this chapter.

## How HTTP evolved

The meaning of requests and responses has barely changed since the 90s. What changed is **how the connection is used**, each version chasing lower latency.

| Version | Year | What changed |
| --- | --- | --- |
| HTTP/0.9 | 1991 | One line: `GET /page`. The response was raw HTML. No headers, no status codes. |
| HTTP/1.0 | 1996 | Headers, status codes, `POST`, content types. But a **new TCP connection for every request**. |
| HTTP/1.1 | 1997 | Connections stay open and get reused (**keep-alive**), the `Host` header is required, chunked transfer, better caching. |
| HTTP/2 | 2015 | **Binary framing**, **multiplexing** (many requests at once on one connection), header compression (HPACK). |
| HTTP/3 | 2022 | Runs on **QUIC over UDP** instead of TCP. Faster setup, no TCP head-of-line blocking. |

The problems each version fixed:

- **1.0 was wasteful.** A web page needs dozens of files. Opening a fresh TCP connection for each one meant paying a handshake round trip every time. **1.1** kept one connection open for many requests.
- **The `Host` header** (required since 1.1) says which domain the request is for. That lets one server and one IP address host hundreds of websites, which is how shared hosting, Nginx virtual hosts and cloud load balancers work.
- **Head-of-line blocking.** On an HTTP/1.1 connection, responses come back in order. One slow response blocks everything queued behind it. Browsers worked around it by opening about 6 connections per site. **HTTP/2** splits every request and response into small frames tagged with a stream id, so many streams interleave on one connection and a slow response no longer blocks the rest.
- **TCP's own blocking.** HTTP/2 still runs on TCP, which delivers bytes strictly in order. Lose one packet and every stream on that connection waits for the re-send. **HTTP/3's QUIC** tracks each stream separately, so a lost packet only delays its own stream. QUIC also combines the connection and TLS handshakes, so a secure connection starts in one round trip, or zero when resuming.

Through all of this, your mental model stays the same: **open a connection, send requests, get responses**. The versions only improve the plumbing.

## Anatomy of a request and a response

An HTTP/1.1 message is plain text with four parts:

1. a **start line** (the request line or the status line),
2. **headers**, one `Name: value` per line,
3. a **blank line**,
4. an optional **body**.

![An HTTP request and response, each with a start line, headers, a blank line and a JSON body](/images/system-design/http-message-anatomy.svg "The blank line is how the parser knows the headers have ended.")

Here is a request to place a food order:

```text
POST /api/orders HTTP/1.1
Host: api.foodapp.in
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Length: 29

{"itemId": 12, "quantity": 2}
```

The **request line** has three parts: the **method** (`POST`, what you want to do), the **target** (`/api/orders`, plus any `?query`), and the **version**. `Content-Length` is more important than it looks: when many messages travel back to back on one connection, it tells the receiver exactly how many body bytes to read before the next message starts.

And the response:

```text
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/orders/981
Content-Length: 31

{"id": 981, "status": "placed"}
```

The **status line** has the version, a **status code** (`201`) and a reason phrase (`Created`). Programs must act on the number, never the text: the phrase is only for humans and HTTP/2 doesn't send it at all.

HTTP/2 and HTTP/3 send the same information as binary frames instead of text, but the parts (method, path, headers, body, status) are identical. DevTools shows them the same way.

### Content-Type and MIME types

One protocol carries JSON, HTML, images, PDFs and video. The `Content-Type` header says which one the body is, using a **MIME type** of the form `type/subtype`, sometimes with parameters:

| MIME type | Used for |
| --- | --- |
| `application/json` | API requests and responses |
| `application/x-www-form-urlencoded` | plain HTML form posts: `name=Asha&city=Delhi` |
| `multipart/form-data` | forms with file uploads |
| `text/html; charset=utf-8` | web pages |
| `text/plain` | plain text |
| `image/png`, `image/webp`, `video/mp4` | media |
| `application/octet-stream` | "just bytes"; browsers usually download it |
| `text/event-stream` | Server-Sent Events |

Get it wrong and things break quietly: send JSON labelled `text/plain` and the server's JSON parser skips it. A server that refuses a body type should answer **415 Unsupported Media Type**.

### Headers go first, always

On the wire, the status line and headers are sent **before** the body. Once the body starts flowing, it's too late to add a header. Express enforces this with a famous error:

```js
app.get("/api/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });   // forgot "return"...
  }
  res.json(user);   // ...so this runs too: Error [ERR_HTTP_HEADERS_SENT]
});
```

The fix is `return res.status(404).json(...)`. If you see `Cannot set headers after they are sent to the client`, look for a handler that responds twice.

## Headers: metadata on the outside

Headers are `key: value` pairs about the message. Why keep them separate from the body?

Think of a courier parcel. The address and phone number are written on the outside, so every sorting centre can route it without opening the box. HTTP headers work the same way: proxies, CDNs, load balancers and browsers can read them and act (route, cache, compress, block) without parsing the body.

Keeping metadata separate also makes HTTP **extensible**. New features arrive as new headers (security policies, tracing ids, client hints) without changing the protocol. Software that doesn't know a header simply ignores it. Header names are **case-insensitive**: `content-type` and `Content-Type` are the same header.

### Kinds of headers

| Kind | Who sends it | Examples |
| --- | --- | --- |
| Request headers | client: who it is, what it wants | `Host`, `User-Agent`, `Accept`, `Authorization`, `Cookie` |
| Response headers | server: about the response and the server | `Location`, `Set-Cookie`, `Retry-After`, `Allow` |
| Representation headers | either: describe the body | `Content-Type`, `Content-Length`, `Content-Encoding`, `ETag` |
| General / caching headers | either: about the message or how to cache it | `Date`, `Connection`, `Cache-Control` |
| Security headers | server: tell the browser what to block | `Strict-Transport-Security`, `Content-Security-Policy` |

### Security headers

Each security header tells the browser to refuse something an attacker could abuse:

| Header | Blocks |
| --- | --- |
| `Strict-Transport-Security: max-age=31536000` (HSTS) | **downgrade attacks**: the browser will only use HTTPS for your site for a year, even if someone types `http://` |
| `Content-Security-Policy: default-src 'self'` (CSP) | **XSS**: scripts from sources not on your list are not executed, even if an attacker manages to inject a `<script>` tag |
| `X-Frame-Options: DENY` | **clickjacking**: your page can't be loaded invisibly inside an `<iframe>` on another site |
| `X-Content-Type-Options: nosniff` | **MIME sniffing**: the browser won't guess that an "image" upload is really a script |
| `Set-Cookie: ...; HttpOnly; Secure` | **cookie theft**: JavaScript can't read the cookie, and it's only sent over HTTPS |

These belong on every response, so set them once in middleware. In Express, the `helmet` package sets sensible defaults in one line:

```js
import helmet from "helmet";

app.use(helmet());   // CSP, HSTS, nosniff, frame protection and more
```

## HTTP methods

The method says **what kind of action** you want. HTTP defines nine. Three properties decide how each one behaves:

- **Safe**: it only reads; it must not change anything on the server. Search engine crawlers and link previews call safe methods freely, so a `GET` that deletes data is a disaster waiting to happen.
- **Idempotent**: sending it once or five times leaves the server in the **same final state**. This is what makes a request safe to **retry** after a timeout. It is about server state, not the response: deleting order 981 twice returns 204 then 404, but either way the order is gone, so `DELETE` is idempotent.
- **Cacheable**: the response may be stored and reused for a later identical request.

Every safe method is also idempotent (if nothing changes, repeating it changes nothing). The reverse isn't true: `PUT` and `DELETE` change data, but repeating them doesn't change it *further*.

| Method | Safe | Idempotent | Cacheable | Has a body | Typical success code |
| --- | --- | --- | --- | --- | --- |
| `GET` | yes | yes | yes | no | 200 |
| `HEAD` | yes | yes | yes | no | 200 (headers only) |
| `OPTIONS` | yes | yes | no | no | 204 |
| `POST` | no | **no** | rarely | yes | 201 or 202 |
| `PUT` | no | yes | no | yes | 200, 201 or 204 |
| `PATCH` | no | not guaranteed | rarely | yes | 200 or 204 |
| `DELETE` | no | yes | no | optional | 204 |
| `CONNECT` | no | no | no | no | 200 |
| `TRACE` | yes | yes | no | no | 200 |

**GET** reads a resource. It has no body, so filters, sorting and pages go in the query string: `/api/orders?status=delivered&page=2`. Because it is safe and cacheable, browsers and CDNs can store GET responses, which is the biggest performance lever on the web. Return 200 with the data, 404 if it doesn't exist, or 304 if the client's cached copy is still valid.

**HEAD** is a GET without the body. The headers are the same, so you can check whether a file exists, how big it is or whether it changed, without downloading it. Express answers HEAD automatically for every GET route.

**POST** creates something or triggers an action: place an order, send an OTP, start a report. It is **not idempotent**: two identical POSTs create two orders. That's how double-clicking "Pay" can charge someone twice. Return **201 Created** with a `Location` header pointing at the new resource, or **202 Accepted** if the work will finish later.

**PUT** replaces the resource at a URL with the body you send. The client sends the **whole** thing. Sending the same PUT ten times leaves the same result, so it is idempotent and safe to retry.

**PATCH** changes only some fields: `{"status": "cancelled"}`. It is more efficient than PUT and won't accidentally blank out fields you didn't send. It is not guaranteed idempotent: "set status to cancelled" is, but "add 1 to quantity" is not.

**DELETE** removes the resource. Return 204 No Content (or 200 with a body).

**OPTIONS** asks "what am I allowed to do here?". You'll rarely call it yourself, but browsers send it constantly as the **CORS preflight**.

**CONNECT** asks a proxy to open a raw tunnel, which is how HTTPS passes through corporate proxies. **TRACE** echoes the request back for debugging; it is disabled almost everywhere because it leaked sensitive headers. You won't use either in application code.

### PUT vs POST vs PATCH

| You want to... | Use | Example |
| --- | --- | --- |
| create something and let the **server choose the id** | `POST` | `POST /api/orders` → `Location: /api/orders/981` |
| create or fully replace something at a URL **you already know** | `PUT` | `PUT /api/users/42/address` |
| change **a few fields** | `PATCH` | `PATCH /api/orders/981` with `{"status": "cancelled"}` |

In Express:

```js
app.get("/api/orders/:id", getOrder);
app.post("/api/orders", createOrder);
app.put("/api/users/:id/address", replaceAddress);
app.patch("/api/orders/:id", updateOrder);
app.delete("/api/orders/:id", deleteOrder);
```

## Idempotency keys: making POST safe to retry

Networks fail all the time. A phone switches from Wi-Fi to 4G, a request times out, a user taps "Pay" twice. The hard case is the **unknown outcome**: the client sent a POST, the connection dropped, and it has no idea whether the server processed it. Retry and you might charge twice. Don't retry and the payment might be lost.

The standard fix is an **idempotency key**. The client generates a unique id for the *operation* (not for each attempt) and sends it in a header. The server remembers the result for each key. If the same key arrives again, it returns the saved result instead of doing the work again. Stripe's payment API made this pattern popular, and the `Idempotency-Key` header is now being standardised by the IETF.

![A payment request is retried with the same idempotency key and the server returns the stored result instead of charging twice](/images/system-design/idempotency-key.svg "The retry gets the same answer as the first attempt, and the card is charged once.")

```js
// Client: one key per payment attempt, reused on every retry of that payment
const key = crypto.randomUUID();
await fetch("/api/payments", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Idempotency-Key": key },
  body: JSON.stringify({ orderId: 981, amount: 49900 }),
});
```

```js
// Server: in production, use Redis or a database table instead of a Map
const results = new Map();

app.post("/api/payments", async (req, res) => {
  const key = req.get("Idempotency-Key");
  if (!key) return res.status(400).json({ error: "Idempotency-Key header is required" });

  const saved = results.get(key);
  if (saved) return res.status(saved.status).json(saved.body);   // a retry: replay the answer

  const payment = await chargeCard(req.body);                     // the work that must happen once
  const body = { id: payment.id, status: "paid" };
  results.set(key, { status: 201, body });                         // save before replying
  res.status(201).json(body);
});
```

To make this production-ready:

- **Store keys somewhere shared and durable** (Redis, a DB table), because the retry may land on a different server, or after a restart.
- **Expire keys**, for example after 24 hours, so the store doesn't grow forever.
- **Save the result before responding**, so a crash right after charging doesn't lose the record.
- **Lock the key while the first request is still running** (for example with Redis `SET key value NX`), so two retries that arrive at the same moment don't both charge.

## Cookies, sessions and tokens

HTTP forgets you after every request, yet apps need to know you're logged in. The answer is to send a small credential with every request. Cookies are the oldest way to do that.

### How cookies work

The mechanism is just two headers. The server sends `Set-Cookie`; the browser stores it and then **automatically** attaches it as a `Cookie` header on every later request to that site:

```text
HTTP/1.1 200 OK
Set-Cookie: sid=a3f9c2e1; HttpOnly; Secure; SameSite=Lax; Max-Age=604800

GET /api/cart HTTP/1.1
Cookie: sid=a3f9c2e1
```

That automatic sending is convenient (no frontend code needed) and also dangerous (it's what makes CSRF attacks possible). The cookie's attributes control the risk:

| Attribute | What it does |
| --- | --- |
| `HttpOnly` | JavaScript can't read the cookie (`document.cookie`), so an XSS bug can't steal it |
| `Secure` | sent only over HTTPS |
| `SameSite=Strict` / `Lax` / `None` | whether the cookie is sent on requests started by **other sites**. `Lax` (the default in modern browsers) blocks it on cross-site form posts and fetches, the main CSRF defence. `None` requires `Secure` |
| `Max-Age` / `Expires` | how long it lives; without them it's deleted when the browser closes |
| `Domain` / `Path` | which hosts and paths receive it |

In Express:

```js
res.cookie("sid", sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days, in milliseconds
});
```

### Sessions vs tokens

There are two common ways to use that credential. The difference is **where your login state lives**.

| | Session (stateful) | Token / JWT (stateless) |
| --- | --- | --- |
| What the client holds | a random session id in a cookie | a signed token with your user id and expiry inside |
| What the server stores | the session data (in Redis or a DB) | nothing per login |
| How it's sent | `Cookie` header, automatically | usually `Authorization: Bearer <token>` |
| Checking a request | look up the session id | verify the token's signature locally |
| Many servers | all need the shared session store | any server can verify; just share the secret key |
| Logging someone out | delete the session: instant | hard: the token works until it expires, so use short expiry + refresh tokens |

A **JWT** has three parts separated by dots: `header.payload.signature`. The header and payload are only **Base64URL-encoded, not encrypted**: anyone can decode them and read the claims. So why can't a user change `"role": "user"` to `"role": "admin"`?

Because of the signature. The server computed it from the header and payload using a secret key only it knows. When a modified token comes back, the server recomputes the signature over the new payload, gets a different value, and rejects the request with 401. Without the secret, forging a valid signature is practically impossible. Never put passwords or other secrets in a JWT payload, since anyone holding the token can read it.

```js
import jwt from "jsonwebtoken";

function requireAuth(req, res, next) {
  const header = req.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).set("WWW-Authenticate", "Bearer").json({ error: "Please log in" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

The [authentication note](/notes/authentication) covers password hashing, sessions, JWTs, refresh tokens and Passport step by step.

## CORS and the same-origin policy

### The same-origin policy

Browsers enforce a rule called the **same-origin policy**: JavaScript on one origin can't read responses from another origin. An **origin** is **scheme + host + port**:

| Page | Request to | Same origin? |
| --- | --- | --- |
| `https://foodapp.in` | `https://foodapp.in/api/menu` | yes (the path doesn't matter) |
| `https://foodapp.in` | `http://foodapp.in/api/menu` | no: different scheme |
| `https://foodapp.in` | `https://api.foodapp.in/menu` | no: different host (a subdomain counts) |
| `https://foodapp.in` | `https://foodapp.in:8443/menu` | no: different port |
| `http://localhost:5173` (Vite) | `http://localhost:3000` (Express) | no: different port, the classic dev setup |

Why such a strict rule? Because browsers attach your cookies automatically. Without it, any website you visit could run JavaScript that calls your bank's API, with your logged-in cookies attached, and read your balance.

**CORS (Cross-Origin Resource Sharing)** is how a server says "it's fine, let this other origin read my responses". The server lists who is allowed in response headers, and the **browser** enforces it.

That last part explains the most confusing thing about CORS errors: **your server log shows 200 OK, but the browser console shows a CORS error**. The request did reach the server and the server did respond. The browser then saw no permission header and refused to hand the response to your JavaScript. It also explains why Postman, `curl` and mobile apps never hit CORS errors: there's no browser enforcing the rule.

### Simple requests

For low-risk requests, the browser sends the request straight away and checks permission on the way back. A request is "simple" when it is `GET`, `HEAD` or `POST`, uses only basic headers, and its `Content-Type` (if any) is `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`.

1. The browser adds `Origin: https://foodapp.in` and sends the request.
2. If the server allows that origin, it includes `Access-Control-Allow-Origin: https://foodapp.in` (or `*`) in the response.
3. Header present and matching: your JavaScript gets the response. Missing: the browser blocks it and logs a CORS error.

### Preflighted requests

For anything riskier, the browser first sends an `OPTIONS` request asking permission. This **preflight** happens when any of these is true:

- the method is not GET, HEAD or POST (so every `PUT`, `PATCH` and `DELETE`),
- the request has a non-basic header, such as `Authorization` or any custom `X-` header,
- the `Content-Type` is something else, **including `application/json`**.

A typical API call (JSON body plus an `Authorization` header) ticks at least two of those boxes. That's why DevTools shows an `OPTIONS` request before almost every API call. It's not a bug.

![The browser sends an OPTIONS preflight, the API approves the origin and method, then the browser sends the real PUT request](/images/system-design/cors-preflight.svg "The preflight has no body. If the server doesn't approve it, the real request is never sent.")

The server's answer to the preflight lists what's allowed: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and `Access-Control-Max-Age` (how long the browser may cache this approval and skip future preflights; Chrome caps it at 2 hours).

**Cookies need extra care.** If the frontend sends cookies (`fetch(url, { credentials: "include" })`), the server must also send `Access-Control-Allow-Credentials: true`, and `Access-Control-Allow-Origin` **can't be `*`**: it must name the exact origin. This stops a server from accidentally sharing logged-in data with every website.

### CORS in Express

The `cors` package handles both flows, including answering preflights:

```js
import cors from "cors";

app.use(
  cors({
    origin: ["https://foodapp.in", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,   // allow cookies; the origin list above must be explicit
    maxAge: 7200,        // cache preflight approval for 2 hours
  })
);
```

Here is roughly what it does for you, written by hand:

```js
const allowedOrigins = new Set(["https://foodapp.in", "http://localhost:5173"]);

app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (origin && allowedOrigins.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.append("Vary", "Origin");   // the response differs per origin, so caches must not mix them up
  }
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "7200");
    return res.sendStatus(204);
  }
  next();
});
```

During development you can avoid CORS entirely by letting Vite proxy API calls, so the browser only ever talks to one origin:

```js
// vite.config.js
export default {
  server: { proxy: { "/api": "http://localhost:3000" } },
};
```

### Does CORS protect the server?

No, and this is a favourite interview question. Anyone can call your API with `curl` or a script and ignore CORS completely. **CORS protects users, not servers.**

The danger CORS addresses is a malicious site running JavaScript *inside your browser*, where your cookies for other sites get attached automatically. CORS makes the browser ask your bank "is this origin allowed to read your response?" and block it when the answer is no. A script running outside the browser doesn't have your cookies, so the bank's authentication rejects it anyway.

Your server protects itself with **authentication, authorization, input validation, rate limiting and CSRF defences**, never with CORS. And note the limit of CORS: a malicious browser extension already runs inside your browser, so it can read pages and cookies directly. No server header can stop code that already runs on the user's device.

## Status codes

A **status code** is a three-digit verdict on the request that a program can act on without reading the body. The first digit tells you the category, and often whose fault a problem is:

| Range | Meaning | Whose problem |
| --- | --- | --- |
| 1xx | informational: keep going | n/a |
| 2xx | success | n/a |
| 3xx | redirect: look somewhere else | n/a |
| 4xx | **client error**: the request was wrong | the caller |
| 5xx | **server error**: a valid request failed | the server |

The codes you'll actually use:

| Code | Name | When to send it |
| --- | --- | --- |
| 101 | Switching Protocols | the connection is being upgraded to a WebSocket |
| 200 | OK | success, here's the data |
| 201 | Created | a resource was created; add a `Location` header |
| 202 | Accepted | the work was queued and will finish later (video processing, bulk emails) |
| 204 | No Content | success with nothing to return (DELETE, preflight) |
| 206 | Partial Content | a range request: here's the slice you asked for |
| 301 / 308 | Moved Permanently / Permanent Redirect | the URL changed for good |
| 302 / 307 | Found / Temporary Redirect | look elsewhere for now |
| 303 | See Other | after a form POST, go GET this page |
| 304 | Not Modified | your cached copy is still good |
| 400 | Bad Request | the request is malformed: broken JSON, missing required field |
| 401 | Unauthorized | not logged in, or the token is invalid |
| 403 | Forbidden | logged in, but not allowed to do this |
| 404 | Not Found | no such resource or route |
| 405 | Method Not Allowed | the path exists but not for this method; add an `Allow` header |
| 409 | Conflict | clashes with current state: email already registered |
| 412 | Precondition Failed | an `If-Match` check failed (someone else edited it first) |
| 413 | Content Too Large | the body is over your size limit |
| 415 | Unsupported Media Type | wrong `Content-Type` for this endpoint |
| 422 | Unprocessable Content | valid JSON, but the values break your rules |
| 429 | Too Many Requests | rate limit hit; add `Retry-After` |
| 500 | Internal Server Error | an unhandled exception: your bug |
| 502 | Bad Gateway | the proxy got a bad response from your app |
| 503 | Service Unavailable | overloaded or in maintenance; add `Retry-After` |
| 504 | Gateway Timeout | the proxy gave up waiting for your app |

Three pairs that interviewers love:

- **401 vs 403.** 401 means "I don't know who you are" (show the login screen). 403 means "I know exactly who you are, and you still can't do this" (show "access denied"). A logged-in student opening an admin page gets **403**.
- **400 vs 422.** 400: the server can't even parse the request (broken JSON). 422: it parsed fine, but `"quantity": -5` breaks your rules. Many APIs use 400 for both, which is acceptable; the distinction just helps clients.
- **500 vs 502/503/504.** A 500 comes from your code. 502, 503 and 504 usually come from the **proxy or load balancer in front of your app** (Nginx, a cloud load balancer) when it can't reach your app, finds it down, or times out waiting. If you see them, check whether your app is running and healthy before reading handler code.

## Redirects

A redirect is a 3xx response with a `Location` header. The browser (or your HTTP library) then requests that new URL. Redirects handle moved pages, HTTP to HTTPS upgrades, `www` to non-`www`, and the Post/Redirect/Get pattern.

The detail that matters for backends is **whether the method and body survive the redirect**:

| Code | Permanent? | Keeps method and body? | Use it for |
| --- | --- | --- | --- |
| 301 | yes | not guaranteed (a POST may become GET) | page moved forever; search engines transfer ranking |
| 302 | no | not guaranteed | temporary move |
| 303 | no | always switches to **GET** | after a form POST, show a result page |
| 307 | no | **yes** | temporary move that must keep a POST and its body |
| 308 | yes | **yes** | permanent move that must keep a POST and its body |

Why so many? Early browsers turned POST into GET (dropping the body) when they followed a 301 or 302. It went against the spec but became normal behaviour, so 307 and 308 were added to guarantee the method is kept. If a redirected form submission arrives with an empty body, you used 301/302 where you needed 307/308.

**Post/Redirect/Get** uses 303 on purpose. After a successful `POST /orders`, redirect to `GET /orders/981`. If the user refreshes, the browser reloads the GET page instead of asking "resubmit the form?" and placing a second order.

```js
app.get("/menu", (req, res) => res.redirect(301, "/restaurants/menu"));   // moved for good

app.post("/orders", async (req, res) => {
  const order = await Order.create(req.body);
  res.redirect(303, `/orders/${order.id}`);   // refresh-safe result page
});
```

`res.redirect(url)` without a code sends 302.

## Caching

Caching means keeping a copy of a response so the next request doesn't have to go all the way to the server. It saves bandwidth, makes pages load faster and cuts server load. HTTP caching has **two layers**:

1. **Freshness**: "Is my copy still fresh enough to use without asking?" If yes, there is no network request at all.
2. **Validation**: "My copy is old. Has it changed?" A cheap check that returns either "no, keep using yours" or the new content.

Caches live in several places: the **browser** (private, one user) and **shared caches** like CDNs and reverse proxies (serving many users).

### Freshness: Cache-Control

The server says how long a response stays fresh, and who may store it:

| Directive | Meaning |
| --- | --- |
| `max-age=3600` | fresh for one hour; reuse it without asking |
| `public` | shared caches (CDNs) may store it |
| `private` | only the user's own browser may store it; use for anything personal |
| `no-cache` | you **may** store it, but must check with the server before each use ("always revalidate", not "don't cache") |
| `no-store` | never store it anywhere: bank statements, OTP pages |
| `immutable` | it will never change, don't even revalidate; for files with a hash in the name like `app.4f9a2c.js` |

### Validation: ETag and 304

When freshness runs out, the browser doesn't blindly download everything again. The first response included an **ETag** (a fingerprint of the content) and maybe a `Last-Modified` date. The browser sends them back, and if nothing changed the server replies **304 Not Modified** with an empty body.

![A browser caches a response for 60 seconds, then revalidates it with If-None-Match and gets a 304 Not Modified](/images/system-design/http-cache-etag.svg "Fresh: no request at all. Stale but unchanged: a tiny 304 instead of the full body.")

A **strong** ETag (`"v7"`) means byte-for-byte identical. A **weak** one (`W/"v7"`) means "equivalent", which is enough when something small like a timestamp differs.

Express does much of this for you: `res.send` and `res.json` add a weak ETag to every response and automatically answer a matching `If-None-Match` with 304. You only add the freshness rules:

```js
// Same for every user, changes rarely: let CDNs cache it for a minute
app.get("/api/menu", (req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json(menu);
});

// Personal data: browser only, and always check it's current
app.get("/api/me/orders", requireAuth, async (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  res.json(await Order.find({ user: req.user.id }));
});

// Built frontend files have a content hash in their names, so cache them for a year
app.use(express.static("dist", { maxAge: "1y", immutable: true }));
```

One more header to remember: **`Vary`**. It tells shared caches which request headers change the response, for example `Vary: Accept-Encoding` or `Vary: Origin`. Without it, a CDN might serve a gzip-compressed response to a client that can't decompress it, or one origin's CORS headers to another origin.

## Conditional requests and optimistic locking

The same ETags solve a nastier problem: the **lost update**. Two admins open product 7 to edit it. Riya saves first. Karan, still looking at the old version, saves a minute later and silently overwrites Riya's changes. No error, no warning.

**Optimistic locking** prevents this. Nobody locks the record while editing. Instead, each save says "only apply this if the record is still the version I read":

| Header | Proceed only if... | Used for |
| --- | --- | --- |
| `If-None-Match` | the ETag does **not** match (it changed) | caching: 304 when unchanged |
| `If-Match` | the ETag **does** match (unchanged since I read it) | safe updates: 412 on conflict |
| `If-Modified-Since` | it changed after this date | caching without ETags |
| `If-Unmodified-Since` | it hasn't changed since this date | safe updates without ETags |
| `If-Range` | unchanged, otherwise send the whole thing | resuming downloads |

The flow:

1. Karan's browser loads `GET /api/products/7` and receives `ETag: "v3"`.
2. Riya saves first; the product is now `"v4"`.
3. Karan saves with `PUT /api/products/7` and `If-Match: "v3"`.
4. The server sees the current version is `"v4"`, not `"v3"`, and replies **412 Precondition Failed**. Karan's app reloads the latest version and shows him what changed.

```js
app.put("/api/products/:id", async (req, res) => {
  const match = /^"v(\d+)"$/.exec(req.get("If-Match") ?? "");
  if (!match) return res.status(428).json({ error: "Send If-Match with the ETag you loaded" });

  // Update only if the version is still the one the client saw, in one atomic step
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, version: Number(match[1]) },
    { $set: req.body, $inc: { version: 1 } },
    { new: true }
  );
  if (!product) {
    return res.status(412).json({ error: "Someone else changed this product. Reload and try again." });
  }
  res.set("ETag", `"v${product.version}"`).json(product);
});
```

(428 Precondition Required is the status for "you must send a precondition". In real code, also validate `req.body` before passing it to `$set`.)

Why not lock the row while someone edits? Because people leave edit forms open for minutes or go for chai, blocking everyone else. Optimistic locking holds nothing and only catches the rare real conflict at the moment of saving. Collaborative tools, wikis and well-designed REST APIs all use it.

## Content negotiation and compression

One URL can have several **representations**: JSON or CSV, English or Hindi, compressed or not. In **content negotiation**, the client lists what it prefers in `Accept-*` headers and the server picks the best match, saying what it chose in the matching `Content-*` header:

| Client asks with | For | Server answers with |
| --- | --- | --- |
| `Accept: application/json` | format | `Content-Type` |
| `Accept-Language: hi-IN, en;q=0.8` | language | `Content-Language` |
| `Accept-Encoding: gzip, br` | compression | `Content-Encoding` |

The `q` values (0 to 1) are weights: `hi-IN, en;q=0.8` means "Hindi please, English is fine too". If the server can't produce anything acceptable, the right answer is **406 Not Acceptable**. In Express, `res.format` picks a handler from the `Accept` header:

```js
app.get("/api/reports/sales", (req, res) => {
  res.format({
    "application/json": () => res.json(report),
    "text/csv": () => res.type("text/csv").send(toCsv(report)),
    default: () => res.status(406).json({ error: "Use JSON or CSV" }),
  });
});
```

**Compression** is the same negotiation for size. JSON, HTML and JavaScript are very repetitive, so gzip or Brotli often shrinks them by 70 to 90%. The server compresses only if the client listed the encoding in `Accept-Encoding`, sets `Content-Encoding: gzip`, and the browser decompresses it invisibly. Always pair it with `Vary: Accept-Encoding`. The `compression` middleware does all of that:

```js
import compression from "compression";

app.use(compression({ threshold: 1024 }));   // skip tiny responses; compressing them costs more than it saves
```

In production, Nginx or your CDN usually compresses responses before they reach users, so check before doing it twice.

## Range requests

A **range request** asks for part of a file instead of the whole thing. That's how a download resumes from 80% instead of starting over, how you skip to minute 12 of a video without downloading minutes 1 to 11, and how download managers fetch one file in parallel chunks.

1. The server advertises support with `Accept-Ranges: bytes`.
2. The client asks for a slice: `Range: bytes=0-1023` (the first KB) or `Range: bytes=1048576-` (from 1 MB to the end, what a resumed download sends).
3. The server replies **206 Partial Content** with `Content-Range: bytes 1048576-5242879/5242880` and only those bytes.
4. A range past the end of the file gets **416 Range Not Satisfiable**.
5. When resuming, the client adds `If-Range: "<etag>"`. If the file changed in the meantime, the server sends the whole new file (200) instead of a slice that wouldn't fit the old half.

You rarely write this yourself. Express's `res.sendFile` and `express.static` handle ranges, 206, 416 and `If-Range` automatically:

```js
app.get("/videos/:name", (req, res) => {
  res.sendFile(req.params.name, { root: "videos" });   // root also blocks ../ path tricks
});
```

## Keep-alive and connection timeouts

Opening a TCP connection costs a round trip, and TLS adds more. HTTP/1.1 keeps connections open by default and reuses them for many requests, so that cost is paid once. HTTP/2 goes further and runs many requests at the same time on one connection.

- In HTTP/1.1 connections are **persistent by default**. `Connection: keep-alive` is implied.
- `Connection: close` asks to close the connection after this response.
- **Pipelining** (sending several HTTP/1.1 requests without waiting for responses) was in the spec but was so buggy that browsers turned it off. HTTP/2 multiplexing replaced it.

You'll rarely touch these headers, but you will tune **timeouts** on your server. Keep idle connections too long and they pile up under load. Close them too eagerly and clients pay the handshake again and again. Timeouts also protect you from **Slowloris** attacks, where an attacker opens many connections and sends headers one byte at a time to tie them all up.

```js
const server = app.listen(3000);

server.keepAliveTimeout = 65_000;   // longer than your load balancer's idle timeout (60 s on AWS ALB)
server.headersTimeout = 66_000;     // must be greater than keepAliveTimeout
server.requestTimeout = 30_000;     // give up on requests that take longer than 30 s to arrive
```

If Node's keep-alive timeout (5 seconds by default) is shorter than the load balancer's, Node can close a connection at the exact moment the load balancer reuses it, and users see random **502** errors. Setting it a little longer is a well-known fix.

## Uploading and streaming large data

JSON is a poor fit for big binary data. Base64-encoding a file to put it inside JSON makes it about 33% bigger and forces the whole thing into memory. Which tool you use depends on the **direction**.

### Uploads: multipart/form-data

A `multipart/form-data` body is split into **parts**: text fields and files, each with its own small headers, separated by a random **boundary** string declared in `Content-Type`. The server can read part by part and stream files to disk without holding everything in memory.

```js
// Client: let the browser build the body. Do NOT set Content-Type yourself,
// or the boundary will be missing and the server can't parse it.
const form = new FormData();
form.append("name", "Asha");
form.append("photo", fileInput.files[0]);
await fetch("/api/profile/photo", { method: "POST", body: form });
```

```js
// Server: multer parses multipart bodies
import multer from "multer";

const upload = multer({ dest: "uploads/", limits: { fileSize: 5 * 1024 * 1024 } });   // 5 MB max

app.post("/api/profile/photo", upload.single("photo"), (req, res) => {
  res.status(201).json({ file: req.file.filename, size: req.file.size, name: req.body.name });
});
```

### Downloads: streaming

To send something large, or something that isn't finished yet, the server **streams** it in pieces instead of building the whole response in memory first:

- **Chunked transfer** (`Transfer-Encoding: chunked`, HTTP/1.1) sends the body in chunks when the total size isn't known up front. Node does this automatically when you `res.write()` without setting `Content-Length`.
- **Server-Sent Events** (`Content-Type: text/event-stream`) keep one response open and push `data:` messages whenever something happens: order status updates, logs, or an AI answer appearing word by word.

```js
app.get("/api/orders/:id/live", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
  res.flushHeaders();   // send the headers now, keep the response open

  const timer = setInterval(async () => {
    const order = await Order.findById(req.params.id);
    res.write(`data: ${JSON.stringify({ status: order.status })}\n\n`);
  }, 5000);

  req.on("close", () => clearInterval(timer));   // stop when the user leaves the page
});
```

```js
// Browser: EventSource reconnects automatically if the connection drops
const events = new EventSource("/api/orders/981/live");
events.onmessage = (e) => console.log(JSON.parse(e.data).status);
```

Summary: **big data up** → `multipart/form-data`. **Big or live data down** → streaming or SSE. **Part of a file** → range requests. **Two-way, real-time** → WebSockets.

## Proxies and forwarded headers

In production, your Express app almost never faces the internet directly. It sits behind a **reverse proxy** or load balancer: Nginx, a cloud load balancer, or your hosting platform's edge. The proxy handles HTTPS, spreads traffic across instances, caches and compresses.

- A **forward proxy** sits in front of **clients** and makes requests for them: a college or office network proxy, for example. Websites see the proxy, not you. HTTPS passes through it using `CONNECT`.
- A **reverse proxy** sits in front of **servers**. Clients think they are talking to your app; they're really talking to the proxy. A CDN is a reverse proxy spread across the world.

Because the proxy opens its own connection to your app, your app sees the **proxy's IP**, and usually plain HTTP (the proxy already decrypted HTTPS). To pass on the original details, proxies add headers:

| Header | Carries |
| --- | --- |
| `X-Forwarded-For` | the original client IP, plus any proxies in between |
| `X-Forwarded-Proto` | the original scheme: `https` |
| `X-Forwarded-Host` | the host the client asked for |
| `Forwarded` | the standard single-header version of all three |
| `Via` | which proxies the message passed through |

Two traps:

- **Spoofing.** `X-Forwarded-For` is just a header; anyone can send a fake one. Only trust it when the request came from your own proxy, otherwise attackers can dodge IP-based rate limits.
- **Wrong scheme.** If your app builds links or redirects from the local scheme (`http`) instead of `X-Forwarded-Proto`, an HTTPS site starts producing `http://` links and redirect loops.

Express handles both once you tell it how many proxies to trust:

```js
app.set("trust proxy", 1);   // trust exactly one proxy hop (your load balancer)

app.get("/whoami", (req, res) => {
  res.json({ ip: req.ip, protocol: req.protocol, secure: req.secure });   // now the real client values
});
```

## Upgrading to WebSockets

HTTP's ask-and-answer shape doesn't suit chat, live cricket scores or multiplayer games, where the server must push the moment something happens. HTTP/1.1 has an **Upgrade** mechanism that switches an existing connection to another protocol, most often WebSocket.

The handshake starts as a normal HTTP request, so it passes through the same ports and proxies:

```text
GET /chat HTTP/1.1
Host: api.foodapp.in
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

`Sec-WebSocket-Accept` is computed from the client's key, which proves the server really speaks WebSocket. After the 101, the connection is no longer HTTP. It's a **full-duplex** channel of small frames: either side can send at any time, with no headers per message.

```js
import { WebSocketServer } from "ws";

const server = app.listen(3000);
const wss = new WebSocketServer({ server });   // shares the port with Express

wss.on("connection", (socket) => {
  socket.on("message", (data) => socket.send(`You said: ${data}`));
});
```

Don't use WebSockets by default. For **one-way** updates from server to client, SSE is simpler: it's plain HTTP and reconnects by itself. Use WebSockets when both sides really need to talk in real time. For normal request/response APIs, plain HTTP with good caching is the right answer.

## HTTPS and TLS

- **SSL** was the original protocol for encrypting web traffic. Every version is now broken and disabled; people still say "SSL certificate" out of habit.
- **TLS** is its replacement. TLS 1.3 is the current version: faster, and without the old weak options.
- **HTTPS** is simply HTTP sent inside a TLS connection. Everything in this chapter applies unchanged.

Without TLS, anyone on the network path, such as whoever controls the café Wi-Fi, can carry out a **man-in-the-middle attack**: read your password, change the request, or alter the response, while both sides think they're talking directly. TLS closes that hole. The attacker still sees traffic, but only as unreadable ciphertext, and any change breaks an integrity check.

The TLS handshake achieves three things before any HTTP is sent:

1. **Authentication.** The server presents a **certificate** for `foodapp.in`, signed by a Certificate Authority your device already trusts. That proves you reached the real server, not an impostor.
2. **Key exchange.** Using public-key cryptography, both sides agree on a shared secret key without ever sending it over the network. Public-key maths is slow, so it's only used for this step.
3. **Encryption with integrity.** All further traffic is encrypted with that fast symmetric key, and every record carries a check that detects tampering.

One more detail: **SNI** (Server Name Indication) is where the client says which hostname it wants during the handshake, so one IP can serve certificates for many domains. It's the TLS version of the `Host` header.

In practice you rarely write TLS code. HTTPS is handled at the edge (Nginx, your load balancer or hosting platform), often with free auto-renewing certificates from **Let's Encrypt**. Your app receives plain HTTP behind it, which is exactly why `X-Forwarded-Proto` and `trust proxy` matter, and why you set HSTS so browsers always use HTTPS.

## See it yourself: DevTools and curl

Open DevTools → **Network**, reload a page and click any request. You'll see the method, status, request and response headers, the timing of each phase, and the OPTIONS preflights. Then try `curl` in a terminal:

```bash
curl -i https://example.com
```

```bash
curl -I https://example.com
```

```bash
curl -v https://example.com
```

`-i` shows response headers with the body, `-I` sends a HEAD request (headers only), and `-v` also prints the request curl sent and the TLS handshake. To test your CORS setup without a browser, fake a preflight:

```bash
curl -i -X OPTIONS http://localhost:3000/api/orders/7 -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: PUT" -H "Access-Control-Request-Headers: content-type, authorization"
```

## Debugging cheat sheet

| Symptom | Check |
| --- | --- |
| CORS error in the console, but the server log shows 200 | Does `Access-Control-Allow-Origin` match the page's origin exactly? Does the OPTIONS preflight return the right methods and headers? Using cookies? Then `Allow-Credentials: true` and no `*`. |
| `req.body` is `undefined` | Is `express.json()` registered? Does the request have `Content-Type: application/json`? |
| `Cannot set headers after they are sent` | A handler responds twice. Add `return` before early responses. |
| Users see old data | Check `Cache-Control`, ETags and `Vary`. Personal data should be `private`. |
| Duplicate orders or payments | POST isn't idempotent. Add an `Idempotency-Key` and disable the button while submitting. |
| Edits silently overwrite each other | Use `If-Match` with ETags and return 412 on conflict. |
| A redirected form arrives empty | You used 301/302. Use 307/308, or 303 for Post/Redirect/Get. |
| 401 vs 403 confusion | 401 = not logged in. 403 = logged in, not allowed. |
| Random 502s behind a load balancer | Node's `keepAliveTimeout` is shorter than the load balancer's idle timeout. |
| 502 / 503 / 504 | Probably infrastructure: is the app running, healthy and fast enough? Check the proxy logs. |
| Every client IP looks the same | Set `app.set("trust proxy", 1)` and read `req.ip`. |
| HTTPS site generates `http://` links | Same fix: `trust proxy`, so Express reads `X-Forwarded-Proto`. |

## Quick revision

- **HTTP** is a stateless request/response protocol at the application layer, running on TCP (or QUIC for HTTP/3).
- A message is a **start line, headers, blank line, body**. Headers always go before the body.
- **Safe** = read-only. **Idempotent** = repeating it gives the same end state. POST is neither, so protect it with **idempotency keys**.
- **Cookies** are sent automatically; secure them with `HttpOnly`, `Secure` and `SameSite`. **Sessions** live on the server; **JWTs** are signed, not encrypted.
- The **same-origin policy** blocks cross-origin reads; **CORS** headers relax it. The browser enforces it, it protects **users**, and JSON or `Authorization` requests trigger a **preflight**.
- Status codes: 2xx success, 3xx redirect, 4xx client's fault, 5xx server's fault.
- Caching = **freshness** (`Cache-Control`) + **validation** (ETag, 304). ETags with `If-Match` also prevent lost updates.
- Behind a proxy, use `X-Forwarded-*` headers via `trust proxy`. HTTPS is usually handled at the edge.

## Interview questions

1. What does it mean that HTTP is stateless? Why is that good for scaling, and how do apps still keep users logged in?
2. What changed in HTTP/1.1, HTTP/2 and HTTP/3? What is head-of-line blocking?
3. What are the parts of an HTTP request? Why does `Content-Length` matter?
4. What do safe and idempotent mean? Is PATCH idempotent? Is DELETE?
5. PUT vs POST vs PATCH: when do you use each?
6. A user double-taps "Pay" and is charged twice. How do you prevent that?
7. What do `HttpOnly`, `Secure` and `SameSite` do on a cookie?
8. Sessions vs JWT. If a JWT payload is readable, why can't users edit it?
9. What is an origin? What is the same-origin policy?
10. Why do you see an OPTIONS request before your API calls? Which requests trigger a preflight?
11. Your server returns 200 but the browser shows a CORS error. What's happening?
12. Does CORS protect your server from attackers? Why not?
13. 401 vs 403. 400 vs 422. Where do 502, 503 and 504 usually come from?
14. 301 vs 302 vs 307 vs 308. What is Post/Redirect/Get?
15. `no-cache` vs `no-store`. How do ETags and 304 work?
16. What is optimistic locking and how does `If-Match` implement it?
17. How does a resumable download work in HTTP?
18. Your app is behind a load balancer and `req.ip` is always the same. Why, and how do you fix it?
19. SSE vs WebSockets: when would you choose each?
20. What does the TLS handshake achieve? Where is HTTPS usually terminated?

## Further reading

- [MDN: HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [Express 5 API reference](https://expressjs.com/en/5x/api.html)

Next: [Chapter 02, Routing in the Backend](/system-design/02-routing-in-backend/).
