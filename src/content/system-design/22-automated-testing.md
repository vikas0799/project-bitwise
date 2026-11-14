---
title: Automated Testing
description: How to test a backend so you can change it without fear. The testing pyramid, arrange-act-assert, unit tests, test doubles and dependency injection, table-driven tests, integration tests against a real Postgres with Testcontainers, HTTP tests with supertest, contract testing with Pact, end-to-end and smoke tests, coverage, flaky tests, fixtures and factories, TDD, controlling time and external APIs, load tests with SLOs, and tests in CI, all run with Node's built-in test runner.
author: Bitwise School
---

The real reason to write automated tests isn't "correctness" in the abstract. It's **confidence to change code**. Without tests, every edit might break something you can't see, so people stop refactoring, stop upgrading dependencies, and work around the scary parts of the codebase. With a good test suite, you can restructure boldly, because a green run tells you in seconds that everything still works.

Tests are also **documentation that can't go out of date**: a test that says `cartTotal(items, { coupon: "LAUNCH20" })` returns 1600 either passes against today's code or it doesn't. And they're a **regression net**: once a bug has a test, it can never quietly come back.

Manual testing is proofreading your work once. Automated testing is a proofreader who rechecks the entire document every time you change a word, instantly, and never gets bored.

This chapter uses Node's **built-in test runner** (`node:test` and `node:assert`), which needs no extra framework. Jest and Vitest work the same way with slightly different syntax. Every test in this chapter was run, including integration tests against a real Postgres in Docker and a contract test with Pact.

## The testing pyramid

Not all tests are equal, and the most important decision is the **mix**.

![A pyramid with many fast unit tests at the base, fewer integration tests in the middle and a few end-to-end tests at the top](/images/system-design/testing-pyramid.svg "Push detail down to fast tests; keep a thin layer of slow, realistic ones on top.")

| Layer | What it tests | Speed | Realism | Use for |
| --- | --- | --- | --- | --- |
| **Unit** | one function or module, dependencies replaced | milliseconds | low | logic, edge cases, branches |
| **Integration** | several parts plus real dependencies (database, HTTP) | seconds | medium | queries, handlers, serialisation, wiring |
| **End-to-end** | the whole running system through its real interface | seconds to minutes | high | a handful of critical user journeys |

Going up the pyramid, tests become more realistic but also slower, flakier and harder to debug: when an end-to-end test fails, the cause could be anywhere. In this chapter's example project, 21 unit tests ran in about **0.2 seconds**, while 3 integration tests against Postgres took about **3 seconds**, mostly starting the database container.

The opposite shape, lots of slow end-to-end tests and few unit tests, is called the **ice-cream cone**. Its suites take ages, fail randomly, and teams soon stop trusting or running them.

## Anatomy of a test

Every good test has three parts: **Arrange, Act, Assert** (in BDD style, *Given, When, Then*).

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { cartTotal } from "../src/pricing.js";

test("applies the LAUNCH20 coupon as 20% off", () => {
  // Arrange: set up the inputs
  const items = [{ price: 1000, qty: 2 }];
  // Act: do the one thing being tested
  const total = cartTotal(items, { coupon: "LAUNCH20" });
  // Assert: check the result
  assert.equal(total, 1600);
});
```

Run it with `node --test`, which finds files named `*.test.js` and runs each file in its own process, in parallel.

What makes a test good:

- **It tests behaviour, not implementation.** Assert what the code *does* (the discount was applied), not *how* (a private helper was called). Tests tied to internals break on every refactor, which defeats their purpose.
- **It has one reason to fail.** A test with a descriptive name that checks one behaviour tells you exactly what broke. The name should read like a sentence.
- **It's deterministic.** Same result every run, in any order, on any machine.

## Unit tests

A **unit test** checks one small piece of logic in isolation: no database, no network, no file system, no real clock. That's what makes unit tests fast (thousands per second) and precise (a failure points at one function).

The best targets are **pure business logic**: pricing, validation, permissions, state transitions, parsing. This is the payoff of keeping logic in services and pure functions instead of route handlers ([Chapter 6](/system-design/06-controllers-services-and-middlewares/)).

```js
// src/pricing.js: pure business logic, no I/O. The easiest code to test.
export function cartTotal(items, { coupon, isStudent = false } = {}) {
  if (items.length === 0) return 0;
  let total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (coupon === "LAUNCH20") total *= 0.8;            // 20% off
  if (isStudent) total -= Math.min(500, total * 0.1); // 10% off, capped at ₹500
  return Math.round(total);
}
```

> **If code is hard to test, the design is usually the problem.** A function that reads a global, opens a connection, checks the clock and does five things at once is painful to test. The fix is almost always to separate pure logic from I/O and pass dependencies in. Testable code and well-designed code are the same thing seen from two sides.

### Table-driven tests

Most logic needs checking against many inputs: the normal case, edge cases, boundaries, errors. Instead of copying a test for each one, write the cases as data and loop over them:

```js
const cases = [
  { name: "empty cart costs nothing", items: [], opts: {}, want: 0 },
  { name: "sums price × quantity", items: [{ price: 300, qty: 3 }], opts: {}, want: 900 },
  { name: "unknown coupon is ignored", items: [{ price: 1000, qty: 1 }], opts: { coupon: "FAKE" }, want: 1000 },
  { name: "student discount is 10%", items: [{ price: 2000, qty: 1 }], opts: { isStudent: true }, want: 1800 },
  { name: "student discount is capped at 500", items: [{ price: 9000, qty: 1 }], opts: { isStudent: true }, want: 8500 },
  { name: "coupon applies before student discount", items: [{ price: 1000, qty: 1 }], opts: { coupon: "LAUNCH20", isStudent: true }, want: 720 },
];

