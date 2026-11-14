---
title: The OpenAPI Specification
description: Turn your API contract into a machine-readable file. Why API docs drift, what OpenAPI is, the structure of a spec, paths, parameters, schemas, responses and security schemes, interactive docs, linting, validating requests and responses at runtime, design-first vs code-first, generated TypeScript clients, catching breaking changes in CI, and exposing operations to AI agents safely, all tested with real tools.
author: Bitwise School
---

Every API starts as an agreement between two people. Asha builds the server; Rohan builds the app that calls it. At first the contract lives in Asha's head, a Slack thread, or a README. It works, until it doesn't.

The failure is always the same: **drift**. Asha renames a field. Rohan's app breaks. Asha says it wasn't a breaking change; Rohan says his code depended on it. A README was never a contract, just a conversation that went stale. The real cost isn't the bug, it's the hours spent arguing about what the API actually does.

**OpenAPI** (formerly Swagger) fixes this by making the contract a **machine-readable file**: one YAML or JSON document describing every endpoint, input, output, status code and auth requirement. Docs are generated from it. Requests are validated against it. Client code is generated from it. CI compares versions of it and blocks breaking changes. A contract that machines can read is a contract machines can enforce.

> **Replace "let's document the API" with "let's spec the API".** A document is something people read and forget to update. A spec is something tools check on every commit.

Every tool in this chapter was run against the same spec: Redocly for linting, `express-openapi-validator` for runtime validation, Swagger UI for docs, `openapi-typescript` for generated types, `oasdiff` for breaking changes, and `zod-to-openapi` for the code-first approach.

## What OpenAPI is

The **OpenAPI Specification (OAS)** is a standard, language-independent way to describe HTTP APIs:

- which **endpoints** exist and which HTTP methods they support
- what **inputs** they accept: path, query, header and cookie parameters, and request bodies
- what **outputs** they return: status codes, headers and bodies
- how to **authenticate**: API keys, bearer tokens, OAuth 2
- what the **data looks like**, using JSON Schema

It began as the **Swagger** specification, created by Tony Tam at Wordnik around 2010 to generate documentation automatically. In 2015 it was donated to the **OpenAPI Initiative** under the Linux Foundation and renamed. "Swagger" now refers to a family of tools (Swagger UI, Swagger Editor); "a Swagger spec" usually means an OpenAPI document. Version **3.1** aligned its schemas fully with JSON Schema and is the one most tools support well; 3.2 is the newest.

OpenAPI caught on because it solves three problems every API team hits at once: documentation that goes stale, testing that's mostly manual, and client code that's copy-pasted instead of generated.

## The anatomy of a spec

![The top-level keys of an OpenAPI document: info, servers, security, paths, components and tags, with paths referencing component schemas](/images/system-design/openapi-anatomy.svg "Paths describe operations; components hold the shapes they share.")

| Key | Purpose | Required |
| --- | --- | --- |
| `openapi` | the spec version, e.g. `3.1.0` | yes |
| `info` | title, API version, description, contact, license | yes |
| `servers` | base URLs for production, staging, local | no |
| `paths` | every endpoint, its methods, parameters and responses | in practice |
| `components` | reusable schemas, responses, parameters and security schemes | no |
| `security` | the default authentication for all operations | no |
| `tags` | groups operations in the docs | no |

Here's the start of the spec used throughout this chapter, for a course API:

```yaml
openapi: 3.1.0
info:
  title: Bitwise Course API
  version: 1.2.0
  description: |
    Courses and enrollments for Bitwise School.

    **Changelog**
    - 1.2.0: added `level` filter to `GET /courses`
servers:
  - url: https://api.bitwise.example/v1
    description: Production
  - url: http://localhost:3000/v1
    description: Local development
security:
  - bearerAuth: []                       # every operation needs a token unless it says otherwise
```

`info.version` is the version of **your API**, not of OpenAPI. Bump it with every change so anyone holding a copy knows which contract they have. Descriptions support Markdown, so changelogs and usage notes can live in the spec itself.

## Paths, parameters and responses

Each key under `paths` is a URL pattern; under it, each HTTP method is an **operation**:

