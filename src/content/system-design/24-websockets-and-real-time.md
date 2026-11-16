---
title: WebSockets and Real-Time Communication
description: How servers push data to clients. Polling, long polling, Server-Sent Events and WebSockets compared, the upgrade handshake and frames on the wire, the connection lifecycle and close codes, heartbeats, building a server with rooms, backpressure and slow clients, authentication and security, scaling with a Redis backplane, load balancing and deploys, reconnection with backoff and resume, and common pitfalls, all tested in Node.js.
author: Bitwise School
---

Plain HTTP has one shape: **the client asks, the server answers** ([Chapter 1](/system-design/01-http-and-cors/)). The server can never speak first. That's fine for loading a page or calling an API, but it breaks down when the server needs to tell the client something the moment it happens: a new chat message, a live score, a notification, a teammate's cursor moving, a payment confirmed.

The old workaround was **polling**: the client asks "anything new?" every few seconds and usually hears "no". It wastes requests, repeats HTTP headers every time, and adds delay: poll every 5 seconds and an event can wait almost 5 seconds to be seen. WebSockets replace that with **one persistent, two-way connection** that either side can send on at any time.

Polling is phoning the post office every ten minutes to ask if a letter arrived. A WebSocket is an open phone line: whoever has something to say just says it.

Everything in this chapter was run in Node.js with the `ws` library and Redis: the raw handshake and frame bytes, authentication, message limits, heartbeats, a slow client, a two-server backplane, reconnection after a deploy, and Server-Sent Events.

## The real-time spectrum

WebSockets aren't the only option, and reaching for them by reflex is a common mistake.

![Short polling, long polling, Server-Sent Events and WebSockets compared on a timeline showing when news reaches the client](/images/system-design/realtime-spectrum.svg "From simplest to most capable. Pick the leftmost one that does the job.")

| Technique | Direction | How it works | Good for |
| --- | --- | --- | --- |
| **Short polling** | client pulls | a request on a timer | rare updates, when a delay is fine |
| **Long polling** | client pulls | the server holds the request open until there's news, then the client asks again | push-like behaviour through any proxy |
| **Server-Sent Events (SSE)** | server → client | one long-lived HTTP response that streams events | notifications, feeds, live dashboards, progress, AI token streaming |
| **WebSocket** | both ways | a persistent connection upgraded from HTTP | chat, multiplayer games, collaborative editing, trading screens |

WebSockets are the most capable and the most demanding to run: long-lived, stateful connections complicate load balancing, scaling and deploys, as the second half of this chapter shows. **If only the server needs to push, use SSE**: it's plain HTTP, reconnects automatically, and passes through proxies easily.

## What a WebSocket is

A WebSocket is a **persistent, full-duplex channel over a single TCP connection**:

- **persistent**: opened once and kept for the session, not per message
- **full-duplex**: both sides can send at the same time, independently
- **one TCP connection** on the normal web ports (80 and 443), so it passes through firewalls that allow web traffic

It **starts life as an HTTP request** and then switches protocols. That design lets WebSockets reuse the web's infrastructure (ports, TLS, proxies, cookies, origins) instead of needing a new port that firewalls would block. The URL schemes mirror HTTP: `ws://` and, encrypted, `wss://`.

For service-to-service streaming, gRPC streams over HTTP/2 ([Chapter 13](/system-design/13-grpc-and-inter-service-communication/)) cover similar ground. WebSockets remain the standard for browsers, which offer a simple WebSocket API but no access to raw HTTP/2 streams.

## The upgrade handshake

Every WebSocket begins with an ordinary-looking `GET` request asking to switch protocols. I sent one by hand over a raw TCP socket to a Node server, using the sample key from the WebSocket specification (RFC 6455):

```text
GET /chat HTTP/1.1
Host: localhost:4400
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: http://localhost:3000
```