for (const c of cases) {
  test(`cartTotal: ${c.name}`, () => {
    assert.equal(cartTotal(c.items, c.opts), c.want);
  });
}
```

```text
✔ cartTotal: empty cart costs nothing (0.16ms)
✔ cartTotal: sums price × quantity (0.08ms)
✔ cartTotal: unknown coupon is ignored (1.45ms)
✔ cartTotal: student discount is 10% (0.20ms)
✔ cartTotal: student discount is capped at 500 (0.09ms)
✔ cartTotal: coupon applies before student discount (0.07ms)
```

Each case becomes its own named test, so a failure says exactly which case broke. Adding a case is one line, which makes it cheap to cover every boundary. (Jest and Vitest have `test.each` for the same pattern.)

## Test doubles

Real code depends on other things: a repository, a payment provider, an email sender. To test a unit alone, you replace those collaborators with **test doubles**. People say "mock" for all of them, but the precise vocabulary helps:

| Double | What it is | Use it to |
| --- | --- | --- |
| **Dummy** | passed in but never used | fill a required parameter |
| **Stub** | returns canned answers | feed the unit fixed inputs ("the payment succeeds") |
| **Spy** | a stub that records how it was called | check afterwards that a call happened |
| **Mock** | pre-programmed with expectations it verifies | assert an interaction directly |
| **Fake** | a working, lightweight implementation | replace a real dependency cheaply (an in-memory repository) |

### Dependency injection makes doubles possible

You can only swap a collaborator if the code **receives** it instead of importing or creating it. That handover point is called a **seam**:

```js
// src/enrollments.js: business logic that receives its collaborators instead of importing them.
export class AlreadyEnrolledError extends Error {}

export function createEnrollmentService({ repo, payments, mailer, clock = () => new Date() }) {
  return {
    async enroll(userId, courseId) {
      if (await repo.isEnrolled(userId, courseId)) throw new AlreadyEnrolledError("already enrolled");
      const course = await repo.findCourse(courseId);
      const charge = await payments.charge(userId, course.price);
      const enrollment = await repo.saveEnrollment({ userId, courseId, chargeId: charge.id, enrolledAt: clock() });
      await mailer.send(userId, `Welcome to ${course.title}!`);
      return enrollment;
    },
  };
}
```

In production you pass the real Postgres repository, payment client and mailer. In tests you pass doubles. Even the **clock** is a dependency, so tests can control time.

```js
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createEnrollmentService, AlreadyEnrolledError } from "../src/enrollments.js";

// Fake: a real, working implementation that keeps data in memory.
function fakeRepo({ courses = [{ id: 7, title: "System Design", price: 4999 }] } = {}) {
  const enrollments = [];
  return {
    enrollments,
    async isEnrolled(userId, courseId) { return enrollments.some((e) => e.userId === userId && e.courseId === courseId); },
    async findCourse(id) { return courses.find((c) => c.id === id); },
    async saveEnrollment(e) { const saved = { id: enrollments.length + 1, ...e }; enrollments.push(saved); return saved; },
  };
}

const fixedClock = () => new Date("2026-11-14T10:00:00Z");   // time is an input, so tests control it

test("enroll charges the course price and saves the enrollment", async () => {
  const repo = fakeRepo();
  const payments = { charge: async () => ({ id: "ch_123" }) };     // stub: canned answer
  const mailer = { send: async () => {} };                          // dummy: needed, not checked
  const service = createEnrollmentService({ repo, payments, mailer, clock: fixedClock });

  const enrollment = await service.enroll(42, 7);

  // State verification: check the outcome
  assert.deepEqual(enrollment, { id: 1, userId: 42, courseId: 7, chargeId: "ch_123", enrolledAt: fixedClock() });
  assert.equal(repo.enrollments.length, 1);
});