```yaml
paths:
  /courses:
    get:
      operationId: listCourses
      summary: List published courses
      tags: [Courses]
      security: []                       # public: overrides the global requirement
      parameters:
        - name: level
          in: query
          description: Only return courses at this level.
          schema: { type: string, enum: [beginner, intermediate, advanced] }
        - name: limit
          in: query
          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
      responses:
        "200":
          description: A page of courses.
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items: { $ref: "#/components/schemas/Course" }
        "400": { $ref: "#/components/responses/BadRequest" }
    post:
      operationId: createCourse
      summary: Create a course
      tags: [Courses]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/NewCourse" }
      responses:
        "201":
          description: The created course.
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Course" }
        "400": { $ref: "#/components/responses/BadRequest" }
        "401": { $ref: "#/components/responses/Unauthorized" }

  /courses/{courseId}/enrollments:
    parameters:
      - name: courseId
        in: path
        required: true
        schema: { type: integer, minimum: 1 }
    post:
      operationId: enrollInCourse
      summary: Enroll the current user in a course
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          description: A unique key per attempt, so retries never enroll or charge twice.
          schema: { type: string, minLength: 8, maxLength: 64 }
      responses:
        "201":
          description: Enrolled.
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Enrollment" }
        "409":
          description: Already enrolled.
          content:
            application/problem+json:
              schema: { $ref: "#/components/schemas/Problem" }
```

Things to notice:

- **`operationId`** is a unique name for each operation. Code generators turn it into function names (`listCourses()`), and AI agents use it as a tool name, so choose names carefully.
- **`in`** says where a parameter lives: `path`, `query`, `header` or `cookie`. Path parameters are always required.
- **Request bodies** are separate from parameters and only for methods that carry a body.
- **Responses are keyed by status code**, each with a description and a schema per content type. Document the success case and every error a client must handle, not just `200`. The errors here use the standard problem-details format (`application/problem+json`, [Chapter 12](/system-design/12-error-handling-and-fault-tolerance/)).
- Enums, minimums and maximums aren't decoration. As you'll see, they're enforced at runtime.

### Reusable components

Shapes used in several places are defined once under `components` and referenced with `$ref`:

```yaml
components:
  schemas:
    Course:
      type: object
      required: [id, title, level, priceInPaise]
      properties:
        id: { type: integer, readOnly: true, examples: [7] }
        title: { type: string, minLength: 3, maxLength: 120, examples: ["System Design"] }
        level: { type: string, enum: [beginner, intermediate, advanced] }
        priceInPaise: { type: integer, minimum: 0, description: "Price in paise (₹1 = 100 paise).", examples: [499900] }
        tags: { type: array, items: { type: string }, maxItems: 10 }
      additionalProperties: false
    NewCourse:
      type: object
      required: [title, level, priceInPaise]
      properties:
        title: { type: string, minLength: 3, maxLength: 120 }
        level: { type: string, enum: [beginner, intermediate, advanced] }
        priceInPaise: { type: integer, minimum: 0 }
        tags: { type: array, items: { type: string }, maxItems: 10 }
      additionalProperties: false
  responses:
    NotFound:
      description: No such resource.
      content:
        application/problem+json:
          schema: { $ref: "#/components/schemas/Problem" }
```

`readOnly: true` marks fields the server sets (clients never send `id`). `examples` show up in the generated docs. `additionalProperties: false` rejects unknown fields. Storing money as an integer number of paise avoids floating-point rounding errors ([Chapter 8](/system-design/08-databases/)).

## Authentication and security schemes

Security schemes are declared once in `components` and applied globally or per operation:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

| Type | Where the credential goes | Typical use |
| --- | --- | --- |
| `apiKey` | a header, query parameter or cookie | server-to-server keys like `X-API-Key` |
| `http` | the `Authorization` header | bearer tokens (JWT), basic auth |
| `oauth2` | OAuth 2 flows, with scopes | delegated third-party access |
| `openIdConnect` | discovered from an OpenID provider | sign-in with an identity provider |

The top-level `security` makes every operation require a bearer token. An operation that sets `security: []` (an empty list) is explicitly public, like `GET /courses` above. For OAuth 2, the list inside each requirement names the scopes the caller needs ([Chapter 4](/system-design/04-authentication-and-authorization/)).

## Linting the spec

A spec can be valid YAML and still be wrong or sloppy. Linters check it against the OpenAPI rules plus style rules. Running **Redocly CLI** on the spec:

```bash
npx @redocly/cli lint openapi.yaml
```

```text
[1] openapi.yaml:2:1 at #/info
Info object should contain `license` field.
[2] openapi.yaml:13:10 at #/servers/1/url
Server `url` should not point to example.com or localhost.
[3] openapi.yaml:16:5 at #/tags/0/description
Tag object should contain `description` field.
...
Woohoo! Your API description is valid. 🎉
You have 4 warnings.
```

