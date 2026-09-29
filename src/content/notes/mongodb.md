---
title: "MongoDB: Documents, CRUD, Queries, Indexes and Data Modelling"
description: How MongoDB stores data as documents with a diagram, SQL vs NoSQL, setting up Atlas or a local server, mongosh commands, CRUD, query and update operators, sorting and pagination, indexes and explain, the aggregation pipeline, embedding vs referencing, and using MongoDB from Node.js.
author: Vikas Patel
---

**MongoDB** is a **document database**: instead of rows in tables, it stores JSON-like **documents** in **collections**. It's the "M" in the **MERN** (MongoDB, Express, React, Node), **MEAN** (Angular) and **MEVN** (Vue) stacks, and it feels natural in JavaScript because documents look just like JavaScript objects.

## Documents and collections

![A bitwise database containing a students collection, with one student document that embeds skills, an address and enrolments](/images/backend/mongodb-document-model.svg "A document can hold arrays and nested objects, so related data often lives together.")

| SQL | MongoDB |
| --- | --- |
| database | database |
| table | **collection** |
| row | **document** |
| column | field |
| primary key | `_id` (added automatically, an `ObjectId`) |
| JOIN | embedding, or `$lookup` / Mongoose `populate` |

### JSON vs BSON

You write JSON-like objects, but MongoDB stores **BSON** (binary JSON). BSON is faster to scan and supports more types than JSON: `ObjectId`, `Date`, 64-bit integers, `Decimal128` (for money) and binary data. A document can be at most **16 MB**.

## SQL vs MongoDB: when to use which

| | SQL (PostgreSQL, MySQL) | MongoDB |
| --- | --- | --- |
| structure | fixed schema, tables and columns | flexible documents; shape can vary |
| relationships | foreign keys and JOINs, very strong | embedding, or references with `$lookup` |
| transactions | the core strength | supported (multi-document since 4.0), used less |
| scaling | vertical first; read replicas; sharding is harder | built-in **sharding** for horizontal scaling |
| good for | payments, orders, anything highly relational | catalogues, content, user profiles, events, fast-changing shapes |

"Schema-less" doesn't mean "no design". You still decide the shape of your documents; the database just doesn't enforce it unless you ask it to (with Mongoose or JSON Schema validation). Neither database is "better": choose by your data. See [PostgreSQL with Node.js](/notes/postgresql-nodejs) for the relational side.

## Setting up