test("enroll sends exactly one welcome email", async () => {
  const mailer = { send: mock.fn(async () => {}) };                 // spy: records its calls
  const service = createEnrollmentService({ repo: fakeRepo(), payments: { charge: async () => ({ id: "ch_1" }) }, mailer });

  await service.enroll(42, 7);

  // Interaction verification: the email *is* the behaviour here
  assert.equal(mailer.send.mock.callCount(), 1);
  assert.deepEqual(mailer.send.mock.calls[0].arguments, [42, "Welcome to System Design!"]);
});

test("if the payment fails, nothing is saved and no email is sent", async () => {
  const repo = fakeRepo();
  const mailer = { send: mock.fn(async () => {}) };
  const payments = { charge: async () => { throw new Error("card declined"); } };
  const service = createEnrollmentService({ repo, payments, mailer });

  await assert.rejects(service.enroll(42, 7), /card declined/);
  assert.equal(repo.enrollments.length, 0);
  assert.equal(mailer.send.mock.callCount(), 0);
});
```

### State verification vs interaction verification

The first test checks the **result** (state verification). The second checks that a **call happened** (interaction verification). Prefer state verification: it keeps passing as long as the behaviour is right, however you restructure the code. Use interaction checks only when the interaction *is* the behaviour: an email must be sent, a card must be charged exactly once. Over-mocking every call is a leading cause of brittle tests that break on harmless refactors.

> **Don't mock what you don't own.** If you mock a third-party SDK directly, your mock encodes your *assumption* of how it behaves, and the test passes while production breaks. Wrap the dependency in your own small interface (like `payments.charge` above), mock that in unit tests, and test the wrapper itself against a fake server or a contract.

## Integration tests

Unit tests prove each piece works alone. **Integration tests** prove the pieces work together, and especially that your code works with the real systems you replaced in unit tests: the database, the cache, the message broker, other services.

Some bugs only integration tests can catch:

- a SQL query with a misspelled column or wrong join
- a column alias that doesn't match what the code expects
- a missing migration or a constraint that rejects valid data
- a transaction that never commits
- a mismatch in how JSON is serialised between services

A mocked database will happily return whatever you tell it. Only a real database can tell you your SQL is wrong.

### Testing against a real database

How do you get a real database in a test without a hand-maintained shared server? **[Testcontainers](https://testcontainers.com/)** starts a real database in a throwaway Docker container ([Chapter 21](/system-design/21-docker-k8s-and-ci-cd/)), gives you its connection string, and removes it afterwards. You test against the same engine and version as production, with nothing to install.

The repository under test:

```js
// src/enrollmentRepo.js: the real repository. Only a real database can tell you if this SQL is right.
export function createEnrollmentRepo(db) {
  return {
    async isEnrolled(userId, courseId) {
      const { rowCount } = await db.query(`SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2`, [userId, courseId]);
      return rowCount > 0;
    },
    async saveEnrollment({ userId, courseId, chargeId, enrolledAt }) {
      const { rows } = await db.query(
        `INSERT INTO enrollments (user_id, course_id, charge_id, enrolled_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id AS "userId", course_id AS "courseId", charge_id AS "chargeId", enrolled_at AS "enrolledAt"`,
        [userId, courseId, chargeId, enrolledAt]);
      return rows[0];
    },
    async listForUser(userId) {
      const { rows } = await db.query(
        `SELECT c.title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = $1 ORDER BY c.title`, [userId]);
      return rows.map((r) => r.title);
    },
    // findCourse omitted
  };
}
```

The tests:

```js
import { test, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";
import { createEnrollmentRepo } from "../../src/enrollmentRepo.js";

let container, pool, client, repo;

before(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();   // a real, throwaway Postgres
  pool = new pg.Pool({ connectionString: container.getConnectionUri() });
  await pool.query(await readFile(new URL("../../db/schema.sql", import.meta.url), "utf8"));
});

after(async () => {
  await pool.end();
  await container.stop();
});

// Each test runs inside a transaction that is rolled back, so tests can't see each other's data.
beforeEach(async () => {
  client = await pool.connect();
  await client.query("BEGIN");
  repo = createEnrollmentRepo(client);
  await client.query(`INSERT INTO courses (id, title, price) VALUES (7, 'System Design', 4999), (8, 'DSA', 2999)`);
});

afterEach(async () => {
  await client.query("ROLLBACK");
  client.release();
});

test("saves an enrollment and lists the user's courses", async () => {
  await repo.saveEnrollment({ userId: 42, courseId: 8, chargeId: "ch_1", enrolledAt: new Date() });
  await repo.saveEnrollment({ userId: 42, courseId: 7, chargeId: "ch_2", enrolledAt: new Date() });

  assert.deepEqual(await repo.listForUser(42), ["DSA", "System Design"]);
  assert.equal(await repo.isEnrolled(42, 7), true);
  assert.equal(await repo.isEnrolled(43, 7), false);
});

