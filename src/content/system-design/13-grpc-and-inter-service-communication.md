---
title: gRPC and Inter-Service Communication
description: Call a function on another machine as if it were local. What RPC is, Protocol Buffers and how they encode, HTTP/2 underneath, the four call types, code generation, channels and stubs, metadata, deadlines and cancellation, status codes, interceptors, TLS and mTLS, load balancing, gRPC vs REST, and browser options, with Node.js code.
author: Bitwise School
---

When your backend grows into several services (orders, payments, notifications, search), they spend all day calling each other. REST with JSON works, but for high-volume internal traffic many teams use **gRPC**.

> **gRPC** lets a program call a function that lives on another machine **as if it were a local function**: typed methods defined in a **Protocol Buffers** contract, sent as compact **binary**, over **HTTP/2**.

You write `client.GetCourse({ id: 42 })`. Behind that one line, the argument is serialized, sent across the network, run on a server, and the result comes back. The name stands for "gRPC Remote Procedure Call" (a recursive joke). The part that matters is **remote procedure call**.

The Node.js examples use `@grpc/grpc-js` and `@grpc/proto-loader`, and were run as a real client and server.

## REST models nouns, gRPC models verbs

REST gives you **resources** (rooms) with a fixed set of things you can do to each one (GET, POST…). gRPC gives you a **remote control with labelled buttons**: `GetCourse`, `ChargeCard`, `SendOtp`. You don't think about URLs. You call a method.

Three facts define gRPC, and everything else follows from them:

1. **Contract first.** You describe the API in a `.proto` file, and client and server code are **generated** from it.
2. **Protocol Buffers.** Data is encoded in a compact binary format, not text.
3. **HTTP/2.** Many calls share one connection, and streaming in both directions is built in.

## Why gRPC exists

Google built it (open-sourced in 2015, based on an internal system called Stubby) for service-to-service traffic at enormous scale:

| Pain with REST + JSON | What gRPC does |
| --- | --- |
| JSON is bulky (field names repeated in every object) and slow to parse | binary Protobuf: field numbers instead of names, compact integers; typically several times smaller and faster |
| the contract lives in docs, and drifts from the code | the `.proto` *is* the contract; both sides generate code from it, so mismatches show up at build time |
| streaming needs extras (SSE, WebSockets, polling) | four call types, including full two-way streaming |
| every language hand-writes its own client | one `.proto` generates clients and servers for Go, Java, Python, Node, C++, Rust and more |
| HTTP/1.1 connection overhead | HTTP/2 runs many calls at once over one long-lived connection |

**The honest scope:** gRPC shines for **internal, machine-to-machine** calls where you control both ends: microservices, backend to backend, sometimes mobile app to backend. It's weaker for public, browser-facing APIs (browsers can't speak it natively) and for anything people want to debug with `curl` or cache with a CDN. A common summary: **gRPC is the internal nervous system; REST is the public front door.** You'll find gRPC inside Kubernetes, etcd, Envoy, CockroachDB, service meshes, and the internal call graphs of most large payment and consumer platforms.

## How a remote call works

A local function call and a remote one differ in one place: between "call" and "run", the arguments must cross a network. RPC hides that with two pieces of generated code: a **stub** in the client and a **skeleton** (service base) in the server.

![Client code calls a generated stub that encodes protobuf and sends it over an HTTP/2 stream to a server skeleton that decodes it and runs the handler](/images/system-design/grpc-call-anatomy.svg "The stub and skeleton are generated from the .proto file, so you never write networking code.")

**Don't forget the network is there.** This is the classic RPC trap. A local call can't time out, disappear or arrive twice. A remote call can do all three. That's why gRPC gives you tools a local call never needs: **deadlines**, **status codes**, **retries** and **cancellation**. Treat every remote call as "a local call that can fail in network-shaped ways": always set a deadline, always handle errors, and don't call remote methods in a tight loop.

## Protocol Buffers: the contract

**Protocol Buffers** (protobuf) is two things: an **interface definition language** for describing messages and services, and a **binary format** for encoding them. Here is the contract used throughout this chapter:

