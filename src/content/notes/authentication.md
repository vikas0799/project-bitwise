---
title: "Authentication in Node.js: Hashing, Cookies, Sessions, JWT and Passport"
description: Authentication vs authorisation, password hashing with salt and bcrypt, cookies and their security flags, session-based login and token-based login with JWT (with sequence diagrams), access and refresh tokens, sessions vs JWT, Passport.js local and Google login, role-based access and a security checklist.
author: Vikas Patel
---

Almost every app needs login. It's also where the most dangerous bugs hide: leaked passwords, stolen sessions, users reading each other's data. This note builds up from the basics (hashing, cookies) to the two main login designs, **sessions** and **JWT**, and finishes with a checklist you can apply to any project.

## Authentication vs authorisation

| | Authentication (AuthN) | Authorisation (AuthZ) |
| --- | --- | --- |
| question | **who are you?** | **what are you allowed to do?** |
| example | logging in with email and password, OTP, Google | only admins can delete courses; you can edit only your own profile |
| failure status | **401** Unauthorized | **403** Forbidden |
| happens | first | after authentication, on every protected action |

## Storing passwords: hashing

**Never store passwords as plain text**, and never encrypt them (encryption can be reversed). Store a **hash**.

A **hash function** turns input into a fixed-length fingerprint:

- **One-way:** you can't get the password back from the hash.
- **Deterministic:** the same input always gives the same hash, which is how login checks work.
- **Avalanche effect:** changing one character changes the whole hash.
- **Deliberately slow** (for password hashing): fast hashes like SHA-256 let attackers try billions of guesses per second. Password hashes are designed to be slow.

### Salt

If two users pick `password123`, plain hashes would be identical, and attackers can use precomputed tables of common passwords ("rainbow tables"). A **salt** is a random value added to each password before hashing, so every hash is unique. The salt isn't secret; it's stored with the hash.

### bcrypt

**bcrypt** handles salting and slowness for you. Its output contains the algorithm, the **cost factor** and the salt: `$2b$12$<22-char salt><31-char hash>`.

```js
import bcrypt from "bcrypt";

const hash = await bcrypt.hash("myPassword", 12);           // 12 = cost: 2^12 rounds
const ok = await bcrypt.compare("myPassword", hash);       // true
const wrong = await bcrypt.compare("guess", hash);         // false
```

Each +1 to the cost **doubles** the time. Aim for roughly 100–300 ms per hash on your server (cost 10–12 today). **Argon2id** is the newer algorithm that OWASP recommends first; bcrypt remains a solid choice. Note that bcrypt only uses the first 72 bytes of a password.

## Cookies

HTTP is **stateless**: every request is independent, and the server doesn't remember you. **Cookies** fix that. The server sends `Set-Cookie`, and the browser **automatically** sends the cookie back with every request to that site.

```js
import cookieParser from "cookie-parser";
app.use(cookieParser(process.env.COOKIE_SECRET));

res.cookie("theme", "dark", { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
req.cookies.theme;                                                  // "dark"

res.cookie("cartId", "abc123", { signed: true });                    // tamper-proof
req.signedCookies.cartId;                                           // false if someone edited it
res.clearCookie("theme");
```

A **signed** cookie can be **read** by the user but not **changed** without detection. Never put secrets in cookies: users can see them.

### Cookie security flags

| Flag | Effect | Use |
| --- | --- | --- |
| `HttpOnly` | JavaScript can't read it (`document.cookie`) | **always** for session and auth cookies: an XSS bug can't steal them |
| `Secure` | sent only over HTTPS | always in production |
| `SameSite=Lax` | not sent on cross-site POSTs, subresources or iframes | good default; blocks most **CSRF** |
| `SameSite=Strict` | never sent on cross-site requests, even link clicks | banking-level sensitivity |
| `SameSite=None` | sent cross-site (requires `Secure`) | only when your front end and API are on different sites |
| `Max-Age` / `Expires` | lifetime; without it, a "session cookie" deleted when the browser closes | "remember me" |

Cookies are limited to about **4 KB** each and are sent with **every** request, so keep them small.

## Session-based login

The server **remembers** who you are. The browser only holds a random **session id** in a cookie.

![Browser, Express server and session store: login creates a session and a cookie; later requests send the cookie and the server looks up the session](/images/backend/auth-session-flow.svg "The cookie holds only a random id. The user's data stays on the server.")