```text
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

The status is **`101 Switching Protocols`**, not `200`. From that moment the connection stops speaking HTTP.

`Sec-WebSocket-Accept` is the server's proof that it really understands WebSockets: it's the base64 SHA-1 hash of the client's key plus a fixed GUID from the spec. Computing it myself gave the same value:

```js
import { createHash } from "node:crypto";
const accept = createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
// "s3pPLMBiTxaQ9kYGzzhZRbK+xOo="
```

It isn't security (the GUID is public); it stops caches and proxies that blindly echo responses from being mistaken for a WebSocket server. Libraries do all of this for you.

One limitation shapes authentication later: the browser's `WebSocket` constructor **can't set custom headers**, so you can't send `Authorization: Bearer …` on the handshake.

## Frames: the wire format

After the handshake, data travels in **frames**: small units with a header that says whether this is the final piece of a message, what type it is (text, binary, close, ping, pong), and how long it is. On the same raw socket, the server's first message, the text `"hi"`, arrived as four bytes:

```text
first frame from server (hex): 81 02 68 69
```

- `81`: final frame (`FIN` bit) + opcode 1, **text**
- `02`: payload length 2, not masked
- `68 69`: the bytes for `h` and `i`

Frames from the client must be **masked**. To send `"yo"` the way a browser would, I XOR'd it with a 4-byte random key:

```text
client frame we send (hex):    81 82 12 34 56 78 6b 5b
server got: yo
```

`82` sets the mask bit plus length 2, then come the mask key and the masked payload. Masking isn't encryption (that's what `wss://` is for); it stops a malicious page from crafting bytes that confuse old proxies into caching poisoned content. Server frames are never masked.

Two useful properties fall out of framing:

- **Messages keep their boundaries.** Unlike raw TCP, which is a stream of bytes you'd have to split yourself, you send a message and the other side receives that whole message.
- **Large messages can be split** across several frames, so a sender can stream without buffering everything first.

![A WebSocket starts as an HTTP request, switches protocols with 101, then carries frames both ways until a close handshake](/images/system-design/ws-handshake.svg "Upgrade once, then frames in both directions, kept alive by ping and pong, ended by a close handshake.")

## The connection lifecycle

A WebSocket goes **open → messages → close**. Closing is a small handshake of its own: one side sends a close frame with a **status code** and optional reason, the other replies with a close frame, and both close the TCP connection.

| Code | Meaning |
| --- | --- |
| `1000` | normal closure |
| `1001` | going away: the server is shutting down or the user left the page |
| `1006` | abnormal: the connection dropped without a close frame (you observe it, you never send it) |
| `1008` | policy violation |
| `1009` | message too big |
| `1011` | internal server error |

The clean close only happens when both sides cooperate. In reality connections die silently all the time: a laptop sleeps, Wi-Fi drops, a phone switches from Wi-Fi to mobile data, a NAT router forgets the connection. No close frame arrives; the socket just goes quiet. Hence heartbeats, and hence clients that reconnect.

## Heartbeats

A dead connection looks exactly like an idle one: no bytes either way. **Ping** and **pong** control frames tell them apart. The server pings on a timer; a live client must answer with a pong (browsers do this automatically). No pong by the next round means the connection is dead, so the server closes it and frees its resources.

To test it, I opened a connection from a raw TCP socket that completed the handshake and then never answered anything, like a laptop that went to sleep, with a 1-second heartbeat:

```text
zombie connection detected and removed after 2015 ms (heartbeat every 1000 ms)
```

The first tick marked it "not alive" and sent a ping; the second found no pong and terminated it. With a typical 30-second interval, a vanished client is cleaned up within a minute. Without heartbeats, these **zombie connections** pile up and leak memory until the server falls over.

Heartbeats also keep quiet connections alive through load balancers and proxies, which often close connections that are idle for 60 seconds.

## A WebSocket server in Node.js

Node's standard library includes a WebSocket *client* (`WebSocket` is global since Node 22) but not a server. The usual server library is **`ws`**; **Socket.IO** adds rooms, automatic reconnection and fallbacks on top, at the cost of its own protocol (clients must use the Socket.IO client too).

Here's a chat server with authentication, rooms, heartbeats, backpressure and graceful shutdown. The sections after it explain each part.