**Easiest:** a free cluster on **[MongoDB Atlas](https://www.mongodb.com/atlas)** (cloud). Create a database user, allow your IP address, and copy the connection string.

**Local on a Mac (Homebrew):**

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community     # run it in the background
mongosh                                   # open the shell (connects to mongodb://127.0.0.1:27017)
```

On Windows, use the MSI installer from mongodb.com; with Docker: `docker run -d -p 27017:27017 mongo`. **MongoDB Compass** is the official GUI for browsing data.

The flow: your **server** (a `mongod` process) stores the data; **clients** (mongosh, Compass, your Node app) connect to it and send commands.

## mongosh basics

```js
show dbs                  // list databases
db                        // current database
use bitwise               // switch to (and lazily create) a database
show collections
db.dropDatabase()         // delete the current database: careful!
```

A database or collection is created **the first time you insert** into it.

## CRUD

```js
// Create
db.students.insertOne({ name: "Asha", age: 21, skills: ["js", "node"], city: "Delhi" });
db.students.insertMany([
  { name: "Ravi", age: 23, skills: ["java"], city: "Pune" },
  { name: "Meena", age: 20, skills: ["js", "react"], city: "Delhi" },
]);

// Read
db.students.find();                                  // all documents
db.students.find({ city: "Delhi" });                 // filter
db.students.findOne({ name: "Asha" });
db.students.find({ city: "Delhi" }, { name: 1, _id: 0 }); // projection: only the name field
db.students.countDocuments({ city: "Delhi" });       // 2

// Update
db.students.updateOne({ name: "Asha" }, { $set: { age: 22 } });
db.students.updateMany({ city: "Delhi" }, { $set: { region: "North" } });
db.students.updateOne({ name: "Asha" }, { $push: { skills: "mongodb" } });

// Delete
db.students.deleteOne({ name: "Ravi" });
db.students.deleteMany({ age: { $lt: 18 } });
```

**Always use an update operator** like `$set`. Passing a plain object to `replaceOne` replaces the **whole** document.

## Query operators

| Kind | Operators | Example |
| --- | --- | --- |
| comparison | `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin` | `{ age: { $gte: 18, $lt: 25 } }` |
| logical | `$and`, `$or`, `$not`, `$nor` | `{ $or: [{ city: "Delhi" }, { age: { $gt: 22 } }] }` |
| element | `$exists`, `$type` | `{ phone: { $exists: true } }` |
| array | `$all`, `$elemMatch`, `$size` | `{ skills: { $all: ["js", "react"] } }` |
| text / pattern | `$regex`, `$text` | `{ name: { $regex: "^A", $options: "i" } }` |

Matching an array is easy: `{ skills: "js" }` finds every student whose `skills` array **contains** `"js"`. Nested fields use dot notation in quotes: `{ "address.city": "Delhi" }`.

### Update operators

| Operator | Effect |
| --- | --- |
| `$set` / `$unset` | set / remove a field |
| `$inc` | add to a number: `{ $inc: { views: 1 } }` |
| `$push` / `$addToSet` | add to an array (`$addToSet` skips duplicates) |
| `$pull` | remove matching items from an array |
| `$rename` | rename a field |

`updateOne(filter, update, { upsert: true })` inserts a new document when nothing matches.

## Sorting and pagination

```js
db.students.find({ city: "Delhi" }).sort({ age: -1 }).skip(20).limit(10); // page 3, 10 per page, oldest first
```

`skip` gets slow on large collections because the server still walks the skipped documents. For big feeds, use **range (cursor) pagination**: `find({ _id: { $gt: lastSeenId } }).limit(10)`.

## Indexes

Without an index, a query **scans every document** (a "COLLSCAN"). An index is a sorted structure (a B-tree) that lets MongoDB jump straight to matches.

```js
db.students.createIndex({ email: 1 }, { unique: true });   // fast lookups + no duplicate emails
db.students.createIndex({ city: 1, age: -1 });             // compound: city, then age
db.students.find({ city: "Delhi" }).sort({ age: -1 }).explain("executionStats"); // look for IXSCAN
```

- `_id` is always indexed.
- A **compound** index `{ city: 1, age: -1 }` serves queries on `city`, and on `city` + `age`, but not on `age` alone (the **prefix** rule).
- Indexes speed up reads but slow down writes and use memory. Index what you actually query.

## Aggregation pipeline

The **aggregation pipeline** processes documents through stages, like a Unix pipe. It's MongoDB's answer to SQL's `GROUP BY` and `JOIN`.

```js
db.students.aggregate([
  { $match: { age: { $gte: 18 } } },                      // WHERE
  { $unwind: "$skills" },                                 // one document per skill
  { $group: { _id: "$skills", students: { $sum: 1 } } },  // GROUP BY skill, COUNT(*)
  { $sort: { students: -1 } },                            // ORDER BY
  { $limit: 5 },
]);
// [{ _id: "js", students: 2 }, …]
```

Other common stages: `$project` (choose and compute fields), `$lookup` (join with another collection), `$addFields`, `$count`, `$facet` (several pipelines at once, for example results plus total count).

## Data modelling: embed or reference?

The main design decision in MongoDB. **Model for how your app reads the data.**

| Relationship | Example | Usually |
| --- | --- | --- |
| one-to-one | user → profile | **embed** the profile in the user |
| one-to-few | user → addresses | **embed** an array |
| one-to-many | course → lessons (hundreds) | **reference**: store `courseId` in each lesson |
| one-to-squillions | server → log entries (millions) | **reference** from the child; never an array in the parent |
| many-to-many | students ↔ courses | an **enrolments** collection, or arrays of ids on one side |

```js
// Embedding: one read gets everything; best when the data is always read together
{ _id: 1, title: "Post", comments: [{ text: "Nice" }, { text: "Good" }] }

// Referencing: data lives separately; join when needed ($lookup or Mongoose populate)
{ _id: 1, title: "Post", comments: [ObjectId("…"), ObjectId("…")] }
{ _id: ObjectId("…"), postId: 1, text: "Nice" }
```

**Embed** when the child data is small, bounded, and read with the parent. **Reference** when it grows without limit, is shared by many parents, or is often read on its own. Remember the 16 MB document limit: an ever-growing array is a bug waiting to happen.

## MongoDB from Node.js

Two options:

- **The official driver** (`mongodb` package): full control, no schema.
- **Mongoose** (an **ODM**, Object Data Modelling library): schemas, validation, hooks and `populate` on top of the driver. Most Express tutorials use it. See [Mongoose](/notes/mongoose).

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);   // connection string from .env
await client.connect();                                    // connect once at startup and reuse
const students = client.db("bitwise").collection("students");

const delhi = await students.find({ city: "Delhi" }).sort({ name: 1 }).toArray();
await students.updateOne({ name: "Asha" }, { $inc: { points: 10 } });
```

Create **one** client when the app starts and reuse it: it keeps a connection pool. Connecting on every request is slow and can exhaust connections.

### Security basics

- Keep the connection string in an environment variable; never commit it.
- In Atlas, allow only your server's IP addresses, and give the app user only the permissions it needs.
- **NoSQL injection:** if `req.body.email` is an object like `{ "$ne": null }`, `find({ email: req.body.email })` matches **every** user. Validate input types (with Zod or Joi) before querying.

## Interview questions

1. SQL vs NoSQL. When would you choose MongoDB over PostgreSQL?
2. What is BSON? Why does MongoDB use it?
3. Embedding vs referencing. How do you model one-to-many and many-to-many?
4. What is an index? How do you check if a query uses one? What is the prefix rule for compound indexes?
5. Explain the aggregation pipeline. Write a pipeline to count students per city.
6. `$set` vs replacing a document. What does `upsert` do?
7. Why is `skip` slow for deep pagination?
8. What is NoSQL injection and how do you prevent it?

## Further reading

- [MongoDB manual: CRUD operations](https://www.mongodb.com/docs/manual/crud/)
- [MongoDB: Data modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- [MongoDB University](https://learn.mongodb.com/): free official courses

Next: [Mongoose: schemas, models and relationships](/notes/mongoose).