test("the database refuses a duplicate enrollment", async () => {
  await repo.saveEnrollment({ userId: 42, courseId: 7, chargeId: "ch_1", enrolledAt: new Date() });
  await assert.rejects(
    repo.saveEnrollment({ userId: 42, courseId: 7, chargeId: "ch_2", enrolledAt: new Date() }),
    { code: "23505" },                                                 // unique_violation
  );
});

test("enrolling in a course that doesn't exist fails", async () => {
  await assert.rejects(
    repo.saveEnrollment({ userId: 42, courseId: 999, chargeId: "ch_1", enrolledAt: new Date() }),
    { code: "23503" },                                                 // foreign_key_violation
  );
});
```

```text
✔ saves an enrollment and lists the user's courses
✔ the database refuses a duplicate enrollment (5.2ms)
✔ enrolling in a course that doesn't exist fails (2.9ms)
ℹ duration_ms 3011
```

Starting the container took about 3 seconds; each test after that took a few milliseconds. Notice what these tests check that the in-memory fake couldn't: the unique constraint and the foreign key are enforced by Postgres, not by our code.

**Keep integration tests isolated.** Each test must start from a known state and leave nothing behind. The two standard techniques are **wrapping each test in a transaction and rolling it back** (fast, used above) or **truncating tables** between tests (needed when the code under test manages its own transactions). Tests that depend on leftover data or run order will eventually fail at random.

> **Test against the real engine.** Swapping in SQLite "because it's faster" when production runs Postgres is a classic trap. Types, constraints, JSON functions, upserts and locking all differ, so a test can pass on SQLite while the same query fails in production. Testcontainers makes the real engine cheap enough to use.

### Testing HTTP handlers

Your routes are another important integration point: you want to send a real HTTP request through routing, middleware, validation and serialisation, and check the real response. **supertest** does this in-process, without deploying anything:

```js
// src/app.js: build the Express app from its dependencies, so tests can pass in fakes.
export function createApp({ enrollmentService }) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.userId = Number(req.get("x-user-id")) || null; next(); });   // stand-in for real auth

  app.post("/courses/:id/enroll", async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: "login required" });
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId <= 0) return res.status(400).json({ error: "invalid course id" });
    try {
      const enrollment = await enrollmentService.enroll(req.userId, courseId);
      res.status(201).json(enrollment);
    } catch (err) {
      if (err instanceof AlreadyEnrolledError) return res.status(409).json({ error: "already enrolled" });
      throw err;
    }
  });

  app.use((err, req, res, next) => res.status(500).json({ error: "internal error" }));
  return app;
}
```

```js
import request from "supertest";

// A fake service lets us test only the HTTP layer: routing, validation, status codes, error format.
const appWith = (enroll) => createApp({ enrollmentService: { enroll } });

test("POST /courses/:id/enroll returns 201 with the enrollment", async () => {
  const app = appWith(async (userId, courseId) => ({ id: 1, userId, courseId }));
  const res = await request(app).post("/courses/7/enroll").set("x-user-id", "42");
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { id: 1, userId: 42, courseId: 7 });
});

test("returns 400 for a non-numeric course id", async () => {
  const res = await request(appWith(async () => {})).post("/courses/abc/enroll").set("x-user-id", "42");
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "invalid course id" });
});

test("maps AlreadyEnrolledError to 409", async () => {
  const app = appWith(async () => { throw new AlreadyEnrolledError("already enrolled"); });
  const res = await request(app).post("/courses/7/enroll").set("x-user-id", "42");
  assert.equal(res.status, 409);
});

test("hides unexpected errors behind a generic 500", async () => {
  const app = appWith(async () => { throw new Error("connection refused to 10.0.3.7"); });
  const res = await request(app).post("/courses/7/enroll").set("x-user-id", "42");
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: "internal error" });   // no internal details leak
});
```

Five tests like these ran in about 15 ms in total. **Choose the scope deliberately**: with a fake service, you test just the web layer, quickly and precisely. Wire in the real service and a Testcontainers database, and the same style of test covers the whole request path.

## Contract testing

With several services, a new risk appears: the provider changes its response format, all of *its* tests still pass, and every consumer breaks in production. Running every combination of services together in end-to-end tests is slow and fragile. **Contract tests** check that both sides agree on the interface without running them together.

![The consumer test writes a contract file, the provider replays it against the real API; renaming a field the consumer uses makes provider verification fail](/images/system-design/contract-testing.svg "Consumer and provider are tested separately against one shared contract.")

With **[Pact](https://docs.pact.io/)**, the consumer's test describes the requests it makes and the responses it needs. Pact runs a mock provider for the test and records a **contract file**:

```js
import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import { createCourseClient } from "./courseClient.js";

