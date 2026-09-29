---
title: "Node.js Fundamentals: Runtime, Modules, npm, Files and Streams"
description: What Node.js is and how it runs JavaScript with V8 and libuv, blocking vs non-blocking code, LTS versions, npm and package.json, CommonJS vs ES modules, fs and path, a raw HTTP server, events, streams, environment variables and the Node event loop.
author: Vikas Patel
---

**Node.js** is a **JavaScript runtime**: it lets you run JavaScript outside the browser, on your laptop or a server. With it you can build APIs, websites, real-time chat, command-line tools and scripts, all in the same language you use on the front end.

```bash
node app.js
```

## How Node.js works

Node isn't a language or a framework. It's Google's **V8 engine** (the same one in Chrome) plus **libuv** (a C library for async I/O) plus a set of built-in modules.

![Layers of Node.js: your code, Node APIs, V8, libuv and the operating system](/images/backend/node-architecture.svg "Your JavaScript runs on one thread; libuv and the OS do the waiting.")

- **V8** compiles and runs your JavaScript, on **one** main thread.
- **Node APIs** (`http`, `fs`, `path`, `crypto`, `stream`, `events`) give JavaScript access to the machine: files, network, processes. Browsers don't have these, and Node doesn't have `document` or `window`.
- **libuv** runs the **event loop** and a small **thread pool** (4 threads by default) for work the OS can't do asynchronously, like file system calls, `crypto` hashing and compression. Network I/O uses the OS's own async mechanisms.

Because the main thread never waits for I/O, **one Node process can serve thousands of connections** at once. The catch: never block that thread with long CPU work.

### Blocking vs non-blocking

```js
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

// Blocking: nothing else runs until the file is read. Fine in a startup script, bad in a server.
const config = readFileSync("config.json", "utf8");

// Non-blocking: Node starts the read, keeps serving other requests, and resumes when it's done.
const data = await readFile("data.json", "utf8");
```

In a server, a 2-second synchronous operation freezes **every user** for 2 seconds, not just the one who triggered it.

### Why Node.js?

- **Fast I/O:** V8 plus non-blocking, event-driven design. Ideal for APIs, real-time apps and streaming.
- **One language** for front end and back end, and code can be shared between them.
- **npm:** the largest package ecosystem.
- **Not ideal for** heavy CPU work (video encoding, big number crunching) on the main thread. Use `worker_threads`, a job queue, or another service for that.

## Installing Node and choosing a version

Use an **LTS (Long-Term Support)** version for real projects. As of 2026, **Node 24** is the active LTS, **Node 22** is in maintenance, and **Node 26** is the newest "current" release (it becomes LTS in October). Even-numbered releases become LTS; each gets about 30 months of support. Starting with Node 27, Node moves to one major release per year.

```bash
node -v      # e.g. v24.x
npm -v
```

Use a version manager ([nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm) or [Volta](https://volta.sh/)) so each project can use the version it needs.

## npm and package.json

**npm** (Node Package Manager) installs libraries and runs scripts.

```bash
npm init -y                 # creates package.json
npm install express         # a dependency: needed to run the app
npm install -D eslint       # a devDependency: only needed while developing
npm run dev                 # runs the "dev" script from package.json
npx create-vite@latest      # runs a package without installing it globally
```

```json
{
  "name": "course-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch --env-file=.env src/server.js",
    "start": "node src/server.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}
```

- **`^5.1.0`** means any 5.x.x from 5.1.0 up (minor and patch updates). `~5.1.0` allows only patch updates (5.1.x). This is **semantic versioning**: MAJOR.MINOR.PATCH, where a major bump may break things.
- **`package-lock.json`** records the exact version of every installed package. **Commit it**, so everyone installs the same tree. Use `npm ci` in CI for exact, clean installs.
- **Never commit `node_modules`**. Add it to `.gitignore`.
- `node --watch` restarts on file changes, so you no longer need **nodemon**.

## Modules: CommonJS and ES modules

Node has two module systems. **ES modules** are the standard; use them in new code.

```js
// ES modules: "type": "module" in package.json, or a .mjs file
import express from "express";
import { readFile } from "node:fs/promises";   // node: prefix = built-in module
export function add(a, b) {
  return a + b;
}
export default add;
```

```js
// CommonJS: the older default, still in many projects (.cjs or .js without "type": "module")
const express = require("express");
const { readFile } = require("node:fs/promises");
function add(a, b) {
  return a + b;
}
module.exports = { add };
```

| | CommonJS | ES modules |
| --- | --- | --- |
| syntax | `require` / `module.exports` | `import` / `export` |
| loading | synchronous, at run time | static, analysed first |
| top-level `await` | no | yes |
| `__dirname`, `__filename` | available | use `import.meta.dirname` and `import.meta.filename` |
| file extensions in imports | optional | required for local files: `./utils.js` |

Every module runs **once** and is **cached**: requiring or importing it again returns the same object. More on modules in the [interview questions](/notes/javascript-interview-questions).

## Files and paths

```js
import { readFile, writeFile, appendFile, unlink, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const file = path.join(import.meta.dirname, "data", "notes.txt"); // builds OS-correct paths

await mkdir(path.dirname(file), { recursive: true });
await writeFile(file, "Hello World");            // create or overwrite
await appendFile(file, "\nNew line added");      // add to the end
console.log(await readFile(file, "utf8"));       // read as text
console.log(await readdir(path.dirname(file)));  // ["notes.txt"]
await unlink(file);                              // delete

path.extname("photo.png");                       // ".png"
path.basename("/a/b/photo.png");                 // "photo.png"
```

Always use `path.join` or `path.resolve` instead of gluing strings with `/`: Windows uses `\`. The `readFileSync` family exists too; keep it for startup scripts and CLIs.

## A raw HTTP server

Frameworks like Express are built on Node's `http` module:

```js
import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello World");
  } else if (req.url === "/api/courses") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify([{ id: 1, title: "JavaScript" }]));
  } else {
    res.writeHead(404).end("Not found");
  }
});