```protobuf
syntax = "proto3";

package course.v1;

service CourseService {
  // Unary: one request, one response
  rpc GetCourse(GetCourseRequest) returns (Course);
  // Server streaming: one request, many responses
  rpc ListLessons(ListLessonsRequest) returns (stream Lesson);
  // Client streaming: many requests, one response
  rpc UploadProgress(stream ProgressEvent) returns (ProgressSummary);
  // Bidirectional streaming: both sides send whenever they like
  rpc Doubts(stream ChatMessage) returns (stream ChatMessage);
}

enum Level {
  LEVEL_UNSPECIFIED = 0;   // the first enum value must be 0
  LEVEL_BEGINNER = 1;
  LEVEL_INTERMEDIATE = 2;
  LEVEL_ADVANCED = 3;
}

message Course {
  int64 id = 1;              // field numbers, not names, go on the wire
  string title = 2;
  Level level = 3;
  repeated string tags = 4;  // a list
  optional int32 price = 5;  // "optional" lets you tell 0 apart from "not set"
  reserved 6;                // a removed field: its number can never be reused
}

message GetCourseRequest { int64 id = 1; }
message ListLessonsRequest { int64 course_id = 1; }
message Lesson { int32 position = 1; string title = 2; int32 minutes = 3; }
message ProgressEvent { int64 lesson_id = 1; int32 seconds_watched = 2; }
message ProgressSummary { int32 events = 1; int32 total_seconds = 2; }
message ChatMessage { string from = 1; string text = 2; }
```

### The rules that actually bite

- **Field numbers are the real identity, not names.** On the wire, `title` is sent as "field 2", never as the text "title". The name is for your code; the number is the contract.
- **Never change or reuse a field number.** Renaming a field is safe; changing its number or type corrupts data for anyone still on the old version. When you delete a field, mark its number `reserved` so nobody can reuse it.
- **Adding fields is backwards compatible.** Use a new number. Old clients ignore fields they don't know, and servers treat a missing field as unset. This is how gRPC APIs evolve without breaking deployed clients, just like additive changes in REST ([Chapter 07](/system-design/07-api-design-rest/)).
- **proto3 has defaults, not nulls.** An unset `string` reads as `""`, an `int32` as `0`, a `bool` as `false`. To tell "not set" apart from "zero", mark the field `optional` (like `price` above).

| Construct | Meaning |
| --- | --- |
| scalars | `int32`, `int64`, `uint32`, `sint32` (efficient for negatives), `float`, `double`, `bool`, `string`, `bytes` |
| `repeated` | a list |
| `enum` | a fixed set of values; the first must be `0` |
| `oneof` | at most one of several fields is set: a tagged union |
| `map<K, V>` | a dictionary |
| `optional` | tracks whether a scalar was set at all |

## How protobuf encodes data

Each field is written as a small **tag** followed by its value. The tag packs the field number and a **wire type** (how to read the bytes that follow) into one number: `(field_number << 3) | wire_type`. Integers use **varints**, which take fewer bytes for smaller numbers. No field names, no quotes, no commas, no spaces.

Encoding `{ id: 150, title: "Asha" }` with the `Course` message above gives these real bytes:

```text
08 96 01        field 1 (id), varint     → 150   (0x08 = 1 << 3 | 0)
12 04 41 73 68 61   field 2 (title), length 4 → "Asha"  (0x12 = 2 << 3 | 2)
```

That's **9 bytes**. The same data as JSON, `{"id":150,"title":"Asha"}`, is **25 bytes**. For the full course from the contract, protobuf took 41 bytes and JSON 100. Because every field carries its number and wire type, a decoder can **skip fields it doesn't know**, which is exactly what makes adding fields safe.

The cost: the bytes aren't human-readable. You can't `curl` a gRPC endpoint and read the reply. You need schema-aware tools like `grpcurl` (covered below). That opacity is the price of speed and size, and the main reason public APIs often stay on REST.

## HTTP/2 underneath

gRPC doesn't invent a transport; it rides on **HTTP/2** ([Chapter 01](/system-design/01-http-and-cors/)), and most of its powers are really HTTP/2 features. One TCP connection carries many independent **streams**, each made of binary **frames**, interleaved. That's how one connection carries hundreds of calls at once, with data flowing both ways.

| gRPC concept | HTTP/2 mechanism |
| --- | --- |
| one call | one HTTP/2 stream |
| which method | a `POST` to `:path` = `/course.v1.CourseService/GetCourse` |
| metadata (auth tokens, trace ids) | HTTP/2 headers |
| the request and response messages | length-prefixed protobuf in DATA frames |
| final status | `grpc-status` and `grpc-message` **trailers**, sent after the body |
| streaming | several DATA frames before the stream closes |

Two practical consequences, both covered later: proxies and load balancers in the path must understand HTTP/2, and browsers can't speak native gRPC.

## The four kinds of call