const { integer, like } = MatchersV3;
const pact = new PactV3({ consumer: "web-app", provider: "course-api" });

test("web-app can fetch a course from course-api", async () => {
  pact
    .given("course 7 exists")
    .uponReceiving("a request for course 7")
    .withRequest({ method: "GET", path: "/courses/7" })
    .willRespondWith({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { id: integer(7), title: like("System Design"), price: integer(4999) },   // shape matters, not exact values
    });

  await pact.executeTest(async (mockServer) => {
    const course = await createCourseClient(mockServer.url).getCourse(7);   // talks to Pact's mock provider
    assert.deepEqual(course, { id: 7, label: "System Design (₹4999)" });
  });
});
```

The provider's CI replays that contract against the **real** API:

```js
import { Verifier } from "@pact-foundation/pact";

test("course-api honours the web-app contract", async () => {
  await new Verifier({
    provider: "course-api",
    providerBaseUrl: `http://127.0.0.1:${server.address().port}`,
    pactUrls: ["./pacts/web-app-course-api.json"],
    stateHandlers: { "course 7 exists": async () => { courses.set(7, { id: 7, title: "Kafka", price: 2999 }); } },
  }).verifyProvider();
});
```

The provider passed. Then I "refactored" it to return `name` instead of `title`, and the verification failed:

```text
"mismatch":"Actual map is missing the following keys: title"
```

The breaking change was caught in the provider's own pipeline, before deploy, without starting the consumer. Contracts are usually shared through a **Pact Broker**, which also answers "can I safely deploy this version?". For gRPC, the `.proto` file plus breaking-change detection with `buf` plays the same role ([Chapter 13](/system-design/13-grpc-and-inter-service-communication/)), and an OpenAPI spec can do it for REST ([Chapter 25](/system-design/25-openapi-specification/)).

## End-to-end and smoke tests

An **end-to-end test** drives the fully assembled system through its real interface, exactly as a user or client would: real API, real database, real queue, real dependent services. It's the only test that answers "do all the pieces, wired together, actually deliver the result?"

It's also the slowest, flakiest and hardest to debug, because a failure could come from anywhere. So keep end-to-end tests for a few **critical journeys**: sign up → log in → buy a course → access the lesson. Edge cases belong in unit tests. For web apps, Playwright can drive a real browser through those journeys.

A **smoke test** is a tiny end-to-end check run right after every deploy: is `/health` green, can a test user log in, does the course list load? Combined with readiness probes and rollouts ([Chapter 21](/system-design/21-docker-k8s-and-ci-cd/)), a failing smoke test can stop or roll back a deploy. Mature teams go further with **synthetic monitoring** (scripted journeys running against production every few minutes) and canary releases.

## Coverage

**Coverage** measures how much of your code runs during the tests. It's a useful flashlight for finding code that nothing tests, and a terrible measure of test quality.

Node can report it with `--experimental-test-coverage`. Take this function and one test:

```js
export function shippingFee(total, country) {
  let fee = 0;
  if (country !== "IN") fee = 1500;          // international shipping
  return total >= 5000 ? 0 : fee;
}

test("international orders under 5000 pay 1500", () => {
  assert.equal(shippingFee(1000, "US"), 1500);
});
```

```text
# file         | line % | branch % | funcs % | uncovered lines
#  shipping.js | 100.00 |    66.67 |  100.00 |
```

Every **line** ran, but not every **branch**: no test covers domestic shipping or free shipping over ₹5,000. Branch coverage is the more honest number. Now a "test" that asserts nothing:

```js
test("covers everything, checks nothing", () => {
  shippingFee(1000, "US");
  shippingFee(1000, "IN");
  shippingFee(9000, "US");
});
```

```text
#  shipping.js | 100.00 |   100.00 |  100.00 |
```

100% coverage, zero value: it would pass even if `shippingFee` returned the wrong numbers. This is **Goodhart's law**: when a measure becomes a target, it stops being a good measure. Teams forced to hit a coverage percentage write tests like this. Use coverage to **find untested areas**, and judge tests by whether they assert meaningful behaviour.

## Flaky tests

A **flaky test** sometimes passes and sometimes fails without any code change. Flakiness is poison: people learn to "just re-run it", and once nobody trusts a red build, the suite is worthless. A flaky test is arguably worse than no test.

| Cause | Fix |
| --- | --- |
| **Time**: `Date.now()`, timeouts, `sleep`, midnight and month boundaries | inject or fake the clock; wait for a condition instead of sleeping a fixed time |
| **Order dependence**: a test relies on another's leftovers | each test sets up and cleans up its own state; run tests in random order to expose this |
| **Shared state**: globals, a shared database row, singletons | fresh fixtures per test; avoid module-level state |
| **Concurrency**: async timing, races | wait for events or promises, not timers |
| **Real network**: third-party APIs, DNS | replace the boundary with a fake server or stub |
| **Unordered data**: rows without `ORDER BY`, object key order | sort before comparing, or compare as sets |

Every flaky test is hiding some non-determinism. Remove its source. Quarantining a flaky test (skipping it in the gating run) is acceptable only as a short-term measure while you fix it; an automatic "retry until green" just hides the bug, which may be a real race in your production code.

## Fixtures and factories

Tests need data and a known starting state. Two tools keep that setup readable:

- **Fixtures** manage setup and teardown: a database connection, a temporary directory, a logged-in client. In `node:test` these are `before`, `after`, `beforeEach` and `afterEach` hooks, as in the Testcontainers example.
- **Factories** build test objects with sensible defaults, so each test only spells out the fields it cares about:

```js
let nextId = 1;
export function buildUser(overrides = {}) {
  return { id: nextId++, name: "Test User", email: `user${nextId}@example.test`, tier: "free", country: "IN", ...overrides };
}

