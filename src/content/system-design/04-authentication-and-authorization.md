---
title: Authentication and Authorization
description: Who are you, and what are you allowed to do? Password hashing with Argon2, sessions, JWTs, refresh token rotation, cookies, CSRF, API keys, OAuth 2.0 with PKCE, OpenID Connect, RBAC and ABAC, and timing attacks, with Node.js code.
author: Bitwise School
---

Every app with a login answers two questions on every request:

> **Authentication (authn)**: *who are you?* Proving an identity.
>
> **Authorization (authz)**: *what are you allowed to do?* Checking that identity's permissions.

Think of a college campus. The guard at the gate checks your ID card: that's authentication. Your card then opens the library and your own department, but not the staff room or the exam cell: that's authorization. Authentication always comes first. You can't decide what someone may do until you know who they are.

This chapter goes from storing passwords safely, through sessions, JWTs and OAuth, to permission models. The [authentication note](/notes/authentication) is a shorter revision of the same ideas.

## A very short history

Every modern login idea is an old idea in new clothes:

| Era | How identity was proven | The idea it gave us |
| --- | --- | --- |
| Villages | a known elder vouches for you | trust based on recognition, which doesn't scale beyond people who know you |
| Medieval kingdoms | a wax seal on a letter | **something you have**, and the first forgeries (bypass attacks) |
| Telegraph era | an agreed passphrase | **something you know**: the shared secret, ancestor of the password |
| 1961, MIT's CTSS | passwords on a shared computer, stored in plain text | the day someone printed the password file, we learned to **hash** passwords |
| 1970s | Diffie-Hellman, public-key crypto, Kerberos tickets | agreeing on secrets over an untrusted network; ticket-based (token-based) auth |
| 1990s | one-time codes, fingerprint readers | **multi-factor authentication** |
| 2000s onwards | OAuth, JWTs, passkeys (WebAuthn), zero trust | delegated access, stateless tokens, passwordless login |

What's next: **passkeys** are replacing passwords on phones and laptops, and **post-quantum cryptography** is being rolled out because a large enough quantum computer could break RSA and today's elliptic-curve keys.

### The three factors

| Factor | Examples |
| --- | --- |
| Something you **know** | password, PIN, security question |
| Something you **have** | phone receiving an OTP, authenticator app, hardware key, passkey on your device |
| Something you **are** | fingerprint, face |

**Multi-factor authentication (MFA)** combines factors from *different* rows, so stealing one isn't enough. A password plus an OTP is MFA. Two passwords are not.

## Storing passwords safely

Never store passwords as they are. Store a **hash**: the output of a one-way function. The same input always gives the same output, the output has a fixed length, and you can't run it backwards. At login you hash what the user typed and compare it with the stored hash.

### Why SHA-256 is the wrong hash

SHA-256 and MD5 are designed to be **fast**. A single gaming GPU can compute billions of SHA-256 hashes a second, so a leaked table of SHA-256 password hashes gets cracked quickly. Passwords need a **slow, tunable password-hashing function**, ideally one that also needs lots of memory so attackers can't run millions of guesses in parallel on GPUs.

| Function | Needs lots of memory? | Verdict |
| --- | --- | --- |
| **Argon2id** | yes | the recommended default today |
| **scrypt** | yes | good alternative |
| **bcrypt** | no | still acceptable; only uses the first 72 bytes of input |
| SHA-256, MD5 | no | never for passwords |

### Salt, pepper and cost

- **Salt**: a random value generated for *each* password and stored next to its hash. Two users with the password `Welcome@123` now get different hashes, and precomputed "rainbow tables" are useless. A salt isn't secret; it only has to be unique.
- **Pepper**: one secret for the whole app, kept **outside the database** (an environment variable or secret manager). If only the database leaks, the attacker still can't crack the hashes without the pepper.
- **Cost**: how much time and memory each hash takes. Tune it so one hash takes roughly a quarter of a second on your servers, and raise it as hardware gets faster. The parameters are stored inside the hash string, so old hashes still verify.

The `argon2` package generates the salt for you and supports a pepper through its `secret` option:

```js
import argon2 from "argon2";

const PEPPER = Buffer.from(process.env.PASSWORD_PEPPER);   // never stored in the database

export const hashPassword = (password) =>
  argon2.hash(password, { type: argon2.argon2id, secret: PEPPER });

export const verifyPassword = (hash, password) =>
  argon2.verify(hash, password, { secret: PEPPER });

// A stored hash looks like this. Algorithm, cost settings, salt and hash all live in one string:
// $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
```

