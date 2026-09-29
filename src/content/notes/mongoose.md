---
title: "Mongoose: Schemas, Models, Validation and Relationships"
description: Using MongoDB from Express with Mongoose. Connecting, schemas and types, validation, models and CRUD, update pitfalls, populate for relationships, hooks, methods, statics and virtuals, timestamps, indexes, lean queries, pagination, transactions and a complete API example.
author: Vikas Patel
---

**Mongoose** is an **ODM** (Object Data Modelling library) for [MongoDB](/notes/mongodb). MongoDB accepts any document shape; Mongoose adds a **schema** on the application side, so you get validation, defaults, type casting, relationships (`populate`), hooks and helper methods. It's the standard choice in Express + MongoDB projects.

```bash
npm install mongoose
```

## Connecting

```js
// src/config/db.js
import mongoose from "mongoose";

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);   // e.g. mongodb+srv://… from Atlas
  console.log("MongoDB connected");
}

// src/server.js
import { app } from "./app.js";
import { connectDB } from "./config/db.js";

await connectDB();                                   // connect once, before accepting requests
app.listen(process.env.PORT ?? 3000);
```

Mongoose keeps a **connection pool** and reuses it for every query. Don't connect inside route handlers.

## Schemas

A schema describes the shape of documents in a collection: field types, rules and defaults.

```js
import mongoose from "mongoose";
const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, match: /^\S+@\S+\.\S+$/ },
    age: { type: Number, min: 16, max: 100 },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    skills: { type: [String], default: [] },
    address: { city: String, pincode: String },                 // nested object
    isActive: { type: Boolean, default: true },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }], // references (see populate)
  },
  { timestamps: true },                                         // adds createdAt and updatedAt
);
```

| Type | Notes |
| --- | --- |
| `String`, `Number`, `Boolean`, `Date` | basic types; Mongoose **casts** `"21"` to `21` for a Number |
| `[String]`, `[subSchema]` | arrays of values or of subdocuments |
| `Schema.Types.ObjectId` | a reference to another document (use with `ref`) |
| `Schema.Types.Decimal128` | exact decimals, for money |
| `Map`, `Buffer`, `Schema.Types.Mixed` | flexible types (`Mixed` loses change tracking: avoid it) |

**`unique: true` is not a validator.** It creates a unique **index** in MongoDB. A duplicate insert fails with a database error code `11000`, which you should turn into a 409 response.

## Models and CRUD

A **model** is a class built from the schema. Each model maps to a collection (`Student` → `students`).

```js
export const Student = mongoose.model("Student", studentSchema);
```

```js
// Create
const asha = await Student.create({ name: "Asha", email: "asha@example.com", age: 21 });

// Read
await Student.find();                                         // all
await Student.find({ level: "beginner", age: { $gte: 18 } }); // any MongoDB filter works
await Student.findOne({ email: "asha@example.com" });         // first match or null
await Student.findById(asha._id);                             // by id, or null
await Student.find().select("name email").sort({ name: 1 }).limit(10); // projection, sort, limit
await Student.countDocuments({ isActive: true });

// Update
await Student.updateOne({ _id: asha._id }, { $set: { level: "intermediate" } });
const updated = await Student.findByIdAndUpdate(
  asha._id,
  { $inc: { age: 1 } },
  { new: true, runValidators: true },  // return the NEW document and validate the update
);

// Delete
await Student.deleteOne({ _id: asha._id });
await Student.findByIdAndDelete(asha._id);  // returns the deleted document
await Student.deleteMany({ isActive: false });
```

Every query returns a promise, so always `await` it. Mongoose removed callback APIs years ago.

### Update pitfalls

- `findByIdAndUpdate` returns the **old** document unless you pass `{ new: true }`.
- Update methods **don't run validators** unless you pass `{ runValidators: true }`.
- They also **skip `save` hooks** (such as password hashing). For logic that must always run, load the document, change it and call `save()`:

```js
const student = await Student.findById(id);
if (!student) throw notFound();
student.level = "advanced";
await student.save();                  // runs validation and save hooks
```

- **Mass assignment:** `Student.findByIdAndUpdate(id, req.body)` lets a user set fields like `role: "admin"`. Pick or validate the allowed fields first.

## Validation

Built-in validators: `required`, `min`/`max` (numbers, dates), `minlength`/`maxlength`, `match` (regex), `enum`. Custom validators:

```js
phone: {
  type: String,
  validate: {
    validator: (v) => /^[6-9]\d{9}$/.test(v),
    message: (props) => `${props.value} is not a valid Indian mobile number`,
  },
},
```