The spec is valid; the warnings are style suggestions you can fix or switch off in a config file. Real errors, like a `$ref` to a schema that doesn't exist, fail the command. **Spectral** is the other popular linter, and both let you add house rules, such as "every operation must have an `operationId`" or "every endpoint must document a 4xx response".

## Interactive documentation

The most visible benefit: tools render the spec into documentation where people can browse every endpoint, see example payloads and **try requests** from the browser. **Swagger UI**, **Redoc** and **Scalar** all read the same file. In Express:

```js
import swaggerUi from "swagger-ui-express";

app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));   // interactive docs from the same file
app.get("/openapi.json", (req, res) => res.json(spec));     // the raw spec, for tools and clients
```

Because the docs come from the spec, they change the moment the spec changes. Frontend, mobile, QA and partner teams all get a current, interactive reference instead of a wiki page last edited two years ago. Decide deliberately whether production docs are public; internal APIs often serve them only on internal networks.

## Validating requests and responses at runtime

Here's where a spec stops being documentation and becomes an enforced contract. `express-openapi-validator` reads the spec and checks every request **before your handler runs**, and can check every response **before it leaves**:

```js
import express from "express";
import * as OpenApiValidator from "express-openapi-validator";

const app = express();
app.use(express.json());

app.use(OpenApiValidator.middleware({
  apiSpec: spec,
  validateRequests: { allowUnknownQueryParameters: false, allErrors: true },
  validateResponses: true,                                          // catches drift between code and contract
  validateSecurity: { handlers: { bearerAuth: (req) => verifyJwt(req.get("authorization")) } },
  ignoreUndocumented: false,                                        // routes missing from the spec are rejected
}));

const v1 = express.Router();
v1.get("/courses", (req, res) => {
  const { level, limit } = req.query;                               // already validated and coerced: limit is a number
  res.json({ data: courses.filter((c) => !level || c.level === level).slice(0, limit) });
});
app.use("/v1", v1);

// Turn validation errors into problem-details responses
app.use((err, req, res, next) => {
  res.status(err.status ?? 500).type("application/problem+json").json({
    type: "/problems/validation",
    title: err.status === 500 ? "Response did not match the API contract" : "Invalid request",
    status: err.status ?? 500,
    detail: err.errors?.map((e) => `${e.path} ${e.message}`).join("; ") ?? err.message,
  });
});
```

Sending a range of requests to it:

```text
list, valid filter             200 {"data":[{"id":7,"title":"System Design","level":"intermediate",...}]}
list, bad enum                 400 "/query/level must be equal to one of the allowed values: beginner, intermediate, advanced"
list, unknown query param      400 "/query/sort Unknown query parameter 'sort'"
create without token           401 "/v1/courses Authorization header required"
create with bad body           400 "/body/title must NOT have fewer than 3 characters; /body/priceInPaise must be >= 0"
create, valid                  201 {"id":8,"title":"Kafka","level":"advanced","priceInPaise":299900}
get, non-numeric id            400 "/params/courseId must be integer"
undocumented route             404 "/v1/admin/stats not found"
```

None of those rules is written in the route handlers. Validation, type coercion, auth checks and "this route doesn't exist" all come from the spec. That's the input validation from [Chapter 5](/system-design/05-validations-and-transformations/), driven by the contract. (One detail I hit: the validated `courseId` is still a string in `req.params` inside a sub-router, so convert it with `Number()`.)

**Response validation catches drift.** I made one handler return `price` in rupees instead of `priceInPaise`, the kind of "quick fix" that breaks every client:

```text
handler drifted from spec      500 "Response did not match the API contract": "/response/priceInPaise must have required property 'priceInPaise'"
```

The broken response never reached a client. Response validation costs CPU, so many teams turn it on in development, tests and staging, and off (or sampled) in production.

## Design-first vs code-first

There are two ways to get a spec.

![Design-first writes the spec before code and generates from it; code-first generates the spec from route code and schemas; both validate against it in CI](/images/system-design/design-vs-code-first.svg "Two starting points, one destination: a spec that is checked on every change.")

### Design-first

Write `openapi.yaml` **before** any server code. Review it with the people who'll use the API, then generate types and mock servers from it and implement the server to match.

- The contract is agreed before anyone builds, so frontend and backend can work **in parallel** against a mock.
- The spec is a real design artifact, reviewed in pull requests like code.
- It's the natural fit for public APIs and many teams sharing one API.
- The cost: you maintain the spec and the code, so you need validation (above) to keep them honest.