When you raise the cost later, check `argon2.needsRehash(user.passwordHash, newOptions)` after a successful login and save a fresh hash. Users get upgraded without noticing.

## Sessions

HTTP forgets you after every request ([Chapter 01](/system-design/01-http-and-cors/)). That was fine for static pages, but a shopping cart or a logged-in dashboard needs continuity. **Sessions** were the first answer.

1. **Login**: the server checks the password, creates a long random **session id**, and saves `{ userId, role, ... }` under that id in a store.
2. **Cookie**: the session id goes back to the browser in a cookie, which the browser sends on every later request.
3. **Lookup**: on each request the server reads the id, loads the session from the store, and knows who you are.
4. **Expiry**: sessions expire after some idle time, or when the user logs out and the server deletes them.

![Browser, Express server and session store: login creates a session and a cookie; later requests send the cookie and the server looks up the session](/images/backend/auth-session-flow.svg "The cookie holds only a random id. Everything else stays on the server.")

Where sessions are stored has evolved: **files** on the server (doesn't work once you have two servers), then **database tables** (survives restarts, but adds a query to every request), then in-memory stores like **Redis** (fast, shared by every server, and keys can expire automatically). Redis is the usual choice today.

```js
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

app.set("trust proxy", 1);   // behind a load balancer, so "secure" cookies work
app.use(
  session({
    store: new RedisStore({ client: redis, prefix: "sess:" }),
    secret: process.env.SESSION_SECRET,
    name: "sid",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

app.post("/auth/login", async (req, res, next) => {
  const user = await checkLogin(req.body.email, req.body.password);   // defined in the timing section
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  req.session.regenerate((err) => {   // a brand-new session id after login (see session fixation)
    if (err) return next(err);
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ id: user.id, name: user.name });
  });
});

app.post("/auth/logout", (req, res, next) => {
  req.session.destroy((err) => {      // delete it from Redis: logout is instant
    if (err) return next(err);
    res.clearCookie("sid").sendStatus(204);
  });
});

export function requireSession(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Please log in" });
  next();
}
```

## JSON Web Tokens (JWT)

As apps grew into fleets of servers across regions, sessions got expensive: one more lookup on every request, a store every server must reach, and data to keep in sync between regions. The idea behind **JWTs** (standardised in 2015) is to put the user's details *inside* the token and sign it, so any server can check it without asking a store.

A JWT is three Base64URL strings joined by dots: `header.payload.signature`.

![The header, payload and signature parts of a JWT](/images/backend/jwt-structure.svg "Anyone can decode the payload. Only the holder of the key can make a valid signature.")

- **Header**: which algorithm signed it, for example `{"alg": "HS256", "typ": "JWT"}`.
- **Payload**: the **claims**. Standard ones include `sub` (subject: the user id), `iat` (issued at), `exp` (expiry), `iss` (issuer) and `aud` (audience). You can add your own, like `role`.
- **Signature**: computed over the header and payload with a key only the server has. Change one character of the payload and the signature no longer matches.

The payload is **encoded, not encrypted**: anyone can read it at jwt.io. Never put secrets in it.

![Client and API server: login returns an access token; later requests send it in the Authorization header and the server verifies it](/images/backend/auth-jwt-flow.svg "The server stores nothing per login. It only checks the signature and the expiry.")

```js
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user.id), role: user.role }, SECRET, { algorithm: "HS256", expiresIn: "15m" });

export function requireAuth(req, res, next) {
  const [scheme, token] = (req.get("Authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Please log in" });
  try {
    const claims = jwt.verify(token, SECRET, { algorithms: ["HS256"] });   // pin the algorithm
    req.user = { id: claims.sub, role: claims.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

### What JWTs are good at

- **No storage**: nothing to save per login.
- **Scales across servers and services**: any instance with the key can verify a token.
- **Portable**: a compact string that works in a header, a cookie or a mobile app's secure storage.

### Where JWTs hurt

- **Theft**: whoever holds a valid token *is* you until it expires. The server has no record to check it against.
- **Revocation**: you can't log out one user early. Changing the signing key logs out *everyone*.

A common patch is a **denylist** of revoked tokens in Redis, checked after the signature. But notice what happened: you are now doing a store lookup on every request, which is exactly what JWTs were meant to avoid. If you need instant revocation everywhere, sessions are often simpler and safer. This debate never really ends.

### HS256 vs RS256

| | HS256 (symmetric) | RS256 / ES256 (asymmetric) |
| --- | --- | --- |
| Keys | one shared secret signs and verifies | a **private key** signs, a **public key** verifies |
| Who can create tokens | anyone who can verify them | only the holder of the private key |
| Good for | one app or a monolith | many services, third parties, OpenID Connect |

With RS256, your auth service keeps the private key, and every other service only gets the public key (often published at a **JWKS** URL). Services can verify tokens but can't forge them. That is the real reason JWTs suit microservices.

### Two classic JWT attacks

Both come from trusting the token's own header:

- **`alg: none`**: the attacker sets the algorithm to `none` and deletes the signature. A careless library that "does what the header says" accepts it.
- **Algorithm confusion**: the server uses RS256. The attacker switches the header to HS256 and signs the token using the server's **public** key as if it were the HMAC secret. A verifier that picks the algorithm from the header accepts it.

The defence is one line: **pin the algorithms you accept**, as in `jwt.verify(token, key, { algorithms: ["RS256"] })`. Never let the token choose.

### Access tokens and refresh tokens

The standard fix for the revocation problem keeps the fast path stateless:

- A **short-lived access token** (5 to 15 minutes) goes with every API call and is checked without any lookup.
- A **long-lived refresh token** (days or weeks) is stored safely (an `HttpOnly` cookie on the web, secure storage on mobile) and is only used to get a new access token.

A stolen access token stops working within minutes, and only the refresh endpoint touches the database. Add **rotation**: every refresh returns a *new* refresh token and marks the old one used. If a used refresh token ever comes back, someone copied it, so revoke that whole **token family**.

![A short-lived access token expires, the client swaps its refresh token for a new pair, and reuse of an old refresh token revokes the whole family](/images/system-design/refresh-rotation.svg "Short access tokens keep requests fast. Rotating refresh tokens give you a way to cut off a thief.")

```js
import crypto from "node:crypto";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

async function issueTokens(res, user, familyId = crypto.randomUUID()) {
  const refresh = crypto.randomBytes(32).toString("base64url");
  await RefreshToken.create({
    tokenHash: sha256(refresh),   // store a hash, like a password
    userId: user.id,
    familyId,
    usedAt: null,
    expiresAt: new Date(Date.now() + THIRTY_DAYS),
  });
  res.cookie("refresh", refresh, { httpOnly: true, secure: true, sameSite: "strict", path: "/auth/refresh", maxAge: THIRTY_DAYS });
  return signAccessToken(user);
}

app.post("/auth/refresh", async (req, res) => {
  const hash = sha256(req.cookies.refresh ?? "");   // req.cookies comes from cookie-parser

  // Mark the token used in one atomic step, so two parallel refreshes can't both succeed
  const record = await RefreshToken.findOneAndUpdate(
    { tokenHash: hash, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } }
  );

  if (!record) {
    const old = await RefreshToken.findOne({ tokenHash: hash });
    if (old?.usedAt) await RefreshToken.deleteMany({ familyId: old.familyId });   // reuse means theft
    return res.status(401).json({ error: "Please log in again" });
  }

  const user = await User.findById(record.userId);
  res.json({ accessToken: await issueTokens(res, user, record.familyId) });
});
```

**Practical advice:** building auth yourself is the best way to understand it, so do it in a side project. For a real product with paying users, seriously consider a provider (Auth0, Clerk, Firebase Auth, Supabase Auth). Hashing settings, token rotation, MFA, account recovery and breach response are their full-time job.

## Cookies

A **cookie** is a small piece of data the server asks the browser to store. Two browser rules make cookies perfect for auth:

1. A cookie is only sent back to the site that set it. Other sites can't read it.
2. The browser attaches it **automatically** to every request to that site.

So the server can hand the browser a session id (or a token) once, and the browser takes care of sending it back. The flags matter:

| Flag | Why it matters |
| --- | --- |
| `HttpOnly` | JavaScript can't read it, so an XSS bug can't steal the session |
| `Secure` | sent only over HTTPS |
| `SameSite=Lax` or `Strict` | not sent on requests that other sites trigger, the first defence against CSRF |
| `Max-Age` | how long it lives |

### CSRF: cross-site request forgery

Automatic sending is also the weakness. You're logged in to your bank. You open a malicious page, and it quietly submits a form to `bank.example/transfer`. Your browser attaches your bank cookie, and the bank sees a perfectly authenticated request.

Note that APIs that read a token from the `Authorization` header are naturally safe from CSRF: another site can't make your browser add that header. Only **cookie-based** auth needs these defences:

- **`SameSite=Lax`** (the default in modern browsers) or `Strict`: the cookie isn't sent on cross-site form posts and fetches.
- **Synchronizer token**: the server puts a random token in each form or page; state-changing requests must send it back. The attacker's page can't read it.
- **Double-submit cookie**: put a random token in a cookie that JavaScript *can* read, and require the same value in a header. The attacker's site can't read your cookie, so it can't copy the value.

```js
import crypto from "node:crypto";