```js
// chat-server.mjs
import http from "node:http";
import { WebSocketServer } from "ws";
import { createClient } from "redis";

const MAX_BUFFERED = 1 * 1024 * 1024;   // drop a client whose unsent data passes 1 MB

export async function startChatServer({ port, name, redisUrl, heartbeatMs = 30_000, allowedOrigins, verifyToken }) {
  const server = http.createServer((req, res) => res.writeHead(404).end());
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });   // bigger messages get close code 1009
  const rooms = new Map();                                                      // room -> Set of sockets on THIS server

  const reject = (socket, status, text) => { socket.end(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\n\r\n`); };

  // 1. Authenticate before upgrading. An unauthenticated socket never becomes a WebSocket.
  server.on("upgrade", (req, socket, head) => {
    if (!allowedOrigins.includes(req.headers.origin)) return reject(socket, 403, "Forbidden");   // stops cross-site hijacking
    const token = new URL(req.url, "http://localhost").searchParams.get("token");
    const user = verifyToken(token);
    if (!user) return reject(socket, 401, "Unauthorized");
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, user));
  });

  // 2. Redis: pub/sub carries live messages between servers; a capped list keeps recent history for resume.
  const redis = await createClient({ url: redisUrl }).connect();
  const sub = redis.duplicate();
  await sub.connect();

  function deliverLocal(room, payload) {
    for (const ws of rooms.get(room) ?? []) {
      if (ws.bufferedAmount > MAX_BUFFERED) { ws.terminate(); continue; }     // slow consumer: cut it loose
      ws.send(payload);
    }
  }
  await sub.pSubscribe("room:*", (payload, channel) => deliverLocal(channel.slice(5), payload));

  wss.on("connection", (ws, user) => {
    ws.user = user;
    ws.rooms = new Set();
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });
    ws.on("error", (err) => console.warn(`socket error for ${user.name}: ${err.message}`));   // without this, one bad frame crashes the process
    ws.on("message", (raw) => handleMessage(raw).catch((err) => {          // never let one message crash the server
      console.warn(`message failed: ${err.message}`);
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "error", error: "internal error" }));
    }));

    async function handleMessage(raw) {
      let msg;
      try { msg = JSON.parse(raw); } catch { return ws.send(JSON.stringify({ type: "error", error: "invalid JSON" })); }

      if (msg.type === "join" && typeof msg.room === "string") {
        if (!user.rooms.includes(msg.room)) return ws.send(JSON.stringify({ type: "error", error: `not allowed in ${msg.room}` }));
        if (!rooms.has(msg.room)) rooms.set(msg.room, new Set());
        rooms.get(msg.room).add(ws);
        ws.rooms.add(msg.room);
        // Resume: send anything newer than the last sequence number the client saw.
        const history = (await redis.lRange(`history:${msg.room}`, 0, -1)).map((m) => JSON.parse(m));
        for (const m of history) if (m.seq > (msg.since ?? Infinity)) ws.send(JSON.stringify(m));
        return ws.send(JSON.stringify({ type: "joined", room: msg.room, server: name }));
      }

      if (msg.type === "say" && ws.rooms.has(msg.room) && typeof msg.text === "string" && msg.text.length <= 2000) {
        const seq = await redis.incr(`seq:${msg.room}`);                       // a per-room sequence number
        const out = JSON.stringify({ type: "message", room: msg.room, seq, from: user.name, text: msg.text });
        await redis.multi().rPush(`history:${msg.room}`, out).lTrim(`history:${msg.room}`, -100, -1).exec();
        await redis.publish(`room:${msg.room}`, out);                          // every server delivers to its own sockets
        return;
      }
      ws.send(JSON.stringify({ type: "error", error: "unknown or unauthorized message" }));
    }

    ws.on("close", () => {                                                     // always clean up
      for (const room of ws.rooms) rooms.get(room)?.delete(ws);
    });
  });

  // 3. Heartbeat: a client that missed the last ping is gone; free its resources.
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) { ws.terminate(); continue; }
      ws.isAlive = false;
      ws.ping();
    }
  }, heartbeatMs);

  await new Promise((r) => server.listen(port, r));

  return {
    // 4. Graceful drain: tell every client to go elsewhere, then stop.
    async shutdown() {
      clearInterval(heartbeat);
      for (const ws of wss.clients) ws.close(1001, "server restarting");
      await new Promise((r) => setTimeout(r, 200));
      server.close();
      await sub.quit(); await redis.quit();
    },
  };
}
```

Node's single-threaded event loop makes one thing simpler than in languages with threads: there's no risk of two threads writing to the same socket at once and corrupting frames. The rules that remain:

- **Keep message handlers fast.** Slow work in a handler delays every other socket on that process. Push heavy work to a job queue ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)).
- **Handle errors on every socket.** In my first version, the server had no `error` listener on sockets. A client sent a message over the size limit, `ws` emitted an error, nobody handled it, and **the whole server process crashed**, taking every other user's connection with it. One line (`ws.on("error", ...)`) fixed it. Likewise, an async message handler that throws must be caught.
- **Clean up on every exit path.** Register on connect; remove from every room on `close`, whatever the reason.

## Rooms and broadcasting

Real apps rarely send to everyone. They send to a group: the members of one chat room, the viewers of one live match, the subscribers to one stock. On a single server, a room is just a map from room name to a set of sockets, and broadcasting loops over the set.

Joining a room is also where **authorization** happens. Authentication at the handshake tells you *who* the connection belongs to; each message still needs checking against *what that user may do*:

```text
asha joins dsa-batch -> not allowed in dsa-batch
```

The connection was valid, but Asha isn't in that batch, so the server refused. A long-lived socket outlives many actions, and every one needs its own check, exactly like REST endpoints.

## Backpressure and slow clients

A problem unique to push systems: what if you produce messages faster than a client can receive them? A phone on a weak signal, a browser tab throttled in the background. The unsent data has to wait somewhere, and without a limit, one slow client can use up the server's memory.

In `ws`, `ws.bufferedAmount` is the number of bytes queued for a socket but not yet sent. The server above **terminates** a client whose queue passes 1 MB. To test it, a raw TCP client joined a room and then stopped reading, while another client flooded the room with 2 KB messages:

```text
slow client cut off after 9100 messages; its unsent buffer peaked at 0.98 MB
the fast client is still connected: true, and received 2575 messages
```

The operating system's socket buffers absorbed the first several megabytes; then `bufferedAmount` climbed until it crossed the limit and the server cut the slow client off. Everyone else carried on normally.

Choose a policy per kind of data:

- **Drop** messages for data where only the latest value matters (live positions, prices).
- **Disconnect** the client when gaps aren't acceptable; it reconnects and resyncs.
- **Conflate**: replace queued updates with one up-to-date snapshot.

> **Never buffer without a limit per connection.** One slow consumer must never be able to take down the producer. This is the same rule as slow consumers in Kafka ([Chapter 23](/system-design/23-message-brokers-and-kafka/)).

## Authentication

Because the browser can't set headers on the handshake, the usual `Authorization: Bearer` header isn't available. But the handshake is still an HTTP request, so you can authenticate it **before upgrading**:

| Approach | How | Notes |
| --- | --- | --- |
| **Cookie** | the browser sends its session cookie with the handshake | natural for same-site apps; requires a strict `Origin` check |
| **Token in the URL** | `wss://api.example.com/ws?token=…` | works everywhere; URLs end up in logs, so use short-lived, single-purpose tokens |
| **Subprotocol** | put the token in `Sec-WebSocket-Protocol` | keeps it out of the URL; a common trick |
| **First message** | connect, then send an auth message | flexible; the server must close the connection if it doesn't arrive quickly |
| **Header** | `Authorization` header | only for non-browser clients |