```js
import session from "express-session";
import { RedisStore } from "connect-redis";        // or connect-mongo, connect-pg-simple

app.use(
  session({
    store: new RedisStore({ client: redisClient }), // the default MemoryStore leaks memory: dev only
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,                        // don't create sessions for anonymous visitors
    cookie: { httpOnly: true, secure: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 },
  }),
);

app.post("/login", async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: "Invalid email or password" }); // same message either way
  req.session.regenerate((err) => {                 // new id after login: prevents session fixation
    if (err) return next(err);
    req.session.userId = user.id;
    res.json({ ok: true });
  });
});

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Login required" });
  next();
}

app.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {                    // server-side logout is instant
    if (err) return next(err);
    res.clearCookie("connect.sid").json({ ok: true });
  });
});
```

## Token-based login with JWT

With a **JSON Web Token**, the **token itself** says who you are. The server signs it at login and just **verifies the signature** on each request, with no session lookup.

![Client and API server: login returns an access token; later requests send it in the Authorization header and the server verifies it](/images/backend/auth-jwt-flow.svg "The server stores nothing per login; it only checks the signature and expiry.")

### Inside a JWT

A JWT is three base64url parts separated by dots: `header.payload.signature`.

![The header, payload and signature parts of a JWT](/images/backend/jwt-structure.svg "Anyone can decode the payload. Only the server can create a valid signature.")

- **Header:** the algorithm, for example `HS256`.
- **Payload:** **claims**, such as `sub` (the user id), `role` and `exp` (expiry time).
- **Signature:** an HMAC of the header and payload using your secret. If anyone changes one character of the payload, the signature no longer matches.

The payload is **encoded, not encrypted**: paste any JWT into jwt.io and read it. Never put passwords or private data in it.

```js
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;               // long and random; never commit it

function signAccessToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, SECRET, { expiresIn: "15m" });
}

function requireAuth(req, res, next) {
  const [scheme, token] = (req.get("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Login required" });
  try {
    req.user = jwt.verify(token, SECRET, { algorithms: ["HS256"] }); // checks signature and exp
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/api/me", requireAuth, (req, res) => res.json({ id: req.user.sub, role: req.user.role }));
```

### Access tokens and refresh tokens

A JWT can't be "logged out" before it expires: the server doesn't track it. So keep **access tokens short-lived** (5–15 minutes) and add a **refresh token**:

1. Login returns a short-lived **access token** and a long-lived **refresh token** (days).
2. The client sends the access token with API calls.
3. When it expires, the client calls `/auth/refresh` with the refresh token and gets a new access token.
4. Store refresh tokens (or their hashes) in the database so you can **revoke** them on logout or password change, and **rotate** them: issue a new one on every refresh and reject reuse of the old one.

**Where to keep tokens in the browser?** In an **HttpOnly, Secure, SameSite cookie**, not `localStorage`: any XSS bug can read `localStorage`. Mobile apps use the platform's secure storage.

### Sessions vs JWT

| | Sessions | JWT |
| --- | --- | --- |
| state | server stores the session | stateless: the token carries the data |
| logout / revoke | instant: delete the session | hard: wait for expiry, or keep a denylist |
| each request | a store lookup (Redis is fast) | a signature check, no lookup |
| scaling | needs a shared store across servers | any server with the key can verify |
| best for | classic web apps on one domain | APIs, mobile apps, many services |

For a typical web app, **sessions are simpler and safer**. Choose JWT when you have a real need: several services, mobile clients, or third-party API access.

## Passport.js

**Passport** is authentication middleware for Express with 500+ **strategies**: `passport-local` (username and password), Google, GitHub and more. It works with sessions.

```bash
npm install passport passport-local passport-local-mongoose express-session
```

```js
// models/user.js: the plugin adds username, hash and salt fields, plus helper methods
import mongoose from "mongoose";
import plm from "passport-local-mongoose";

const passportLocalMongoose = plm.default ?? plm; // the package is CommonJS with a `default` export
const userSchema = new mongoose.Schema({ email: { type: String, required: true, unique: true } });
userSchema.plugin(passportLocalMongoose);
export const User = mongoose.model("User", userSchema);
```