// After login: a CSRF token the frontend can read (deliberately NOT HttpOnly)
res.cookie("csrf", crypto.randomBytes(32).toString("hex"), { secure: true, sameSite: "lax" });

// The frontend copies it into a header on every POST, PUT, PATCH and DELETE:
// fetch("/api/orders", { method: "POST", headers: { "X-CSRF-Token": readCookie("csrf") }, ... })

export function checkCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const fromCookie = req.cookies.csrf ?? "";
  const fromHeader = req.get("X-CSRF-Token") ?? "";
  const same =
    fromCookie.length > 0 &&
    fromCookie.length === fromHeader.length &&
    crypto.timingSafeEqual(Buffer.from(fromCookie), Buffer.from(fromHeader));
  if (!same) return res.status(403).json({ error: "CSRF check failed" });
  next();
}
```

For extra safety, sign the CSRF token with an HMAC tied to the session id, so an attacker who controls a subdomain can't plant a cookie of their own.

### Session fixation

The attacker gets a valid session id (for example by visiting your site), tricks the victim into using that same id, and waits for them to log in. If the server keeps the old id after login, the attacker is now logged in as the victim. The fix: **issue a new session id whenever privileges change**, especially at login. That's the `req.session.regenerate()` call in the session code above.

## Stateful vs stateless authentication

**Stateful** (sessions): the server stores the proof of login and the cookie only points to it. **Stateless** (JWT): the proof travels inside the signed token and the server stores nothing.

| | Stateful (session) | Stateless (JWT) |
| --- | --- | --- |
| See who is logged in right now | yes | no |
| Log a user out or ban them instantly | easy: delete the session | hard: the token works until it expires |
| Needs a shared store | yes (Redis) | no |
| Multi-region scale | needs replication | easy |
| Mobile apps and public APIs | cookies are awkward | natural fit |
| If the credential leaks | revoke the session | the thief has access until expiry |

For most web apps, **sessions** are the safer default: instant logout, easy bans, and a clear list of active sessions. JWTs shine for mobile clients, public APIs and service-to-service calls. Many products use both: sessions for the browser app, access + refresh tokens for the mobile app.

## API keys

Sometimes no human is involved at all. Your server calls an AI API to summarise text, or a partner's server calls yours every night to sync orders. This is **machine-to-machine (M2M)** traffic: there's no login form and nobody to type a password.

An **API key** is a long random secret you generate in a dashboard, store in an environment variable, and send with every request (usually in a header). The server looks it up, finds which account and permissions it belongs to, and lets the call through.

- Show the key to the user **once**, at creation. Store only its **hash**.
- A fast hash like SHA-256 is fine here, unlike passwords: a 32-byte random key can't be guessed, so slowing down guesses buys nothing.
- Give keys a recognisable **prefix** (`bw_live_...`) so leaked keys are easy to spot in code and logs.
- Give keys **scopes** (what they may do), an **expiry**, and a way to **revoke** them.

```js
import crypto from "node:crypto";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export async function createApiKey(userId, scopes) {
  const key = `bw_live_${crypto.randomBytes(24).toString("base64url")}`;
  await ApiKey.create({
    userId,
    scopes,
    prefix: key.slice(0, 12),   // shown in the dashboard so users can tell keys apart
    hash: sha256(key),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    revokedAt: null,
  });
  return key;   // show it once, never again
}

