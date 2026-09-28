---
title: Mongoose
description: Schemas, models, CRUD, validation, hooks, virtuals, population, indexes and best practices.
author: Vikas Patel
---

### 🔹 1. What is Mongoose?

**Mongoose** is an **ODM (Object Data Modeling)** library for MongoDB and Node.js.

👉 It helps you:

- Define **schemas**
- Enforce **structure**
- Add **validation**
- Work with MongoDB using **JS objects instead of raw queries**

📌 Without Mongoose → raw MongoDB driver

📌 With Mongoose → structured + cleaner + safer

---

### 🔹 2. Install & Setup

```
npm install mongoose
```

#### Connect to DB

```
const mongoose=require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/mydb")
.then(() =>console.log("DB Connected"))
.catch(err =>console.log(err));
```

---

### 🔹 3. Schema (Core Concept)

A **Schema** defines the structure of documents.

```
const userSchema=new mongoose.Schema({
  name:String,
  age:Number,
  email:String
});
```

#### With Validation

```
const userSchema=new mongoose.Schema({
  name: {
    type:String,
    required:true,
    minlength:3
  },
  age: {
    type:Number,
    min:18
  },
  email: {
    type:String,
    unique:true
  }
});
```

---

### 🔹 4. Model

Model = **Wrapper around schema**

```
const User=mongoose.model("User",userSchema);
```

👉 This creates a collection: `users`

---

### 🔹 5. CRUD Operations

#### ➤ Create

```js
const user = new User({
  name:"Vikas",
  age:22
});

await user.save();
```

OR

```
await User.create({ name:"Harsh", age:22 });
```

---

#### ➤ Read

```
const users=await User.find();
```

```js
//students.ejs

<!DOCTYPE html>
<html>
<head>
    <title>Students Data</title>
</head>
<body>

    <h1>Students List</h1>

    <% students.forEach((student) => { %>
        <div>
            <h3><%= student.name %></h3>
            <p>Age: <%= student.age %></p>
        </div>
        <hr>
    <% }) %>

</body>
</html>
```

#### With condition

```
await User.find({ age: { $gt:20 } });
```

#### Find one

```
await User.findOne({ name:"Vikas" });
```

#### Find by ID

```
await User.findById(id);
```

---

#### ➤ Update

```js
// Update one document
await Student.updateOne(
    { name: "Vikas" },
    { age: 26 }
);

// Delete one document
await Student.deleteOne(
    { name: "Vikas" }
);

// Delete many documents
await Student.deleteMany(
    { age: { $lt: 18 } }
);
```

```js
app.put("/student/:id", async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // updated data return karega
        );

        res.send(updatedStudent);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete("/student/:id", async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);

        res.send(deletedStudent);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
```

```js
app.delete("/student/age/:age", async (req, res) => {
    try {
        const deletedStudent = await Student.findOneAndDelete({
            age: req.params.age
        });

        res.send(deletedStudent);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete("/student/age/:age", async (req, res) => {
    try {
        const result = await Student.deleteMany({
            age: req.params.age
        });

        res.send(result);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put("/student/update", async (req, res) => {
    try {
        const updatedStudent = await Student.findOneAndUpdate(
            { age: req.query.age },     // condition
            { name: req.query.name },   // update
            { new: true }               // updated document return kare
        );

        res.send(updatedStudent);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
```

```
await User.updateOne({ name:"Vikas" }, { age:25 });
```

```
await User.findByIdAndUpdate(id, { age:30 }, { new:true });
```

---

#### ➤ Delete

```
await User.deleteOne({ name:"Harsh" });
```

```
await User.findByIdAndDelete(id);
```

---

### 🔹 6. Schema Types

| Type | Example |
| --- | --- |
| String | name |
| Number | age |
| Boolean | isActive |
| Date | createdAt |
| Array | tags |
| ObjectId | references |
| Mixed | anything |

```
tags: [String]
```

---

### 🔹 7. Default Values

```
createdAt: {
type:Date,
default:Date.now
}
```

---

### 🔹 8. Enums

```
role: {
type:String,
enum: ["user","admin"]
}
```

---

### 🔹 9. Schema Methods

#### Instance Methods

```
userSchema.methods.sayHi=function() {
return"Hi "+this.name;
};
```

#### Static Methods

```
userSchema.statics.findAdults=function() {
return this.find({ age: { $gte:18 } });
};
```

---

### 🔹 10. Middleware (Hooks)

Run logic before/after events

#### Pre-save

```
userSchema.pre("save",function(next) {
console.log("Before save");
next();
});
```

#### Post-save

```
userSchema.post("save",function(doc) {
console.log("Saved:",doc);
});
```

---

### 🔹 11. Virtuals

Not stored in DB

```
userSchema.virtual("fullInfo").get(function() {
return`${this.name} -${this.age}`;
});
```

---

### 🔹 12. Population (Important 🔥)

Used for **relations**

```
const postSchema=new mongoose.Schema({
  title:String,
  author: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  }
});
```

#### Populate

```
await Post.find().populate("author");
```

---

### 🔹 13. Indexes

Improve query performance

```
userSchema.index({ email:1 });
```

---

### 🔹 14. Timestamps

```
const schema=new mongoose.Schema({}, { timestamps:true });
```

👉 Adds:

- `createdAt`
- `updatedAt`

---

### 🔹 15. Lean Queries ⚡

Faster (no mongoose document)

```
await User.find().lean();
```

---

### 🔹 16. Validation

#### Built-in

- required
- min/max
- enum
- match

#### Custom

```
email: {
type:String,
validate: {
validator:v =>v.includes("@"),
message:"Invalid email"
  }
}
```

---

### 🔹 17. Subdocuments

```
const postSchema=new mongoose.Schema({
  title:String,
  comments: [
    {
      text:String,
      user:String
    }
  ]
});
```

---

### 🔹 18. Transactions

```
const session=await mongoose.startSession();
session.startTransaction();

try {
await User.create([{ name:"A" }], { session });
await session.commitTransaction();
}catch (e) {
await session.abortTransaction();
}
session.endSession();
```

---

### 🔹 19. Aggregation

```
await User.aggregate([
  { $match: { age: { $gte:18 } } },
  { $group: { _id:"$age", count: { $sum:1 } } }
]);
```

---

### 🔹 20. Best Practices ✅

- Always use **async/await**
- Use **lean() for read-heavy APIs**
- Use **indexes for frequent queries**
- Keep schemas **small & modular**
- Use **environment variables for DB URL**
- Avoid storing **large arrays inside documents**

---

### 🔹 21. Common Mistakes ❌

❌ Not handling async errors

❌ Forgetting `await`

❌ Using `find()` instead of `findOne()`

❌ Not validating data

❌ Overusing populate (can slow queries)

---

### 🔹 22. Mongoose vs MongoDB Driver

| Feature | Mongoose | Native Driver |
| --- | --- | --- |
| Schema | ✅ | ❌ |
| Validation | ✅ | ❌ |
| Easy to use | ✅ | ⚠️ |
| Performance | Slightly slower | Faster |

---

### 🔹 23. Real-world Flow

1. Define schema
1. Create model
1. Use model in controllers
1. Perform CRUD
1. Add validation & middleware

---

### 🔹 24. Folder Structure (Recommended)

```
/models
  user.js
  post.js

/controllers
  userController.js

/routes
  userRoutes.js

/app.js
```