A common pattern for browsers: call a normal authenticated HTTP endpoint to get a **ticket** that's valid for 30 seconds and one use, then pass it in the URL. Testing the server above:

```text
no token     -> handshake rejected: 401
wrong origin -> handshake rejected: 403
valid        -> connected
```

Tokens can expire while a connection is open for hours. Decide what happens then: close the connection when the token expires, or have the client send a fresh token over the socket.

## Security

The usual web security rules apply ([Chapter 17](/system-design/17-backend-security/)), plus a few specific ones:

| Concern | What to do |
| --- | --- |
| **Encryption** | always `wss://` in production; plain `ws://` can be read and modified in transit |
| **Origin check** | allowlist your own origins on the handshake. Without it, any website can open a WebSocket to your server using the visitor's cookies: **Cross-Site WebSocket Hijacking**, the WebSocket version of CSRF |
| **Validate every message** | parse safely, check types and sizes; an authenticated connection doesn't make its messages safe |
| **Limit message size** | `maxPayload` in `ws`; oversized messages close the connection with `1009` |
| **Rate limit** | per connection and per user, so one client can't flood the server |
| **Limit connections per user** | so nobody can open thousands of sockets |

The size limit in action:

```text
20 KB message -> closed with code 1009
```

## Scaling: the backplane