export async function requireApiKey(req, res, next) {
  const key = req.get("X-API-Key");
  if (!key) return res.status(401).json({ error: "API key required" });
  const record = await ApiKey.findOne({ hash: sha256(key), revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!record) return res.status(401).json({ error: "Invalid API key" });
  req.client = { userId: record.userId, scopes: record.scopes };
  next();
}
```

## OAuth: sharing access without sharing passwords

### The delegation problem

As people signed up for more and more sites, two problems grew: password reuse (one breach unlocks many accounts) and password fatigue. Then a new need appeared: **one app wanting to use your data on another app**. A travel app wants to find flight tickets in your Gmail. A new social app wants to import your contacts.

The first "solution" was terrible: you typed your Google password into the travel app. That handed over **everything** (mail, photos, Drive) with no way to limit it, and taking access back meant changing your password.

**OAuth** (2007, started by engineers at Twitter and Google) fixed this with one idea: **give apps tokens, not passwords**. A token carries only the **scopes** you approved ("read contacts"), can expire, and can be revoked without touching your password.

### The four roles

| Role | Meaning | Example: a travel app reads your Gmail |
| --- | --- | --- |
| **Resource owner** | the user who owns the data | you |
| **Client** | the app that wants access | the travel app |
| **Authorization server** | logs the user in and issues tokens | Google's login and consent service |
| **Resource server** | the API that holds the data | the Gmail API |

### OAuth 2.0 and its flows

OAuth 1.0 required every request to be cryptographically signed, which developers kept getting wrong. **OAuth 2.0** (2012) switched to **bearer tokens** sent over HTTPS (whoever holds the token can use it, so TLS is mandatory) and defined different **flows** for different kinds of apps:

| Flow | For | Status |
| --- | --- | --- |
| **Authorization code + PKCE** | web apps, SPAs, mobile apps | the one to use for anything with a user |
| **Client credentials** | server-to-server, no user involved | use it for M2M |
| **Device code** | TVs, consoles, CLIs without a proper keyboard | use it for those devices |
| Implicit | old browser apps | deprecated: tokens leaked through URLs |
| Password grant | apps collecting the user's password | deprecated |

### Authorization code flow with PKCE

This is what happens behind every "Sign in with Google" button:

![Sign in with Google using the OAuth authorization code flow with PKCE, from the click to the API call](/images/system-design/oauth-pkce.svg "The authorization code travels through the browser, but it's useless without the code_verifier, which never leaves your app.")

**Step 1, in the browser.** Your app redirects the user to Google with these query parameters:

```text
GET https://accounts.google.com/o/oauth2/v2/auth
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://foodapp.in/auth/google/callback
  &scope=openid%20email%20profile
  &state=Rk9Lx2…            ← random value your app remembers
  &code_challenge=E9Melh…   ← SHA-256 of a secret code_verifier
  &code_challenge_method=S256
```

After the user logs in and approves, Google redirects back to `/auth/google/callback?code=...&state=...`. Your app **must check that `state` matches** what it sent. That blocks attackers who try to inject their own login response.

**Step 2, server to server.** Your backend swaps the code for tokens, proving it started the flow by sending the original `code_verifier`.

**Why PKCE?** (Proof Key for Code Exchange.) SPAs and mobile apps can't keep a client secret: anyone can read the app's code. If a malicious app intercepts the authorization code, it still can't redeem it without the verifier, which never left your app. PKCE is why the implicit flow is no longer needed, and today it's recommended even for server-side apps.

```js
import crypto from "node:crypto";

const REDIRECT_URI = "https://foodapp.in/auth/google/callback";
const b64url = (buffer) => buffer.toString("base64url");

app.get("/auth/google", (req, res) => {
  const state = b64url(crypto.randomBytes(16));
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  req.session.oauth = { state, verifier };

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  res.redirect(url.toString());
});

app.get("/auth/google/callback", async (req, res) => {
  const saved = req.session.oauth;
  if (!saved || req.query.state !== saved.state) return res.status(400).send("Invalid login attempt");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: req.query.code,
      redirect_uri: REDIRECT_URI,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,   // server-side apps send their secret too
      code_verifier: saved.verifier,
    }),
  });
  const { id_token, access_token } = await response.json();
  // Verify the ID token (signature, issuer, audience, expiry), e.g. with google-auth-library,
  // then find or create the user and start a session for them.
});
```

In real projects a library like Passport or Auth.js handles these steps, but now you know what they do for you.

## OpenID Connect: OAuth plus identity

OAuth answers "what may this app do?". It was never designed to answer "who is this user?". Apps used it for login anyway, each in a slightly different, often insecure way.

**OpenID Connect (OIDC)**, finalised in 2014, adds the missing piece on top of OAuth 2.0: an **ID token**. It's a **JWT**, signed by the provider, containing who logged in (`sub`, `email`, `name`, `picture`), who issued it (`iss`), which app it's for (`aud`), and when (`iat`, `exp`).

In the flow above, asking for the `openid` scope is what makes Google return an `id_token` next to the `access_token`:

- The **ID token** tells *your app* who the user is. Verify it, then log them in.
- The **access token** lets your app call *Google's APIs* on the user's behalf, limited to the approved scopes.

That's how "Sign in with Google / GitHub / Apple" works everywhere without each app building password storage.

## Which kind of auth should you use?

| Type | How it works | Use it for |
| --- | --- | --- |
| **Sessions** (stateful) | session id in a cookie, data in Redis | web apps where you want control: instant logout, bans |
| **JWT** (stateless) | signed token with claims, checked locally | mobile apps, APIs, service-to-service, large distributed systems |
| **OAuth 2.0 / OIDC** | tokens issued by a provider | "Sign in with Google", accessing another platform's data |
| **API keys** | long random secret per client | machine-to-machine and developer APIs |

## Authorization: who can do what

Once you know who the user is, you decide what they can do. Take a college portal. Students can see their own marks. Teachers can enter marks for the subjects they teach. The admin office can manage everyone.

A tempting shortcut is a secret "admin password" sent with admin requests. It breaks down fast: anyone who sniffs it gets full control, and giving a second person admin access means sharing the secret. Permissions belong to **identities**, not to secret strings.

### RBAC: role-based access control

In **RBAC** you define **roles**, give each role a set of **permissions**, and give each user a role:

| Permission | student | teacher | admin |
| --- | --- | --- | --- |
| `marks:read-own` | yes | yes | yes |
| `marks:write` | no | yes | yes |
| `users:manage` | no | no | yes |

The role arrives with the request (inside the JWT, or loaded from the session or database), and a middleware checks it. A missing permission means **403 Forbidden**:

```js
const ROLE_PERMISSIONS = {
  student: ["marks:read-own"],
  teacher: ["marks:read-own", "marks:write"],
  admin: ["marks:read-own", "marks:write", "users:manage"],
};

