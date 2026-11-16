---
title: Serialization and Deserialization
description: Why a JavaScript client and a Go or Java server need a shared data format, text vs binary formats, JSON rules, JSON.stringify and JSON.parse gotchas, the full request round trip in Express, and why parsed data still has to be validated.
author: Bitwise School
---

Your React app is written in JavaScript. The API it calls might be written in Node.js, but it could just as easily be Go, Java, Python or Rust. Somehow a JavaScript object typed into a form ends up as a Go struct on a server in Mumbai, and the reply comes back as a JavaScript object again. This chapter is about how that works.

> **Serialization** turns data from your program's memory into a standard format that can be sent over a network or saved to disk. **Deserialization** is the reverse: it reads that format and rebuilds data your program can use.

## The problem: programs don't share memory layouts

Inside a running program, data lives in memory in a shape only that language understands:

- A **JavaScript** object is a bag of properties that can change type at runtime. `qty` can be `2` now and `"two"` later.
- A **Go** struct has fixed fields with fixed types, laid out in memory by the Go compiler.
- A **Java** object has a class, a header the JVM uses, and fields the JVM manages.

None of these can be copied byte for byte from one machine to another. The memory addresses mean nothing on the other side, and the other side may not even use the same language. The network only carries **bytes**. So before data leaves a program, it has to become bytes in a format both sides have agreed on.

That agreement is the whole trick. Once client and server both promise "we speak JSON", neither has to care what language the other one uses. The format is **language-agnostic**: a Python service, a Java service and a browser can all read the same JSON.

## Serialize on the way out, deserialize on the way in

| Step | Direction | JavaScript | Go | Python | Java (Jackson) |
| --- | --- | --- | --- | --- | --- |
| Serialize | native data → JSON text | `JSON.stringify(obj)` | `json.Marshal(v)` | `json.dumps(obj)` | `mapper.writeValueAsString(obj)` |
| Deserialize | JSON text → native data | `JSON.parse(text)` | `json.Unmarshal(b, &v)` | `json.loads(text)` | `mapper.readValue(text, Order.class)` |

The names differ, the idea is the same everywhere. Serialization is not only for networks either. You also serialize when you:

- save state to `localStorage` (it only stores strings, so you `JSON.stringify` first),
- write a config or log file,
- put an object in Redis or a message queue,
- store a document in MongoDB (the driver turns it into BSON, a binary cousin of JSON).

## Text formats vs binary formats

There are many serialization formats. They fall into two groups.

| Format | Type | Readable by humans | Schema needed | Where you'll see it |
| --- | --- | --- | --- | --- |
| **JSON** | text | yes | no | REST APIs, logs, `package.json` |
| **XML** | text | yes, but verbose | optional | SOAP services, RSS feeds, older banking and government APIs |
| **YAML** | text | very | no | Docker Compose, GitHub Actions, Kubernetes config |
| **CSV** | text | yes | no | spreadsheets, data exports |
| **Protocol Buffers** | binary | no | yes (`.proto` file) | gRPC between microservices |
| **Avro** | binary | no | yes | Kafka pipelines, big data |
| **MessagePack** | binary | no | no | caches, games, "faster JSON" |

**Text formats** are easy to read and debug: you can open a request in DevTools and understand it. **Binary formats** are smaller and faster to encode and decode, but you need a tool (and usually a schema) to read them.

Here is the same order in JSON and in Protocol Buffers:

```json
{"itemId":12,"quantity":2}
```

```text
syntax = "proto3";

message Order {
  int32 item_id = 1;
  int32 quantity = 2;
}
```

The JSON is 26 bytes. The Protobuf encoding of the same values is **4 bytes**, because the field names are not sent at all: both sides already have the `.proto` file, so the bytes only carry "field 1 = 12, field 2 = 2". That saving matters when services exchange millions of messages a second. For a browser talking to an API, JSON's readability usually wins.

## JSON: the default for web APIs

JSON stands for **JavaScript Object Notation**. It borrowed its syntax from JavaScript object literals, but it is a separate standard (RFC 8259) and every mainstream language can read and write it. Most REST APIs use it because:

- you can read it with your eyes, in DevTools, in logs, in `curl` output,
- it maps directly onto ideas every language has: objects or maps, arrays or lists, strings, numbers, booleans and null,
- browsers parse it natively and quickly with `JSON.parse` and `res.json()`.

## JSON syntax rules

JSON is small. These are all the rules you need:

1. A value is one of six types: **object**, **array**, **string**, **number**, **boolean** (`true`/`false`) or **`null`**.
2. An object is wrapped in `{ }` and holds `"key": value` pairs separated by commas.
3. **Keys must be strings in double quotes.** Single quotes are not allowed anywhere in JSON.
4. Objects and arrays can nest inside each other as deep as you need.
5. No comments, no trailing commas, no `undefined`, no functions, no dates (dates travel as strings).

```json
{
  "id": 981,
  "customer": { "name": "Asha", "phone": "+91-98xxxxxx10" },
  "items": [
    { "itemId": 12, "name": "Paneer tikka", "price": 249.5, "veg": true },
    { "itemId": 31, "name": "Butter naan", "price": 45, "veg": true }
  ],
  "coupon": null,
  "placedAt": "2026-11-14T10:30:00.000Z"
}
```

And the mistakes that make a JSON parser throw:

```text
{
  name: "Asha",            ← key is not in double quotes
  'city': 'Delhi',         ← single quotes
  "age": 21,
  "skills": ["js", "go",], ← trailing comma
  // "notes": "..."        ← comments are not allowed
}
```

## JSON.stringify and JSON.parse in practice

### What JSON.stringify does to tricky values

Not every JavaScript value has a JSON equivalent. `JSON.stringify` quietly converts or drops the ones that don't:

```js
const order = {
  id: 981,
  placedAt: new Date("2026-11-14T10:30:00Z"),
  coupon: undefined,
  total: NaN,
  notify() {},
  tags: new Set(["veg", "spicy"]),
};

JSON.stringify(order);
// '{"id":981,"placedAt":"2026-11-14T10:30:00.000Z","total":null,"tags":{}}'
```

| Value | Becomes |
| --- | --- |
| `Date` | an ISO string (it has a built-in `toJSON` method) |
| `undefined`, functions, symbols | removed from objects; `null` inside arrays |
| `NaN`, `Infinity` | `null` |
| `Map`, `Set` | `{}` (their entries are lost) |
| `BigInt` | throws `TypeError: Do not know how to serialize a BigInt` |

### Dates come back as strings

Deserializing does not undo those conversions. `JSON.parse` has no idea that a string used to be a date:

```js
const parsed = JSON.parse('{"placedAt":"2026-11-14T10:30:00.000Z"}');
typeof parsed.placedAt;         // "string"
new Date(parsed.placedAt);      // turn it back into a Date yourself

// Or let a reviver function do it while parsing
const data = JSON.parse(text, (key, value) => (key === "placedAt" ? new Date(value) : value));
```

### Controlling what gets serialized

Never send a password hash or an internal field to the client by accident. You have a few ways to control the output:

```js
// 1. Pick the keys you want
JSON.stringify(user, ["id", "name"]);     // '{"id":1,"name":"Asha"}'

// 2. Give the object a toJSON method; stringify calls it automatically
const user = {
  id: 1,
  name: "Asha",
  passwordHash: "$2b$10$...",
  toJSON() {
    const { passwordHash, ...safe } = this;
    return safe;
  },
};

// 3. Private class fields are never serialized
class Account {
  #passwordHash;
  constructor(id, name, passwordHash) {
    this.id = id;
    this.name = name;
    this.#passwordHash = passwordHash;
  }
}
JSON.stringify(new Account(1, "Asha", "$2b$10$...")); // '{"id":1,"name":"Asha"}'
```

With Mongoose, mark the field `select: false` in the schema or add a `toJSON` transform, as shown in the [Mongoose note](/notes/mongoose).

Two more helpers you will use often:

```js
JSON.stringify(data, null, 2);   // pretty-print with 2-space indentation (great for logs and files)

try {
  JSON.parse(badText);           // invalid JSON throws a SyntaxError
} catch (err) {
  console.error("Not valid JSON:", err.message);
}
```

### Large numbers lose precision

JavaScript stores every number as a 64-bit float, which is exact only up to `2^53 - 1` (9007199254740991). A Java or Go server can happily send a 64-bit ID bigger than that, and `JSON.parse` will silently round it:

```js
JSON.parse('{"id": 1234567890123456789}').id;   // 1234567890123456800 (wrong!)
```

That is why many APIs send big IDs as strings (`"id": "1234567890123456789"`). Do the same for money if you need exact values: store paise as an integer, or send amounts as strings.

### JSON is not a deep-clone tool

`JSON.parse(JSON.stringify(obj))` copies an object, but it also turns dates into strings and drops `undefined`, functions, `Map` and `Set`. Use `structuredClone(obj)` instead. The [shallow vs deep copy note](/notes/shallow-vs-deep-copy) has the details.