![Unary, server streaming, client streaming and bidirectional streaming gRPC calls shown as message arrows between client and server](/images/system-design/grpc-call-types.svg "Most calls are unary. Streaming is there when you need it.")

| Kind | Shape | Good for |
| --- | --- | --- |
| **Unary** | 1 request → 1 response | almost everything: around 90% of real calls |
| **Server streaming** | 1 request → many responses | big result sets in chunks, live feeds, progress updates |
| **Client streaming** | many requests → 1 response | uploads, batching events, aggregating readings |
| **Bidirectional** | both sides send whenever they want | chat, live collaboration, telemetry with control messages |

### A server with all four

```js
// server.js
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const definition = protoLoader.loadSync("course.proto", { longs: Number, enums: String, defaults: true });
const { course } = grpc.loadPackageDefinition(definition);

const handlers = {
  // Unary
  async GetCourse(call, callback) {
    const found = await courseRepo.findById(call.request.id);
    if (call.cancelled) return;                   // the caller gave up (deadline passed): stop here
    if (!found) return callback({ code: grpc.status.NOT_FOUND, details: `course ${call.request.id} not found` });
    callback(null, found);
  },

  // Server streaming: write many messages, then end
  async ListLessons(call) {
    for (const lesson of await lessonRepo.forCourse(call.request.courseId)) {
      if (call.cancelled) return;
      call.write(lesson);
    }
    call.end();
  },

  // Client streaming: read everything, answer once
  UploadProgress(call, callback) {
    let events = 0;
    let totalSeconds = 0;
    call.on("data", (event) => {
      events++;
      totalSeconds += event.secondsWatched;
    });
    call.on("end", () => callback(null, { events, totalSeconds }));
  },

  // Bidirectional: reply to each message as it arrives
  Doubts(call) {
    call.on("data", (msg) => call.write({ from: "mentor", text: `Good question about "${msg.text}"` }));
    call.on("end", () => call.end());
  },
};

const server = new grpc.Server();
server.addService(course.v1.CourseService.service, handlers);
server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), (err) => {
  if (err) throw err;
  console.log("gRPC server on :50051");
});
```

`proto-loader` reads the `.proto` at runtime, and field names become camelCase in JavaScript (`course_id` → `courseId`). For TypeScript projects, generating static types with `ts-proto` or `buf` gives you compile-time checking.

### A client

```js
// client.js
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const definition = protoLoader.loadSync("course.proto", { longs: Number, enums: String, defaults: true });
const { course } = grpc.loadPackageDefinition(definition);

// One client (channel) for the whole app. Create it once and reuse it.
export const courses = new course.v1.CourseService("courses.internal:50051", grpc.credentials.createInsecure());

const inMs = (ms) => new Date(Date.now() + ms);

// Unary, wrapped in a promise, always with a deadline
export const getCourse = (id) =>
  new Promise((resolve, reject) =>
    courses.GetCourse({ id }, { deadline: inMs(1000) }, (err, res) => (err ? reject(err) : resolve(res)))
  );

// Server streaming
const stream = courses.ListLessons({ courseId: 42 }, { deadline: inMs(5000) });
stream.on("data", (lesson) => console.log(`${lesson.position}. ${lesson.title}`));
stream.on("end", () => console.log("done"));
stream.on("error", (err) => console.error(err.code, err.details));

// Client streaming
const upload = courses.UploadProgress((err, summary) => console.log(summary));   // { events: 3, totalSeconds: 135 }
for (const s of [30, 45, 60]) upload.write({ lessonId: 1, secondsWatched: s });
upload.end();
```

What the test run returned: `GetCourse(42)` gave the course; `ListLessons` streamed three lessons in order; `UploadProgress` returned `{ events: 3, totalSeconds: 135 }`; and the chat stream answered each question as it arrived.

**Streaming gotchas.** Streams are long-lived, so they hold resources for their whole life: set deadlines or idle limits, and handle the other side disappearing midway. There's no back-pressure beyond HTTP/2's flow control, so a fast producer can swamp a slow consumer if you don't pace it. And a stream isn't a transaction: if it breaks halfway, the receiver has a prefix of the messages, so make messages resumable or idempotent.

## From .proto to code

In compiled languages, a compiler, **`protoc`** (or the **buf** toolchain), reads the `.proto` and generates stubs and server interfaces using a plugin per language. That's why a Go client and a Python server interoperate perfectly: both were generated from the same file.

```bash
buf generate
```