This is the defining hard problem of WebSockets. A connection is **stateful and pinned to one server**: the socket lives in the memory of the process the client connected to. As soon as you run two servers (which you must, for capacity and availability), a question appears: if Asha is connected to server 1 and Ravi to server 2, in the same room, how does Asha's message reach Ravi? Server 1 can't see server 2's sockets.

The answer is a **backplane**: a shared pub/sub system all servers connect to. A server publishes each room message to the backplane; every server is subscribed, receives it, and forwards it to whichever of *its own* sockets are in that room.

![Asha on server 1 and Ravi on server 2 are in the same room; server 1 publishes to Redis, which delivers to server 2, which sends to Ravi](/images/system-design/ws-backplane.svg "Each server only knows its own sockets. The backplane makes them behave as one.")

I ran two servers, put Asha on one and Ravi and Meera on the other, and had Asha post to the `sd-batch` room, first with the backplane turned off, then on:

```text
backplane off: asha (server 1) sees: Has anyone finished chapter 23?
              ravi (server 2, same room) sees: (nothing)
              meera (server 2, other room) sees: (nothing)
backplane on : asha (server 1) sees: Has anyone finished chapter 23?
              ravi (server 2, same room) sees: Has anyone finished chapter 23?
              meera (server 2, other room) sees: (nothing)
```

Without a backplane, the app works perfectly in development on one server and silently loses messages the day you scale to two.

Common backplanes:

- **Redis pub/sub**: simple and fast, but fire-and-forget: a server that isn't subscribed at that moment misses the message. That's why the server above also keeps the last 100 messages per room in a Redis list. (Redis Streams can do both jobs.)
- **Kafka**: when messages should also be durable, replayable and feed other systems ([Chapter 23](/system-design/23-message-brokers-and-kafka/)).
- **NATS** and managed pub/sub services work the same way. Hosted services (Ably, Pusher, AWS API Gateway WebSockets) run the whole connection layer for you.

## Load balancing and deploys

Putting WebSocket servers behind a load balancer needs three things:

- **The load balancer must support the upgrade** and long-lived connections. Nginx, HAProxy, cloud load balancers and Kubernetes ingress controllers all do, but raise idle timeouts (Nginx's `proxy_read_timeout` defaults to 60 seconds) and keep heartbeats more frequent than the timeout.
- **Each connection stays on one server** automatically, since it's one TCP connection. Sticky sessions matter for transports that use several requests (Socket.IO's long-polling fallback), and less once a backplane handles cross-server delivery.
- **Deploys disconnect everyone on the old servers.** With stateless HTTP, a rolling deploy is invisible. With WebSockets, every connection on a retiring instance drops. Drain gracefully: stop accepting new connections, send close code `1001` so clients know to reconnect, and give them time before the process exits ([Chapter 16](/system-design/16-graceful-shutdown/)).

For Nginx, the upgrade needs a few extra lines:

```nginx
location /ws {
    proxy_pass http://chat_servers;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;     # don't close quiet sockets after 60 s
}
```

## Reconnection and resume

Connections drop silently, deploys disconnect everyone, networks are flaky: a real-time client that doesn't reconnect automatically is broken by design. (SSE gets reconnection for free, another reason to prefer it for one-way push.)

```js
// client.mjs: reconnect with exponential backoff and full jitter, then resume from the last sequence number.
import { WebSocket } from "ws";

export function connectWithRetry(urls, { token, room, origin, onMessage, onEvent = () => {} }) {
  let attempt = 0;
  let lastSeq = 0;
  let stopped = false;
  let ws;

  function open() {
    const url = `${urls[attempt % urls.length]}?token=${token}`;     // stand-in for a load balancer picking a healthy server
    ws = new WebSocket(url, { origin });
    ws.on("open", () => {
      attempt = 0;
      ws.send(JSON.stringify({ type: "join", room, since: lastSeq })); // "send me everything after lastSeq"
    });
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw);
      if (msg.type === "joined") return onEvent(`joined ${msg.room} on ${msg.server}`);
      if (msg.type !== "message") return;
      if (msg.seq <= lastSeq) return;                                   // duplicate: already seen
      if (msg.seq > lastSeq + 1) onEvent(`gap detected before seq ${msg.seq}`);
      lastSeq = msg.seq;
      onMessage(msg);
    });
    ws.on("close", (code) => {
      if (stopped) return;
      const ceiling = Math.min(30_000, 500 * 2 ** attempt);              // 0.5 s, 1 s, 2 s ... capped at 30 s
      const delay = Math.random() * ceiling;                             // full jitter spreads out reconnects
      attempt++;
      onEvent(`closed with ${code}, reconnecting in ${Math.round(delay)} ms`);
      setTimeout(open, delay);
    });
    ws.on("error", () => {});                                          // 'close' follows; handled there
  }

  open();
  return { stop() { stopped = true; ws.close(); } };
}
```