const can = (permission) => (req, res, next) => {
  if (ROLE_PERMISSIONS[req.user.role]?.includes(permission)) return next();
  res.status(403).json({ error: "You don't have permission to do this" });
};

app.get("/api/me/marks", requireAuth, can("marks:read-own"), getMyMarks);
app.post("/api/marks", requireAuth, can("marks:write"), addMarks);
app.delete("/api/users/:id", requireAuth, can("users:manage"), deleteUser);
```

**Roles aren't enough on their own.** A student has `marks:read-own`, but nothing in RBAC stops them from requesting `/api/marks/<someone-else's id>`. That bug is called **IDOR** (insecure direct object reference), and it's one of the most common API vulnerabilities. Always check ownership in the query itself:

```js
app.get("/api/marks/:id", requireAuth, can("marks:read-own"), async (req, res) => {
  const result = await Marks.findOne({ _id: req.params.id, studentId: req.user.id });   // only your own
  if (!result) return res.status(404).json({ error: "Not found" });   // 404 doesn't reveal it exists
  res.json(result);
});
```

### When roles explode: hierarchy, ABAC and ReBAC

Real rules get conditional: "a teacher can edit marks, but only for subjects they teach, and only until results are published." With roles alone you end up inventing `teacher_cse_sem3`, `teacher_ece_sem5` and hundreds more. That's **role explosion**.