test("premium users get early access", () => {
  const user = buildUser({ tier: "premium" });   // the one detail this test depends on is visible
  assert.equal(canSeeEarlyAccess(user), true);
});
```

The point is to hide **irrelevant** setup, not the data the test depends on. If a test is about premium users, the word `premium` should appear in the test, not in a shared fixture three files away. Tests whose key data is hidden elsewhere (the "mystery guest") are hard to understand and harder to debug.

## Test-driven development

**TDD** reverses the usual order: write a failing test first, then just enough code to pass it, then clean up, in small loops.

![The TDD loop: write a failing test, make it pass with the simplest code, refactor with tests green, and repeat](/images/system-design/tdd-cycle.svg "Each loop adds one small, tested behaviour.")

Building a `slugify` function this way, the tests come first:

```js
test("turns a course title into a URL slug", () => {
  assert.equal(slugify("System Design: Part 1"), "system-design-part-1");
});
test("collapses repeated separators and trims the ends", () => {
  assert.equal(slugify("  Hello -- World!  "), "hello-world");
});
```

**Red**: with a placeholder implementation, the test fails and shows exactly what's missing:

```text
not ok 1 - turns a course title into a URL slug
  expected: 'system-design-part-1'
  actual: 'System Design: Part 1'
```

**Green**: the simplest code that passes:

```js
export function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
```

**Refactor**: rename, extract, simplify, with the tests guarding every change. Then write the next test (say, for accented characters) and repeat.

TDD's main benefits are about design: code written this way is testable by construction, you think about the interface before the implementation, and refactoring is safe because the test you just wrote protects it. It shines for clear requirements and tricky logic (parsers, pricing rules, algorithms). It's awkward when you're still exploring and don't know the design yet. Many excellent engineers write tests just after the code instead. What matters is that the behaviour ends up well tested.

## Controlling time, randomness and external APIs

Three things change on their own and make tests flaky: the **clock**, **random numbers** and the **network**. The fix for all three is the same: make them dependencies the test controls.

### Time

Code that calls `Date.now()` directly behaves differently on every run. You can inject a clock (as the enrollment service does), or use the test runner's fake timers. `node:test` can freeze `Date` and fast-forward timers:

```js
// src/session.js
export const SESSION_MS = 60 * 60 * 1000;   // 1 hour
export const createSession = (userId) => ({ userId, expiresAt: Date.now() + SESSION_MS });
export const isExpired = (session) => Date.now() >= session.expiresAt;

// Retry with exponential backoff: 1 s, 2 s, 4 s ...
export async function withRetry(fn, { attempts = 4, baseMs = 1000 } = {}) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
    }
  }
}
```

```js
test("a session expires after exactly one hour", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-14T10:00:00Z") });   // freeze the clock
  const session = createSession(42);

  t.mock.timers.tick(SESSION_MS - 1);
  assert.equal(isExpired(session), false);    // 59:59.999 later
  t.mock.timers.tick(1);
  assert.equal(isExpired(session), true);     // exactly 1 hour later
});

test("withRetry backs off 1 s, 2 s, 4 s without the test waiting 7 seconds", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  const flaky = async () => { calls++; if (calls < 4) throw new Error("try again"); return "ok"; };

  const result = withRetry(flaky);
  for (const ms of [1000, 2000, 4000]) {
    await new Promise((r) => setImmediate(r));   // let the failed attempt schedule its timer
    t.mock.timers.tick(ms);                      // jump the fake clock forward
  }
  assert.equal(await result, "ok");
  assert.equal(calls, 4);
});
```

```text
✔ a session expires after exactly one hour (1.16ms)
✔ withRetry backs off 1 s, 2 s, 4 s without the test waiting 7 seconds (5.12ms)
```

Seven seconds of backoff tested in 5 milliseconds, with the exact boundary checked. Randomness works the same way: inject the random function or use a seeded generator so the test always sees the same "random" values.

### External APIs

Never call a real third-party API in unit or integration tests: it's slow, rate-limited, sometimes down, and may have real side effects (like charging a card). Instead, run a **fake server** on a random local port and point your client at it:

```js
// src/paymentsClient.js: our adapter around a third-party payments API.
export class CardDeclinedError extends Error {}