To test it, a reader joined a room on server 1 while a writer on server 2 sent messages. Mid-way, server 1 "deployed" (shut down gracefully), and the writer sent two more messages while the reader was disconnected:

```text
reader: joined sd-batch on server-4431
deploying: server 4431 shuts down
reader: closed with 1001, reconnecting in 376 ms
reader: joined sd-batch on server-4432
reader received seq: 1, 2, 3, 4, 5, 6
```

The reader received the `1001`, reconnected to the other server within half a second, said "I've seen up to 3", got 4 and 5 from history, then 6 live. No gaps, no duplicates.

The resilience checklist:

- **Exponential backoff with jitter.** If 50,000 clients drop during a deploy and all reconnect instantly, they knock over the servers that are left (a **thundering herd**). Growing delays plus randomness spread them out.
- **Resume after reconnecting.** Either fetch the current state over normal HTTP, or send the last sequence number you saw and let the server replay what you missed.
- **Detect gaps and duplicates** with per-room or per-user sequence numbers, and make handling idempotent. WebSocket delivery is not exactly-once.
- **Queue outgoing messages briefly while disconnected** and send them after reconnecting, so a user's action during a blip isn't lost.

## Server-Sent Events: the simpler option

When only the server needs to push, **SSE** does it over a normal HTTP response with `Content-Type: text/event-stream`. Each event is a few lines of text ended by a blank line:

```js
app.get("/notifications/stream", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  res.write("retry: 2000\n\n");                                    // tell the browser how long to wait before reconnecting

  const lastId = Number(req.get("Last-Event-ID") ?? 0);            // the browser sends this automatically on reconnect
  for (const e of events) if (e.id > lastId) res.write(`id: ${e.id}\nevent: notification\ndata: ${JSON.stringify(e.data)}\n\n`);

  clients.add(res);
  const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 15_000);   // comment line stops proxies timing out
  req.on("close", () => { clearInterval(keepAlive); clients.delete(res); });
});
```

```text
--- first connection, raw stream:
retry: 2000

id: 1
event: notification
data: {"text":"Chapter 24 is live"}

id: 2
event: notification
data: {"text":"Your doubt got a reply"}

--- reconnect with Last-Event-ID: 2
retry: 2000

id: 3
event: notification
data: {"text":"New comment on your post"}
```

In the browser it's three lines:

```js
const source = new EventSource("/notifications/stream", { withCredentials: true });
source.addEventListener("notification", (e) => showToast(JSON.parse(e.data)));
// reconnects by itself and sends Last-Event-ID, so missed events are replayed
```

The `id:` lines are the whole resume mechanism: after a drop, the browser reconnects and sends `Last-Event-ID`, and the server replays what came after it. SSE uses cookies normally, works with HTTP/2 (where many streams share one connection), and needs no special proxy configuration beyond disabling response buffering. Its limits: text only, and one direction (the client still sends with normal HTTP requests), which is all most notification and dashboard features need. AI chat interfaces stream their tokens this way.

## Choosing a transport

| Need | Use | Why |
| --- | --- | --- |
| rare updates, delay is fine | **polling** | trivial and stateless |
| server → browser push | **SSE** | plain HTTP, automatic reconnect and resume |
| frequent messages both ways in a browser | **WebSocket** | the only true low-latency two-way option in browsers |
| service ↔ service streaming | **gRPC streaming** | typed and efficient over HTTP/2 |

Start from the left and move right only when you have to. Choosing WebSockets when SSE or polling would do is one of the most common and expensive over-engineering mistakes in real-time features.

## Common pitfalls