For real projects, prefer **buf** over raw `protoc` commands. It adds a config file, dependency management, a linter, and **breaking-change detection** that fails CI if someone reuses a field number or changes a type, turning the schema rules above into an automatic gate.

## Channels and stubs

Two client-side objects get confused:

- A **channel** (in Go, a `ClientConn`; in grpc-js, the connection the client object holds) is the long-lived connection to a server. It manages HTTP/2 connections, reconnects and load-balancing state.
- A **stub** is the cheap generated object you call methods on.

**Create the channel once and share it; create stubs freely.** Opening a new channel per request throws away the connection reuse that makes HTTP/2 fast and pays a fresh TCP and TLS handshake every time. If gRPC latency is mysteriously high, check this first.

## Metadata, deadlines and cancellation

**Metadata** is gRPC's key-value side channel, the equivalent of HTTP headers: auth tokens, trace ids, API versions. Anything that isn't part of the message itself.

```js
const md = new grpc.Metadata();
md.set("authorization", `Bearer ${token}`);
md.set("x-request-id", requestId);
courses.GetCourse({ id: 42 }, md, { deadline: inMs(1000) }, callback);
// server side: call.metadata.get("authorization")[0]
```

A **deadline** is an absolute point in time, not a per-hop timeout, and it **travels with the call**. If service A calls B with 1 second left, and B calls C, C knows it has, say, 600 ms left rather than a fresh second. That stops the classic cascade where every layer waits its own full timeout. **Set a deadline on every call.** A call without one can hang forever.

**Cancellation** lets the caller, or a broken connection, stop work nobody needs any more. In our test, the client set a 100 ms deadline on a lookup that took 300 ms. The client got `DEADLINE_EXCEEDED` after 100 ms, but the server **kept working** until it finished. On the server, `call.cancelled` flips to `true` once the caller has gone, so check it before doing expensive work, and pass the remaining time on to your own downstream calls. In Go, the same idea is threading `ctx` into every database and RPC call.

## Status codes

gRPC doesn't use HTTP status codes. Every call ends with exactly one of its own codes, sent in the `grpc-status` trailer. Returning the right one is part of your contract, because clients and retry policies switch on it:

| Code | Means | Closest HTTP |
| --- | --- | --- |
| `OK` (0) | success | 200 |
| `INVALID_ARGUMENT` (3) | bad input, regardless of system state | 400 |
| `DEADLINE_EXCEEDED` (4) | ran past its deadline | 504 |
| `NOT_FOUND` (5) | the entity doesn't exist | 404 |
| `ALREADY_EXISTS` (6) | a create clashed with an existing entity | 409 |
| `PERMISSION_DENIED` (7) | authenticated, but not allowed | 403 |
| `RESOURCE_EXHAUSTED` (8) | quota or rate limit hit | 429 |
| `FAILED_PRECONDITION` (9) | the system isn't in the right state for this | 400 / 409 |
| `UNIMPLEMENTED` (12) | this server doesn't have the method | 501 |
| `INTERNAL` (13) | a bug: an invariant broke | 500 |
| `UNAVAILABLE` (14) | temporary: server down or overloaded, **safe to retry** | 503 |
| `UNAUTHENTICATED` (16) | missing or invalid credentials | 401 |

In grpc-js, a handler returns an error with `callback({ code: grpc.status.NOT_FOUND, details: "..." })`, and the client sees `err.code === 5` and `err.details`. When a code and message aren't enough (per-field validation errors, retry hints), gRPC supports structured **error details** using the standard `google.rpc` messages like `BadRequest` and `RetryInfo`. Clients read them as data instead of parsing strings, the same idea as the error envelope in [Chapter 07](/system-design/07-api-design-rest/).

## Interceptors: gRPC's middleware

An **interceptor** wraps every call, before and after your handler. It's exactly the middleware idea from [Chapter 06](/system-design/06-controllers-services-and-middlewares/): put authentication, logging, metrics, tracing and error recovery in one place instead of every method. There are client and server interceptors, for unary and streaming calls.

```js
// Client interceptor: attach the token to every outgoing call
const withToken = (token) => (options, nextCall) =>
  new grpc.InterceptingCall(nextCall(options), {
    start(metadata, listener, next) {
      metadata.set("authorization", `Bearer ${token}`);
      next(metadata, listener);
    },
  });

const client = new course.v1.CourseService(address, credentials, { interceptors: [withToken(serviceToken)] });
```