server.listen(3000, () => console.log("http://localhost:3000"));
```

Routing with `if`s, parsing bodies and setting headers by hand gets messy quickly. That's what [Express](/notes/express-routing-middleware) solves.

## Events

Many Node objects (servers, streams, sockets) are **EventEmitters**: they emit named events, and you subscribe with `on`.

```js
import { EventEmitter } from "node:events";

const orders = new EventEmitter();
orders.on("placed", (order) => console.log("send email for", order.id));
orders.on("placed", (order) => console.log("update stock for", order.id));
orders.emit("placed", { id: 42 });
// send email for 42
// update stock for 42
```

Listeners run **synchronously**, in the order they were added. How to build your own EventEmitter is in [machine coding](/notes/javascript-machine-coding).

## Streams: handle big data in chunks

Reading a 2 GB log file with `readFile` loads all 2 GB into memory. A **stream** processes it chunk by chunk (64 KB at a time for files), with constant memory.

```js
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

// Compress a huge file with constant memory
await pipeline(
  createReadStream("access.log"),
  createGzip(),
  createWriteStream("access.log.gz"),
);
```

| Stream type | Example |
| --- | --- |
| **Readable** | `fs.createReadStream`, an HTTP request (`req`) |
| **Writable** | `fs.createWriteStream`, an HTTP response (`res`) |
| **Duplex** | a TCP socket (read and write) |
| **Transform** | `zlib.createGzip()`, encryption (changes data passing through) |

Use `pipeline` rather than `.pipe()`: it forwards errors and cleans up every stream. Streams also handle **backpressure**: if the writer is slower than the reader, reading pauses automatically.

## Environment variables and process

Secrets and settings (database URLs, API keys, ports) belong in **environment variables**, not in code.

```bash
# .env: never commit this file; commit a .env.example with dummy values instead
PORT=3000
DATABASE_URL=postgres://localhost:5432/bitwise
```

```js
// run with: node --env-file=.env server.js  (Node 20.6+; the dotenv package is optional now)
const port = Number(process.env.PORT) || 3000;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");

process.argv;            // command-line arguments
process.cwd();           // current working directory
process.exit(1);         // exit with an error code
```

Validate required variables **at startup**, so a missing setting fails immediately instead of at 2 a.m. on the first request that needs it.

## The Node.js event loop

Node's loop works like the browser's (see [async JavaScript](/notes/javascript-async)), in **phases**:

1. **Timers:** `setTimeout` and `setInterval` callbacks that are due.
2. **Pending callbacks:** some system-level callbacks.
3. **Poll:** wait for and run I/O callbacks (network, files).
4. **Check:** `setImmediate` callbacks.
5. **Close:** close events, such as `socket.on("close")`.

Between each callback, Node runs `process.nextTick` callbacks, then promise microtasks.

```js
import { readFile } from "node:fs";

readFile(import.meta.filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// inside an I/O callback, always: immediate, then timeout (check phase comes before the next timers phase)
```

## Errors and crashes

- An **uncaught exception** or an **unhandled promise rejection** crashes the process. That's intentional: the app may be in a broken state.
- Handle expected errors where they happen (`try`/`catch` around `await`, error-first callbacks).
- Use `process.on("uncaughtException")` only to **log and exit**, and let a process manager restart the app (Docker, systemd, PM2, or your platform).

## Scaling and CPU work

- A single Node process uses **one CPU core** for JavaScript. Run several processes (the `cluster` module, PM2, or several containers behind a load balancer) to use all cores.
- For CPU-heavy tasks, use **`worker_threads`** or a background job queue (BullMQ with Redis) so requests stay fast.

## Useful built-ins you may not know

```bash
node --watch app.js            # restart on changes
node --env-file=.env app.js    # load environment variables
node --test                    # built-in test runner (node:test and node:assert)
node app.ts                    # recent versions run TypeScript by stripping the types
```

`fetch`, `WebSocket` (client), `structuredClone` and `AbortController` are global, just like in browsers.

## Interview questions

1. What is Node.js? Is it a language, a framework or a runtime?
2. How can single-threaded Node handle thousands of requests? What does libuv do?
3. Blocking vs non-blocking code. Why is `readFileSync` bad inside a request handler?
4. CommonJS vs ES modules. How do you get `__dirname` in an ES module?
5. `dependencies` vs `devDependencies`. What do `^` and `~` mean? Why commit `package-lock.json`?
6. What are streams and why use them? What is backpressure?
7. Explain the phases of the Node event loop. `process.nextTick` vs `setImmediate` vs `setTimeout(fn, 0)`.
8. How do you use all CPU cores in Node? When would you use worker threads?
9. How do you manage secrets and configuration?

## Further reading

- [Node.js: Learn](https://nodejs.org/en/learn): the official guides
- [Node.js: The event loop, timers and process.nextTick](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
- [Node.js best practices](https://github.com/goldbergyoni/nodebestpractices): a large, well-known checklist

Next: [Express: routing, middleware and MVC](/notes/express-routing-middleware).