- **Role hierarchy**: higher roles inherit lower roles' permissions (admin ⊃ teacher ⊃ student). Less duplication, but still no conditions.
- **ABAC (attribute-based access control)**: decide using **attributes** of the user (role, department), the resource (subject, owner, status), the action, and the environment (time, IP). One policy replaces dozens of roles. It's more powerful, but "who can access this?" becomes harder to audit.
- **ReBAC (relationship-based access control)**: decide by relationships: owner of, member of, shared with. It's how Google Drive sharing works (Google's system for this is called Zanzibar).

```js
// ABAC: one readable rule instead of a role per subject
const canEditMarks = (user, marks, now = new Date()) =>
  user.role === "admin" ||
  (user.role === "teacher" && user.subjects.includes(marks.subjectId) && now < marks.resultsPublishedAt);
```

Most real systems mix them: roles for broad access, attribute checks for the conditions, and relationships for sharing.

## Don't leak hints: error messages and timing

### One message for every login failure

"No account with this email" and "Wrong password" feel helpful, but they tell an attacker which emails are registered, so they can focus on guessing passwords for real accounts. During login, return **one generic message** for every failure: `Invalid email or password`. Helpful messages are fine everywhere else, such as form validation.

### Timing attacks

Even with one message, **response time** can leak the answer. A naive login looks up the user and returns immediately if there's no such email, but runs a slow password hash when there is. An attacker who measures that a "wrong email" fails in 5 ms and a "wrong password" fails in 250 ms can still find valid emails.