| Pitfall | What happens | Fix |
| --- | --- | --- |
| **Leaked connections** | a disconnect path forgets cleanup; memory grows until the server dies | clean up on every `close`, whatever the cause |
| **No heartbeat** | zombie connections fill the server | ping on a timer; terminate on a missed pong |
| **Unbounded send queues** | one slow client exhausts memory | check `bufferedAmount`; drop, disconnect or conflate |
| **Unhandled socket errors** | one bad frame crashes the whole process | an `error` listener on every socket; catch async handler errors |
| **Slow work in message handlers** | every socket on that process stalls | keep handlers fast; offload to a job queue |
| **No origin check** | cross-site WebSocket hijacking | allowlist origins |
| **No backplane** | messages vanish between users on different servers | pub/sub from the start |
| **No reconnect logic** | clients silently stop receiving after the first blip or deploy | backoff with jitter, then resume |

Almost every item is a resource that wasn't limited or released. Stateless HTTP forgives this because each request cleans up after itself in milliseconds; a WebSocket lives for hours.

## Designing real-time systems

1. **Choose the lightest transport that works**: polling → SSE → WebSocket.
2. **Design the backplane in from the start** if you'll ever run more than one server, which in production you always will.
3. **Treat disconnection as normal**: heartbeats to detect it, graceful drains on deploy, client reconnection with backoff, and resume.
4. **Limit everything per connection**: queue size, message size, message rate, connections per user.
5. **Don't assume reliable, ordered, exactly-once delivery.** Use sequence numbers and idempotent handling where gaps matter.
6. **Authenticate at the handshake, authorize every message, use `wss://` and check origins.**
7. **Keep handlers fast and catch every error.**

## Quick revision

| Concept | Remember |
| --- | --- |
| Why | HTTP can't push; WebSockets give a persistent two-way connection |
| Spectrum | polling → long polling → SSE (one way) → WebSocket (two way) |
| Handshake | `GET` with `Upgrade: websocket` → `101 Switching Protocols` |
| Accept header | base64(SHA-1(key + fixed GUID)); proves protocol support, not security |
| Frames | FIN + opcode + length; client frames masked; message boundaries kept |
| Close codes | 1000 normal, 1001 going away, 1006 dropped, 1009 too big |
| Heartbeat | ping on a timer; no pong = dead; stops zombies and idle timeouts |
| Server | `ws` or Socket.IO; error listener on every socket; clean up on close |
| Rooms | map of room → sockets; authorize every join and message |
| Backpressure | watch `bufferedAmount`; drop, disconnect or conflate |
| Auth | at the handshake: cookie + origin check, short-lived ticket, or first message |
| Security | `wss://`, origin allowlist, validate messages, size and rate limits |
| Backplane | Redis pub/sub or Kafka so any server can reach any socket |
| Deploys | every connection drops; drain with 1001; clients must reconnect |
| Reconnect | exponential backoff + jitter, then resume from the last sequence number |
| SSE | `text/event-stream`, `id:` + `Last-Event-ID` resume, auto-reconnect |

## Interview questions

1. Why can't plain HTTP push data to the client? What's wrong with polling?
2. Compare short polling, long polling, SSE and WebSockets. When would you use each?
3. Walk through the WebSocket handshake. Why does it return `101`, and what does `Sec-WebSocket-Accept` prove?
4. Why are client-to-server frames masked?
5. What do close codes 1000, 1001 and 1006 mean?
6. Why do WebSocket servers need heartbeats?
7. How would you implement chat rooms on a single server?
8. What is backpressure? What should a server do with a slow client?
9. How do you authenticate a WebSocket connection from a browser, given that you can't set an `Authorization` header?
10. What is Cross-Site WebSocket Hijacking and how do you prevent it?
11. You scale a chat app from one server to three and users stop receiving some messages. Why, and how do you fix it?
12. What changes for load balancers and deployments when you use WebSockets?
13. Design a client reconnection strategy. Why add jitter?
14. How can a client recover messages it missed while disconnected?
15. How does SSE resume after a disconnect?
16. What are the most common resource leaks in WebSocket servers?

## Further reading

- [MDN: The WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) and [Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455)
- [ws: a Node.js WebSocket library](https://github.com/websockets/ws) and [Socket.IO](https://socket.io/docs/v4/)
- [Redis pub/sub](https://redis.io/docs/latest/develop/interact/pubsub/)
- [NGINX: WebSocket proxying](https://nginx.org/en/docs/http/websocket.html)
- [OWASP: WebSocket security cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)
- [AWS: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

Next: [Chapter 25, The OpenAPI Specification](/system-design/25-openapi-specification/).