```js
// Server interceptor: reject calls without a valid token, and log every call's outcome
const authAndLog = (methodDescriptor, call) => {
  const started = Date.now();
  return new grpc.ServerInterceptingCall(call, {
    start(next) {
      next({
        onReceiveMetadata(metadata, mdNext) {
          const header = String(metadata.get("authorization")[0] ?? "");
          if (!isValidToken(header.replace(/^Bearer /, ""))) {
            call.sendStatus({ code: grpc.status.UNAUTHENTICATED, details: "missing or invalid token" });
            return;   // stop: the handler never runs
          }
          mdNext(metadata);
        },
      });
    },
    sendStatus(status, next) {
      console.log(`${methodDescriptor.path} ${grpc.status[status.code]} ${Date.now() - started}ms`);
      next(status);
    },
  });
};

const server = new grpc.Server({ interceptors: [authAndLog] });
```

In the test, a client with the right token got its course; clients with a wrong token or no token got `UNAUTHENTICATED: missing or invalid token`.

## Security: TLS, mTLS and tokens

gRPC security has two separate layers, and you use both:

| Layer | Mechanism | Answers |
| --- | --- | --- |
| transport | **TLS**: the server presents a certificate | is the connection encrypted, and is the server genuine? |
| transport | **mTLS**: *both* sides present certificates | is the calling *service* genuine? (service-to-service identity) |
| per call | a **token in metadata** (a JWT or OAuth access token) | which *user* is this call for? Checked in an interceptor. |

```js
import fs from "node:fs";

// Server with TLS (add the CA and `true` as the last argument to require client certificates: mTLS)
const creds = grpc.ServerCredentials.createSsl(null, [
  { private_key: fs.readFileSync("server.key"), cert_chain: fs.readFileSync("server.crt") },
]);

// Client that trusts your CA
const client = new course.v1.CourseService("courses.internal:50051", grpc.credentials.createSsl(fs.readFileSync("ca.crt")));
```

The `createInsecure()` credentials in the earlier examples are **for local development only**. A bearer token is like a password: never send one over an unencrypted connection. Inside a service mesh (Istio, Linkerd), mTLS between services is usually handled for you by sidecar proxies.

## Resilience and load balancing

### The load-balancing trap

gRPC's long-lived, shared connection breaks naive load balancing:

![A TCP load balancer sending every gRPC call on one connection to a single server, compared with an HTTP/2-aware proxy spreading calls across three servers](/images/system-design/grpc-load-balancing.svg "Balance calls, not connections.")

A plain **L4 (TCP) load balancer** picks a backend once per *connection*. Since a gRPC client sends all its calls over one connection, every call lands on the same server while the others sit idle. You need either an **L7 proxy that understands HTTP/2** (Envoy, a service mesh, or a cloud load balancer in HTTP/2 mode), which balances each call, or **client-side load balancing**, where the client resolves several server addresses and spreads calls across them.

### Retries, keepalive and health checks

- **Declarative retries**: a *service config* (a JSON policy on the channel) says which status codes to retry (usually `UNAVAILABLE`), how many times, and with what backoff. No retry loops in your code.
- **Keepalive** pings detect dead connections and keep idle ones open through NATs and proxies.
- A standard **health service** (`grpc.health.v1.Health`) lets Kubernetes and load balancers ask whether a server is ready.

```js
const serviceConfig = {
  methodConfig: [
    {
      name: [{ service: "course.v1.CourseService" }],
      retryPolicy: {
        maxAttempts: 4,
        initialBackoff: "0.1s",
        maxBackoff: "2s",
        backoffMultiplier: 2,
        retryableStatusCodes: ["UNAVAILABLE"],
      },
    },
  ],
};
const client = new course.v1.CourseService(address, credentials, {
  "grpc.service_config": JSON.stringify(serviceConfig),
});
```

**Only auto-retry idempotent methods.** Retrying a `ChargeCard` after a timeout can charge twice. Use an idempotency key for those ([Chapter 01](/system-design/01-http-and-cors/)), or don't retry them automatically.

## gRPC vs REST

| | gRPC | REST + JSON |
| --- | --- | --- |
| Payload | binary protobuf: small, fast | text JSON: bigger, human-readable |
| Contract | enforced by `.proto` + code generation | convention + docs (OpenAPI optional) |
| Transport | HTTP/2 only | any HTTP version |
| Streaming | built in, both directions | add-ons (SSE, WebSockets) |
| Browsers | not natively; needs a bridge | everywhere |
| Debugging | needs tools (`grpcurl`) | curl, browser, DevTools |
| HTTP caching | not really | mature (ETag, Cache-Control) |
| Best for | internal microservices, low latency, many languages | public APIs, web and mobile front doors, third parties |