Two defences:

1. **Do the same work in both cases.** If the user doesn't exist, verify the password against a dummy hash anyway.
2. **Compare secrets in constant time.** Use `crypto.timingSafeEqual` for tokens and signatures, never `===`, which stops at the first character that differs.

```js
import crypto from "node:crypto";
import argon2 from "argon2";

// A real Argon2 hash of a random value, made once at startup
const DUMMY_HASH = await argon2.hash(crypto.randomBytes(16).toString("hex"), { secret: PEPPER });

export async function checkLogin(email, password) {
  const user = await User.findOne({ email });
  // Always run exactly one full hash check, so "no such user" takes as long as "wrong password"
  const valid = await argon2.verify(user?.passwordHash ?? DUMMY_HASH, password, { secret: PEPPER });
  return user && valid ? user : null;
}
```

Also **rate-limit** the login route (for example 5 attempts per minute per IP and per account) so brute force is slow. [Chapter 17](/system-design/17-backend-security/) covers rate limiting in detail.

## Quick revision

| Concept | One line |
| --- | --- |
| Authentication | who are you? |
| Authorization | what can you do? (403 when you can't) |
| MFA | two or more factors from different categories |
| Password storage | Argon2id/bcrypt with a per-password salt, a pepper outside the DB, tuned cost |
| Session | random id in an `HttpOnly` cookie, data in Redis; easy to revoke |
| JWT | `header.payload.signature`; signed, not encrypted; pin the algorithm |
| Access + refresh | short access token, rotating refresh token with reuse detection |
| CSRF | cookie auth only; `SameSite` + CSRF token |
| Session fixation | regenerate the session id at login |
| API key | random secret for machines; store its hash, scope it, expire it |
| OAuth 2.0 | delegated, scoped access via tokens; use authorization code + PKCE |
| OIDC | adds a signed ID token (a JWT) so OAuth can do login |
| RBAC / ABAC / ReBAC | roles / attributes and policies / relationships |
| IDOR | always check ownership, not just the role |
| Login errors | one generic message, equal timing, rate limiting |

## Interview questions

1. What's the difference between authentication and authorization? 401 vs 403?
2. Why shouldn't you hash passwords with SHA-256? What are salt, pepper and cost?
3. Explain session-based authentication step by step. Where would you store sessions for 10 servers?
4. What are the three parts of a JWT? Is the payload encrypted?
5. Sessions vs JWTs: pros, cons, and which would you pick for a web app and for a mobile app?
6. How do you log out a user who uses JWTs? Explain access tokens, refresh tokens and rotation.
7. HS256 vs RS256. What are the `alg: none` and algorithm-confusion attacks?
8. What is CSRF? Why are header-based tokens not affected? How does `SameSite` help?
9. What is session fixation and how do you prevent it?
10. How would you design API keys for a developer platform?
11. Explain OAuth 2.0's roles and the authorization code flow. What problem does PKCE solve?
12. OAuth vs OpenID Connect: what does the ID token add?
13. RBAC vs ABAC. What is role explosion? What is IDOR?
14. Why should login errors be generic? What is a timing attack and how do you prevent it?

## Further reading

- [OWASP: Authentication cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP: Password storage cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP: CSRF prevention cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [RFC 7636: PKCE](https://www.rfc-editor.org/rfc/rfc7636) and [OAuth 2.0 security best practice (RFC 9700)](https://www.rfc-editor.org/rfc/rfc9700)
- [OpenID Connect explained](https://openid.net/developers/how-connect-works/)

Next: [Chapter 05, Validations and Transformations](/system-design/05-validations-and-transformations/).