export function createPaymentsClient({ baseUrl, apiKey }) {
  return {
    async charge(userId, amount, idempotencyKey) {
      const res = await fetch(`${baseUrl}/v1/charges`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify({ customer: String(userId), amount, currency: "inr" }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.status === 402) throw new CardDeclinedError((await res.json()).message);
      if (!res.ok) throw new Error(`payments API returned ${res.status}`);
      return res.json();
    },
  };
}
```

```js
import http from "node:http";

let server, baseUrl;
const received = [];
before(async () => {
  server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    received.push({ path: req.url, headers: req.headers, body: JSON.parse(body) });
    const { amount } = JSON.parse(body);
    res.setHeader("content-type", "application/json");
    if (amount === 13) { res.statusCode = 402; return res.end(JSON.stringify({ message: "card declined" })); }
    res.end(JSON.stringify({ id: "ch_test_1", amount, status: "succeeded" }));
  });
  await new Promise((r) => server.listen(0, r));               // port 0: any free port
  baseUrl = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test("sends the right request and returns the charge", async () => {
  const client = createPaymentsClient({ baseUrl, apiKey: "sk_test" });
  const charge = await client.charge(42, 4999, "enroll-42-7");

  assert.deepEqual(charge, { id: "ch_test_1", amount: 4999, status: "succeeded" });
  const req = received.at(-1);
  assert.equal(req.headers.authorization, "Bearer sk_test");
  assert.equal(req.headers["idempotency-key"], "enroll-42-7");
  assert.deepEqual(req.body, { customer: "42", amount: 4999, currency: "inr" });
});

test("turns a 402 into CardDeclinedError", async () => {
  const client = createPaymentsClient({ baseUrl, apiKey: "sk_test" });
  await assert.rejects(client.charge(42, 13, "k1"), CardDeclinedError);
});
```

These tests check the parts that are easy to get wrong: headers, the idempotency key, the body format and error mapping. Libraries like **MSW** and **nock** intercept HTTP calls without a server if you prefer. Most of your code should depend on the small `payments.charge` interface and be tested with simple stubs; only the adapter itself needs HTTP-level tests.

## Performance and load tests

Functional tests prove the code is correct. Performance tests prove it's **fast enough**, which is a different question ([Chapter 18](/system-design/18-scaling-and-performance-part-1/)).

| Kind | Question | Tools |
| --- | --- | --- |
| **Benchmark** | how fast is this function or endpoint? | `tinybench`, `mitata` |
| **Load test** | throughput and latency under sustained concurrent traffic? | k6, autocannon, Artillery, Gatling |
| **Stress test** | where does it break, and how does it fail? | the same tools, pushed past capacity |
| **Soak test** | does it degrade over hours (memory leaks, connection leaks)? | the same tools, for a long time |

A load test is only useful with **targets**. This one fails unless the endpoint meets its SLO:

```js
import autocannon from "autocannon";

test("GET /courses meets its SLO at 100 concurrent connections", async () => {
  const result = await autocannon({ url, connections: 100, duration: 5 });
  console.log(`req/s ${Math.round(result.requests.average)}, p50 ${result.latency.p50} ms, p99 ${result.latency.p99} ms`);

  assert.equal(result.errors + result.non2xx, 0, "no failed requests");
  assert.ok(result.latency.p99 < 100, `p99 ${result.latency.p99} ms should be under 100 ms`);
  assert.ok(result.requests.average > 2000, "should sustain more than 2,000 req/s");
});
```

```text
req/s 4953, p50 19 ms, p99 31 ms, errors 0
✔ GET /courses meets its SLO at 100 concurrent connections (5038ms)
```

Assert on **percentiles**, not averages, and run serious load tests against a production-like environment, not your laptop. Keep them out of the normal test run; schedule them nightly or before big releases.

## Tests in CI/CD

A test suite only protects you if it runs **automatically on every change** and **blocks** the merge or deploy when it fails. That's the test stage of the pipeline from [Chapter 21](/system-design/21-docker-k8s-and-ci-cd/).

Split the suite by speed so the fast feedback stays fast:

```json
{
  "scripts": {
    "test:unit": "node --test \"test/*.test.js\"",
    "test:integration": "node --test \"test/integration/**/*.test.js\"",
    "test:coverage": "node --test --experimental-test-coverage \"test/*.test.js\"",
    "test:load": "node --test \"test/load/*.load.js\""
  }
}
```

- **Unit tests** on every push and pull request; they take seconds.
- **Integration tests** on every pull request too, with Testcontainers or CI service containers.
- **Contract verification** in the provider's pipeline, and a "can I deploy?" check before releasing.
- **Smoke tests** right after each deploy.
- **Load and end-to-end suites** on a schedule or before releases.

**Speed is a feature.** `node --test` already runs test files in parallel; split slow stages, cache dependencies, and keep the main gate under a few minutes. A suite that takes 30 minutes gets skipped, and a skipped test protects nothing.

## A testing strategy

Tests cost time to write, run and maintain, so the goal isn't "test everything", it's **the most confidence for the effort**.

Test heavily:

- **Business rules**: pricing, permissions, validation, state machines. Cheap unit tests with lots of edge cases.
- **Every bug you fix**: add a test that reproduces it first, so it can't come back.
- **Critical paths and money**: authentication, payments, data integrity, at several layers including a thin end-to-end test.
- **Integration seams**: your SQL, serialisation and the contracts between services, where subtle bugs hide.

Test lightly or not at all:

- **Trivial code**: simple getters, framework wiring, generated code.
- **Third-party libraries**: test how *you* use them, not their internals.
- **Implementation details**: private helpers and exact call sequences.

> **The golden rule: test behaviour, not implementation.** Tests that check what the code does keep passing through refactors as long as the behaviour holds, which is exactly the confidence to change that justified writing them. Tests that check how it does it break on every improvement, and eventually get deleted.

## Quick revision

| Concept | Remember |
| --- | --- |
| Why test | confidence to change, living documentation, regression net, fast feedback |
| Pyramid | many unit, some integration, few end-to-end; avoid the ice-cream cone |
| AAA | arrange, act, assert; one behaviour per test; descriptive names |
| Unit tests | one unit, no I/O, milliseconds; target pure logic |
| Table-driven | one test body, many named cases |
| Test doubles | dummy, stub, spy, mock, fake; prefer state verification |
| Dependency injection | pass collaborators in; the seam where doubles go |
| Don't mock what you don't own | wrap third-party APIs in your own interface |
| Integration | real database and HTTP; catches SQL, constraint and wiring bugs |
| Testcontainers | real engine in a throwaway container; roll back or truncate per test |
| HTTP tests | supertest drives the app in-process |
| Contract tests | consumer writes a contract, provider verifies it (Pact) |
| End-to-end | critical journeys only; smoke tests after deploy |
| Coverage | finds untested code; branch > line; never a target |
| Flaky tests | hidden non-determinism; fix the cause, don't retry |
| Fixtures and factories | hooks for setup; builders with visible overrides |
| TDD | red, green, refactor; a design tool |
| Time and network | fake timers, injected clocks, fake servers |
| Load tests | assert percentiles against an SLO |
| CI | tests gate every merge; keep the main gate fast |

## Interview questions

1. Why write automated tests? What do they give you beyond catching bugs?
2. Explain the testing pyramid. What is the ice-cream cone anti-pattern?
3. What makes a good unit test?
4. What's the difference between a stub, a spy, a mock and a fake?
5. When would you use interaction verification instead of state verification?
6. How does dependency injection make code testable?
7. What does "don't mock what you don't own" mean?
8. What kinds of bugs can only integration tests catch?
9. How would you test database code? Why not use SQLite in tests when production uses Postgres?
10. How do you keep integration tests isolated from each other?
11. How would you test an Express route's status codes and error handling?
12. What problem does contract testing solve? How does consumer-driven contract testing work?
13. When are end-to-end tests worth it? What is a smoke test?
14. Is 100% code coverage a good goal? What's the difference between line and branch coverage?
15. What causes flaky tests and how do you fix them?
16. Explain TDD. When does it work well and when doesn't it?
17. How do you test code that depends on the current time or on `setTimeout`?
18. How do you test a client for a third-party API without calling the real API?
19. What's the difference between a benchmark, a load test, a stress test and a soak test?
20. How would you organise tests in a CI pipeline?

## Further reading

- [Node.js test runner documentation](https://nodejs.org/api/test.html)
- [Martin Fowler: The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) and [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)
- [Testcontainers for Node.js](https://node.testcontainers.org/)
- [Pact documentation](https://docs.pact.io/)
- [supertest](https://github.com/ladjs/supertest), [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/)
- [Google Testing Blog: Flaky tests](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)
- [k6 documentation](https://grafana.com/docs/k6/latest/)

Next: [Chapter 23, Message Brokers and Kafka](/system-design/23-message-brokers-and-kafka/).