### Code-first

Write the routes and schemas in code and **generate** the spec from them. Frameworks like NestJS, Fastify and FastAPI do this from their decorators or route schemas. In Express, **zod-to-openapi** turns the same Zod schemas you validate with into OpenAPI:

```js
import { z } from "zod";
import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

const Level = z.enum(["beginner", "intermediate", "advanced"]);
const NewCourse = registry.register("NewCourse", z.object({
  title: z.string().min(3).max(120),
  level: Level,
  priceInPaise: z.number().int().min(0).openapi({ description: "Price in paise (₹1 = 100 paise).", example: 499900 }),
}).strict());
const Course = registry.register("Course", z.object({ ...NewCourse.shape, id: z.number().int() }).strict());

registry.registerPath({
  method: "post",
  path: "/courses",
  operationId: "createCourse",
  request: { body: { content: { "application/json": { schema: NewCourse } } } },
  responses: {
    201: { description: "The created course.", content: { "application/json": { schema: Course } } },
    400: { description: "The request was invalid." },
  },
});

const doc = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: "3.1.0",
  info: { title: "Bitwise Course API", version: "1.2.0" },
});
```

The generated `NewCourse` schema has the right types, limits, enum, description and `additionalProperties: false`, and the same Zod object validates requests in the handler, so the two can't disagree.

**Check the generated output anyway.** My first version built `Course` with `NewCourse.extend({ id: ... })`. Zod accepted a valid course, but the generated schema was an `allOf` of two closed objects, and a JSON Schema validator **rejected the same course** with "must NOT have additional properties". Building `Course` as a fresh object (as above) fixed it. Generated specs can contain surprises like this, which is one more reason to validate real responses against them in tests.

- Code-first keeps the spec in sync automatically and is faster for small teams.
- The trade-off: the API's shape gets decided while coding, without a design review, and the spec can leak implementation details.

### Which to choose

| | Design-first | Code-first |
| --- | --- | --- |
| Team | several teams, separate frontend | solo or one small team |
| API | stable, long-lived, public or partner-facing | internal, changing quickly |
| Priority | agreement before building | speed |

Many teams mix them: design the first version of the contract by hand, then generate it from code, with CI checking that the generated spec still matches the agreed one.

## Generated, type-safe clients

A spec is input for code generators. **openapi-typescript** turns it into TypeScript types with no runtime cost:

```bash
npx openapi-typescript openapi.yaml -o api.d.ts
```

```ts
// part of the generated api.d.ts
Course: {
    /** @example 7 */
    readonly id: number;
    /** @example System Design */
    title: string;
    /** @enum {string} */
    level: "beginner" | "intermediate" | "advanced";
    /**
     * @description Price in paise (₹1 = 100 paise).
     * @example 499900
     */
    priceInPaise: number;
    tags?: string[];
};
```

**openapi-fetch** uses those types to make every call type-checked: paths, parameters, bodies and responses.

```ts
import createClient from "openapi-fetch";
import type { paths } from "./api.js";

const api = createClient<paths>({ baseUrl: "https://api.bitwise.example/v1" });

export async function cheapestIntermediate() {
  const { data, error } = await api.GET("/courses", { params: { query: { level: "intermediate", limit: 10 } } });
  if (error) throw new Error("failed to list courses");
  return data.data.sort((a, b) => a.priceInPaise - b.priceInPaise)[0];
}

export async function mistakes() {
  await api.GET("/courses", { params: { query: { level: "expert" } } });                       // not in the enum
  const { data } = await api.GET("/courses/{courseId}", { params: { path: { courseId: 7 } } });
  console.log(data?.price);                                                                    // the field is priceInPaise
  await api.POST("/courses", { body: { title: "Kafka", level: "advanced" } });                // priceInPaise is required
}
```

```text
client.ts(14,50): error TS2322: Type '"expert"' is not assignable to type '"beginner" | "intermediate" | "advanced" | undefined'.
client.ts(16,21): error TS2339: Property 'price' does not exist on type '{ readonly id: number; title: string; ... priceInPaise: number; ... }'.
client.ts(17,32): error TS2322: Type '{ title: string; level: "advanced"; }' is not assignable to type '{ title: string; level: ...; priceInPaise: number; ... }'.
  Property 'priceInPaise' is missing in type '{ title: string; level: "advanced"; }' but required in type ...
```