A failed validation throws a `ValidationError` whose `errors` object has a message per field. Turn it into a 400 in your [error handler](/notes/express-routing-middleware). Validate request input (with Zod or Joi) **and** keep schema rules as the last line of defence.

## Relationships with populate

Store an `ObjectId` with a `ref`, then `populate` replaces the id with the actual document:

```js
const courseSchema = new Schema({
  title: String,
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher" },
});
const Course = mongoose.model("Course", courseSchema);

const course = await Course.findById(id).populate("teacher", "name email"); // only these fields
console.log(course.teacher.name);

// Nested populate: a student's courses, and each course's teacher
await Student.findById(id).populate({ path: "courses", populate: { path: "teacher", select: "name" } });
```

`populate` runs **extra queries** behind the scenes (one per path). It's convenient, but on hot paths with big lists consider embedding, or a single aggregation with `$lookup`. See [embed vs reference](/notes/mongodb).

## Hooks (middleware)

Mongoose **middleware** runs before or after operations like `save`, `validate`, `deleteOne` and `find`.

```js
import bcrypt from "bcrypt";

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;         // only hash when the password changed
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.post("save", function (doc) {
  console.log("saved user", doc._id);
});
```

Use a normal `function`, not an arrow function: Mongoose sets `this` to the document (or the query in query hooks). Write pre hooks as `async` functions; there's no need to call `next()`.

## Methods, statics and virtuals

```js
// Instance method: called on a document
userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Static: called on the model
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual: a computed property, not stored in the database
studentSchema.virtual("isAdult").get(function () {
  return this.age >= 18;
});

const user = await User.findByEmail("asha@example.com");
const ok = await user?.checkPassword("secret");
```

Virtuals aren't included in `JSON` output unless you set `toJSON: { virtuals: true }` in the schema options.

## Performance tips

```js
// lean(): plain JavaScript objects instead of full Mongoose documents: faster, less memory
const list = await Student.find({ isActive: true }).select("name level").lean();

// Indexes for fields you filter or sort on
studentSchema.index({ level: 1, createdAt: -1 });

// Pagination with a total count
const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(50, Number(req.query.limit) || 10);  // cap the page size
const [items, total] = await Promise.all([
  Student.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  Student.countDocuments(),
]);
```

- Use `lean()` for read-only API responses (you can't call `save()` on the result).
- `select()` only the fields you need.
- Never return unlimited lists: always paginate.

## Transactions

When several writes must all succeed or all fail (move money, enrol and charge), use a transaction. They need a **replica set** (Atlas clusters are replica sets).

```js
await mongoose.connection.transaction(async (session) => {
  await Wallet.updateOne({ user: from }, { $inc: { balance: -100 } }, { session });
  await Wallet.updateOne({ user: to }, { $inc: { balance: 100 } }, { session });
}); // commits if the function succeeds, aborts (and retries transient errors) if it throws
```

## A complete API

```js
// src/routes/students.js
import { Router } from "express";
import mongoose from "mongoose";
import { Student } from "../models/student.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json(await Student.find().sort({ createdAt: -1 }).limit(20).lean());
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Bad id" });
  const student = await Student.findById(req.params.id).lean();
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json(student);
});

router.post("/", async (req, res) => {
  const { name, email, age } = req.body;              // only the fields we allow
  const student = await Student.create({ name, email, age });
  res.status(201).json(student);
});

export default router;
```

With Express 5, a thrown `ValidationError` or duplicate-key error reaches your error handler, where you map `ValidationError` → 400 and code `11000` → 409.

## Mongoose vs the native driver

| | Mongoose | Native `mongodb` driver |
| --- | --- | --- |
| schema and validation | yes | no (use JSON Schema validation in MongoDB) |
| hooks, virtuals, populate | yes | no |
| learning curve | gentle for beginners | more manual |
| speed | slightly slower (document overhead; `lean()` helps) | fastest |
| best for | typical Express apps | performance-critical code, full control |

## Interview questions

1. What is an ODM? Why use Mongoose instead of the driver?
2. Schema vs model.
3. Why doesn't `findByIdAndUpdate` return the updated document or run validators by default?
4. Is `unique: true` a validator? What happens on a duplicate?
5. How does `populate` work? What's its cost?
6. Pre vs post hooks. Why use a normal function instead of an arrow function in hooks?
7. What does `lean()` do and when shouldn't you use it?
8. How do you do a transaction in Mongoose?

## Further reading

- [Mongoose documentation](https://mongoosejs.com/docs/guide.html)
- [Mongoose: Populate](https://mongoosejs.com/docs/populate.html) and [Middleware](https://mongoosejs.com/docs/middleware.html)

Next: [PostgreSQL with Node.js](/notes/postgresql-nodejs).