## What happens on the wire

Between the two programs, the network stack does a lot of work. TCP splits your JSON into segments, IP wraps them in packets, the network card sends frames as electrical or radio signals, and the other side reassembles everything in order. That is the **OSI model** from [computer networks](/notes/computer-networks).

As a backend developer you work at the top, in the **application layer**. You hand the network a string of JSON text and the server receives exactly that string. You never touch packets or frames. What you *do* control is the label on the data: the `Content-Type` header.

```text
Content-Type: application/json; charset=utf-8
```

This header tells the receiver "the body is JSON, encoded as UTF-8". If it is missing or wrong, many servers will not parse the body at all, which is the cause of the classic "why is `req.body` undefined?" bug.

## The full round trip in an Express app

![A JavaScript object is serialized to JSON, parsed into a Go struct on the server, and the response makes the same trip back](/images/system-design/serialization-round-trip.svg "Two conversions on the way there, two on the way back. Only JSON text crosses the network.")

Here is the same flow in code, with a React client and an Express server:

```js
// Client (browser)
const res = await fetch("/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ itemId: 12, quantity: 2 }),   // 1. serialize
});
const order = await res.json();                          // 4. deserialize
console.log(order.id);
```

```js
// Server (Express 5)
import express from "express";

const app = express();
app.use(express.json({ limit: "100kb" }));   // 2. deserialize: JSON text → req.body

app.post("/api/orders", async (req, res) => {
  const { itemId, quantity } = req.body;
  const order = await Order.create({ itemId, quantity });
  res.status(201).json(order);               // 3. serialize: object → JSON text
});
```

A few details worth knowing:

- `express.json()` only parses bodies whose `Content-Type` is `application/json`. In Express 5, if nothing parsed the body, `req.body` is `undefined`.
- If the client sends broken JSON, `express.json()` passes a `SyntaxError` with status 400 to your error handler. Return a clear message instead of a stack trace.
- The `limit` option stops someone from sending you a 500 MB body and filling your server's memory.
- `res.json()` calls `JSON.stringify` for you and sets `Content-Type: application/json`.

## Deserializing is not the same as trusting

`JSON.parse` only checks that the text is valid JSON. It does not check that the data makes sense. This parses perfectly:

```json
{ "itemId": "DROP TABLE", "quantity": -50 }
```

So after deserializing, **validate**: check types, ranges and required fields before the data reaches your database. A schema library like Zod makes this short:

```js
import { z } from "zod";

const OrderInput = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
});

app.post("/api/orders", async (req, res) => {
  const result = OrderInput.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ errors: result.error.issues });
  }
  const order = await Order.create(result.data);
  res.status(201).json(order);
});
```

The same thinking applies in the other direction: when you serialize a response, decide exactly which fields leave the server.

## Quick revision

| Term | Meaning |
| --- | --- |
| Serialization | native data in memory → a standard format (JSON, Protobuf…) |
| Deserialization | standard format → native data the program can use |
| Language-agnostic | any language can produce and read the format |
| Text format | human-readable: JSON, XML, YAML, CSV |
| Binary format | compact and fast, needs a schema or tool: Protobuf, Avro, MessagePack |
| `Content-Type: application/json` | tells the receiver the body is JSON |
| Validation | checking parsed data is correct before using it |

## Interview questions

1. What are serialization and deserialization? Why can't a server read a JavaScript object directly?
2. JSON vs XML vs Protocol Buffers: when would you pick each one?
3. Why is a Protobuf message smaller than the same data in JSON?
4. What does `JSON.stringify` do with a `Date`, `undefined`, `NaN` and a `Map`?
5. A 64-bit ID from a Java service arrives slightly wrong in the browser. Why, and how do you fix it?
6. Is `JSON.parse(JSON.stringify(obj))` a good way to deep-clone? What would you use instead?
7. Why is `req.body` undefined in an Express route, and how do you fix it?
8. What is the difference between deserializing input and validating it?
9. How do you make sure a password hash never appears in an API response?

## Further reading

- [MDN: JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) and [JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [RFC 8259: The JSON format](https://www.rfc-editor.org/rfc/rfc8259)
- [Protocol Buffers overview](https://protobuf.dev/overview/)
- [Express: express.json()](https://expressjs.com/en/5x/api.html#express.json)

Next: [Chapter 04, Authentication and Authorization](/system-design/04-authentication-and-authorization/).