All three mistakes were caught by the compiler, before anything ran. When the spec changes, regenerate the types, and TypeScript points at every line that needs updating. (`openapi-typescript` uses the TypeScript 5 compiler API, so pin `typescript@5` alongside it.)

Other generators: **openapi-generator** produces clients and server stubs for dozens of languages, and **Orval** generates TypeScript clients with React Query hooks.

## Keeping the spec honest

A stale spec is worse than none, because people trust it. Four habits keep it accurate.

![A single OpenAPI file feeds interactive docs, linting, breaking-change checks, typed clients, request and response validation, mocks and AI tool definitions](/images/system-design/openapi-uses.svg "Everything checks against one file, so nothing can drift silently.")

**1. Keep it in git, next to the code.** Changes to the API and the spec go in the same pull request and get reviewed together.

**2. Validate at runtime and in tests**, as shown above. Contract tests ([Chapter 22](/system-design/22-automated-testing/)) and tools like **Prism** (a mock server and validating proxy built from the spec) and **Schemathesis** (generates requests from the spec to find crashes) check the implementation against the contract.

**3. Block breaking changes in CI.** **oasdiff** compares two versions of a spec. I made a "v2" that renamed `priceInPaise` to `price`, lowered the maximum `limit` from 100 to 50, and added an optional `q` search parameter and an optional `rating` field:

```bash
oasdiff breaking openapi.yaml openapi-v2.yaml --fail-on ERR
```

```text
4 changes: 4 error, 0 warning, 0 info
error	[request-parameter-max-decreased]
	in API GET /courses
		for the `query` request parameter `limit`, the max was decreased from `100.00` to `50.00`

error	[response-required-property-removed]
	in API GET /courses
		removed the required property `data/items/priceInPaise` from the response with the `200` status
...
```

It flagged exactly the two breaking changes (the renamed field shows up once per operation that returns a course) and exited with code 1, which fails the pipeline. The additions appeared only in the full changelog, as harmless `info` items:

```text
info	[new-optional-request-parameter]
		added the new optional `query` request parameter `q`
info	[response-optional-property-added]
		added the optional property `data/items/rating` to the response with the `200` status
```

That's the versioning rule from [Chapter 7](/system-design/07-api-design-rest/), enforced by a machine: adding optional things is fine; removing, renaming or tightening breaks clients and needs a new version or a deprecation period.

**4. Version deliberately.** Bump `info.version` on every change, keep a changelog in the description, and mark old operations or fields `deprecated: true` before removing them.

## OpenAPI for AI agents

An AI agent is another API client: it picks an operation, fills in arguments and reads the response. OpenAPI gives an agent runtime a precise description of what operations exist and what they accept, which is why tool-calling frameworks can import specs. But a spec describes **what an operation does**, not **who may call it**. The application must still enforce permissions and limits.

A safe adapter exposes a small **allowlist** of operations as tools, validates every argument the model proposes against the spec's schema, and builds the URL itself from the spec:

```js
const ALLOWED = new Set(["listCourses", "getCourse"]);                 // read-only operations only

// Build tool definitions + a trusted registry of (method, path) from the spec.
for (const [path, item] of Object.entries(spec.paths)) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const op = item[method];
    if (!op || !ALLOWED.has(op.operationId)) continue;
    const params = [...(item.parameters ?? []), ...(op.parameters ?? [])];
    const input_schema = {
      type: "object",
      properties: Object.fromEntries(params.map((p) => [p.name, { ...p.schema, description: p.description }])),
      required: params.filter((p) => p.required).map((p) => p.name),
      additionalProperties: false,
    };
    tools.push({ name: op.operationId, description: op.summary, input_schema });
    registry.set(op.operationId, { method: method.toUpperCase(), path, params, validate: ajv.compile(input_schema) });
  }
}

// Execute a tool call the model proposed. The model never builds URLs.
async function runTool({ name, input }) {
  const op = registry.get(name);
  if (!op) return { error: `tool ${name} is not available` };
  if (!op.validate(input)) return { error: `invalid arguments: ${op.validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ")}` };
  // ...fill path and query parameters from `input`, call the API with a timeout, return status and body
}
```

Four proposed tool calls:

```text
listCourses({"level":"intermediate","limit":3}) -> {"status":200,"body":{"data":[{"id":7,"title":"System Design",...}]}}
getCourse({"courseId":"7; DROP TABLE courses"}) -> {"error":"invalid arguments: /courseId must be integer"}
createCourse({"title":"Free course","level":"beginner","priceInPaise":0}) -> {"error":"tool createCourse is not available"}
getCourse({"courseId":7,"url":"http://169.254.169.254/latest/meta-data"}) -> {"error":"invalid arguments: / must NOT have additional properties"}
```

The legitimate call worked. The injection attempt failed schema validation, the write operation wasn't on the allowlist, and an attempt to smuggle in a URL (pointing at a cloud metadata endpoint) was rejected as an unknown argument. None of those three reached the API.

Rules for agent tool calls:

- **Expose an allowlist**, not your whole spec. Leave out admin and destructive operations.
- **Authorize on the server** as the end user, for every call. The model choosing a tool is never proof the user may use it.
- **Separate reads from writes.** Reads can run automatically; creating, deleting, paying or changing permissions should need confirmation.
- **Validate twice**: arguments before calling, responses before handing them back to the model.
- **Limit execution**: timeouts, rate limits, idempotency keys, response size limits, and a maximum number of steps per task.
- **Log decisions**: user, chosen `operationId`, sanitised arguments, result and latency.

Good `operationId`s, summaries, descriptions, enums and examples help twice: people read better docs, and models choose and fill in tools more accurately. [Chapter 26](/system-design/26-ai-agents-and-loop-engineering/) covers agents in depth.

## Summary

OpenAPI isn't a documentation tool; it's a **contract language**. Write the spec (or generate it), lint it, serve docs from it, validate requests and responses against it, generate clients from it, and block breaking changes with it. Teams that work this way stop arguing about what the API does and spend that time building.

A sensible starting point for a new Node.js API: define request and response schemas with Zod, generate the spec with zod-to-openapi (or use NestJS or Fastify, which do it for you), serve Swagger UI or Scalar, validate in tests, and add `oasdiff` to CI. As more teams depend on the API, move toward design-first, where the reviewed spec drives everything.

## Quick revision

| Concept | Remember |
| --- | --- |
| Problem | API docs drift; a machine-readable contract can be enforced |
| OpenAPI | standard description of HTTP APIs; formerly Swagger; 3.1 uses JSON Schema |
| Top-level keys | `openapi`, `info`, `servers`, `paths`, `components`, `security`, `tags` |
| Operation | method + path; `operationId`, parameters, requestBody, responses |
| Parameters | `in`: path, query, header, cookie; path params always required |
| Components | reusable schemas and responses via `$ref` |
| Security | `securitySchemes`; global `security`; `security: []` = public |
| Lint | Redocly or Spectral, plus house rules |
| Docs | Swagger UI, Redoc, Scalar from the same file |
| Runtime validation | `express-openapi-validator` checks requests, auth and responses |
| Design-first | spec first, review, generate mocks and types, implement |
| Code-first | generate the spec from code (zod-to-openapi, NestJS, Fastify); check the output |
| Typed clients | `openapi-typescript` + `openapi-fetch`; errors at compile time |
| Breaking changes | `oasdiff breaking --fail-on ERR` in CI |
| AI agents | allowlist, validate arguments, trusted URLs, authorize on the server |

## Interview questions

1. What problem does OpenAPI solve? How is a spec different from documentation?
2. What's the relationship between Swagger and OpenAPI?
3. Describe the main sections of an OpenAPI document.
4. What is an `operationId` and why does it matter?
5. Where can parameters live? How do you describe a request body?
6. Why use `components` and `$ref`?
7. How do you describe authentication? How do you make one endpoint public when security is required globally?
8. How can an OpenAPI spec be enforced at runtime?
9. Compare design-first and code-first. When would you choose each?
10. How do generated TypeScript clients help frontend teams?
11. Which API changes are breaking and which aren't? How would you catch breaking changes automatically?
12. How do you keep a spec from drifting away from the implementation?
13. What are the risks of exposing an OpenAPI spec's operations to an AI agent, and how do you limit them?

## Further reading

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) and [Learn OpenAPI](https://learn.openapis.org/)
- [Redocly CLI](https://redocly.com/docs/cli/) and [Spectral](https://github.com/stoplightio/spectral)
- [express-openapi-validator](https://github.com/cdimascio/express-openapi-validator)
- [openapi-typescript and openapi-fetch](https://openapi-ts.dev/)
- [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
- [oasdiff](https://github.com/oasdiff/oasdiff)
- [Swagger UI](https://swagger.io/tools/swagger-ui/), [Redoc](https://github.com/Redocly/redoc) and [Scalar](https://github.com/scalar/scalar)

Next: [Chapter 26, AI Agents and Loop Engineering](/system-design/26-ai-agents-and-loop-engineering/).