Most real systems use both: a **REST (or GraphQL) gateway** at the edge for browsers and partners, and **gRPC between internal services**. Tools like grpc-gateway can even generate the REST edge from the same `.proto`.

## gRPC in the browser

**Browsers can't speak native gRPC.** gRPC needs fine control over HTTP/2 frames and trailers, and `fetch` doesn't expose that. If a web frontend must call a gRPC service, you need a bridge:

- **gRPC-Web**: a variant protocol with a generated JavaScript client; a proxy (Envoy has a built-in filter) translates it to real gRPC. Server streaming works; full bidirectional streaming generally doesn't.
- **Connect** (connectrpc.com): a protocol family whose servers speak gRPC, gRPC-Web and plain HTTP+JSON from the same handlers, often without a separate proxy.
- **grpc-gateway / transcoding**: generate a REST+JSON API from HTTP annotations in your `.proto`. The browser uses normal REST; the gateway translates to gRPC.

Decide this early if a browser will call the service directly. For internal-only services, it never matters.

## Seeing inside: tools and debugging

| Tool | What it gives you |
| --- | --- |
| `grpcurl` | the `curl` of gRPC: call methods with JSON in and out, list services |
| server reflection | lets tools discover your services and message types at runtime, without the `.proto` file |
| health service | readiness and liveness for Kubernetes and load balancers |
| channelz | built-in stats on live channels and connections |
| interceptors | hooks for metrics (Prometheus), structured logs and tracing (OpenTelemetry) |
| trace propagation | pass a trace id in metadata so one request can be followed across services |

```bash
grpcurl -plaintext localhost:50051 list
```

```bash
grpcurl -plaintext -d '{"id": 42}' localhost:50051 course.v1.CourseService/GetCourse
```

Enable reflection in development and staging so `grpcurl`, Postman's gRPC mode and grpcui work without passing `.proto` files around. Many teams turn it off in production so they don't advertise their schema.

## Quick revision

| Concept | One line |
| --- | --- |
| gRPC | typed remote calls: protobuf contract, binary encoding, HTTP/2 |
| `.proto` | the contract; both sides generate code from it |
| Field numbers | the real identity on the wire; never change or reuse; adding is safe |
| Wire format | tag = `(field << 3) \| wire_type`, varints; small but not human-readable |
| HTTP/2 | one connection, many streams; one call = one stream; status in trailers |
| Call types | unary, server streaming, client streaming, bidirectional |
| Channel vs stub | one shared connection vs cheap callers |
| Metadata | headers: tokens, trace ids |
| Deadline | absolute, propagates; set one on every call; check `call.cancelled` |
| Status codes | gRPC's own (NOT_FOUND = 5, UNAVAILABLE = 14 …) |
| Interceptors | middleware for auth, logging, metrics |
| Security | TLS/mTLS for the connection + a token per call |
| Load balancing | L7 or client-side; L4 pins everything to one server |
| Retries | service config; only for idempotent methods |
| Browser | gRPC-Web, Connect or a REST gateway |

## Interview questions

1. What is RPC? How does gRPC make a remote call look local?
2. Why is protobuf smaller and faster than JSON? What's in a field's tag?
3. What are the rules for evolving a `.proto` without breaking clients?
4. Why does gRPC use HTTP/2? Where does the status code travel?
5. Name the four kinds of gRPC call with a use case for each.
6. Channel vs stub: which should you create once?
7. What is a deadline, and why is it better than a per-hop timeout? What should a server do when a call is cancelled?
8. Give five gRPC status codes and their closest HTTP equivalents. Which are safe to retry?
9. What are interceptors? What would you put in them?
10. TLS vs mTLS vs per-call tokens: what does each protect?
11. Why does a TCP load balancer work badly with gRPC? What are the alternatives?
12. When would you choose gRPC over REST? How can a browser call a gRPC service?

## Further reading

- [gRPC documentation](https://grpc.io/docs/) and [core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/)
- [Protocol Buffers language guide (proto3)](https://protobuf.dev/programming-guides/proto3/) and [encoding](https://protobuf.dev/programming-guides/encoding/)
- [gRPC status codes](https://grpc.io/docs/guides/status-codes/)
- [grpc-js on npm](https://www.npmjs.com/package/@grpc/grpc-js)
- [buf](https://buf.build/docs/) and [Connect](https://connectrpc.com/)

Next: [Chapter 14, Configuration Management](/system-design/14-configuration-management/).