```js
// app.js: order matters: session → passport.initialize → passport.session → routes
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

app.use(session({ /* as above */ }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());     // what to store in the session (the user id)
passport.deserializeUser(User.deserializeUser()); // how to load req.user from that id

app.use((req, res, next) => {
  res.locals.currentUser = req.user;              // available in every EJS view
  next();
});

app.post("/signup", async (req, res, next) => {
  const { username, email, password } = req.body;
  const user = await User.register(new User({ username, email }), password); // hashes the password
  req.login(user, (err) => (err ? next(err) : res.redirect("/dashboard")));   // log in right away
});

app.post("/login", passport.authenticate("local", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/dashboard");
});

app.post("/logout", (req, res, next) => {
  req.logout((err) => (err ? next(err) : res.redirect("/")));  // Passport 0.6+ needs the callback
});

const isLoggedIn = (req, res, next) =>
  req.isAuthenticated() ? next() : res.redirect("/login");
app.get("/dashboard", isLoggedIn, (req, res) => res.render("dashboard"));
```

**Common mistakes:** `req.user` undefined (session or `passport.session()` missing, or in the wrong order), "Failed to serialize user" (missing `serializeUser`), and login always failing (the form field must be named `username` unless you configure `usernameField`).

### Login with Google (OAuth 2.0 / OpenID Connect)

"Sign in with Google" means Google checks the password, and your app receives a verified identity:

1. Your app redirects the user to Google with your **client id** and a callback URL.
2. The user signs in and approves.
3. Google redirects back with a one-time **code**; your server exchanges it (with your **client secret**) for tokens and the user's profile.
4. You find or create the user, and start a session.

`passport-google-oauth20` implements this flow. Hosted services (Auth0, Clerk, Supabase Auth, Firebase Auth) handle it all, plus password resets and 2FA, if you'd rather not build auth yourself.

## Authorisation: roles and ownership

```js
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ error: "Forbidden" });

app.delete("/api/courses/:id", requireAuth, requireRole("admin"), deleteCourse);

// Ownership: users may edit only their OWN resources
app.patch("/api/notes/:id", requireAuth, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user.sub }); // filter by owner!
  if (!note) return res.status(404).json({ error: "Not found" });
  // …update and save
});
```

Forgetting the ownership check ("**broken access control**", often called IDOR) is the **number one** risk in the OWASP Top 10: user 5 changes the URL to `/api/notes/6` and reads someone else's data.

## Security checklist

- Hash passwords with **bcrypt or Argon2id**; never log or email passwords.
- Use **HTTPS** everywhere; cookies with `HttpOnly`, `Secure`, `SameSite`.
- Keep secrets in **environment variables**; rotate them if leaked.
- **Rate-limit** login, signup, OTP and password-reset routes (`express-rate-limit`).
- Return the **same error** for "no such user" and "wrong password", so attackers can't discover which emails are registered.
- Regenerate the session id on login; destroy it on logout.
- Keep JWTs short-lived; verify with an explicit algorithm list; support refresh-token revocation.
- Check **ownership and roles** on every protected route, on the server.
- Validate all input; use parameterised queries ([SQL injection](/notes/postgresql-nodejs)) and type checks ([NoSQL injection](/notes/mongodb)).
- Password reset: a random, single-use token that expires in minutes, stored hashed.
- Add `helmet` for security headers, and escape output to prevent XSS.

## Interview questions

1. Authentication vs authorisation. 401 vs 403.
2. Hashing vs encryption. What is a salt? Why is bcrypt slow on purpose?
3. What do the `HttpOnly`, `Secure` and `SameSite` cookie flags do?
4. Explain session-based authentication step by step.
5. What are the three parts of a JWT? Is the payload encrypted?
6. Sessions vs JWT: pros and cons. How do you log out a JWT user?
7. What are refresh tokens? Where should tokens be stored in the browser?
8. What is CSRF and how does `SameSite` help? What is XSS and how does `HttpOnly` help?
9. What is session fixation? What is IDOR?
10. How does "Sign in with Google" work?

## Further reading

- [OWASP: Authentication cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) and [Password storage cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [Passport.js documentation](https://www.passportjs.org/concepts/authentication/)
- [jwt.io: Introduction to JSON Web Tokens](https://jwt.io/introduction)

Back to the start: [Node.js fundamentals](/notes/nodejs-fundamentals).
