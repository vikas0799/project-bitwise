---
title: MongoDB Basics
description: Documents and collections, mongosh commands, CRUD, operators, drivers and ODMs.
author: Vikas Patel
---

### 1. Introduction to Tech Stacks

Before introducing MongoDB, explain where it fits in modern web development stacks.

#### Common Stacks

- **MERN** = MongoDB + Express + React + Node.js
- **MEAN** = MongoDB + Express + Angular + Node.js
- **MEVN** = MongoDB + Express + Vue + Node.js

#### Key Idea

MongoDB is the **database layer** in these stacks.

#### Why MongoDB feels like JavaScript

- Data is stored in **JSON-like format(BSON)**
- Developers working with JavaScript (Node.js) find it very natural

---

### 2. Why Use MongoDB?

#### Problems with Traditional (SQL) Databases

- Fixed schema (rigid structure)
- Hard to scale horizontally
- Complex joins

#### Advantages of MongoDB

- Schema-less (flexible structure)
- Stores data as JSON-like documents
- Easy to scale (horizontal scaling)
- Fast for read/write operations
- Works naturally with JavaScript

## **Installing MongoDB**

Installing MongoDB can be easily done by visiting the official website. The
community edition is free and suitable for most use cases.

1. mongoDB Compass (GUI)
1. mongoshell (CLI)
1. mongodb extension in  vs_code  (usefull for application testing ODM)
1. mongodb atlas ( cloud services)

## Best Way (Mac) → Using Homebrew

### 1. Install Homebrew (if not installed)

```
/bin/bash-c"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

### 2. Install MongoDB Community Server

You’ll install:

- MongoDB Community Server
- MongoDB Shell (mongosh)

Run:

this will ask you to enter multiple times for your password → enter it

```
brew tap mongodb/brew
brew install mongodb-community
```

---

### 3. Start MongoDB

```
brew services start mongodb/brew/mongodb-community
brew services list
```

This runs MongoDB in background automatically

---

### 4. Open Mongo Shell

```
mongosh
```

---

### 5. Test it

```
show dbs
```

If it shows databases → you’re done 

---

## Important Understanding

| Command | Meaning |
| --- | --- |
| `mongod` | Starts database server |
| `mongosh` | Opens shell |
| `brew services` | Runs MongoDB in background |

## Flow of Commands(instruction)

mongosh/mongocompass/odm
↓
MongoDB Client
↓
mongod
↓
Database Files

---

### 3. Mongo Shell (mongosh)(refer to documention)

MongoDB provides an interactive shell to interact with the database.

#### Start Mongo Shell

```
mongosh
```

---

### 4. Basic Database Commands

#### Show all databases

```
show dbs
```

#### Show current database

```
db
```

#### Create / Switch database

```
use myDatabase
```

#### Delete database

```
db.dropDatabase()
```

---

### 5. Collections and Documents

#### Collection

- Equivalent to a table in SQL
- Stores multiple documents

#### Document

- Equivalent to a row in SQL
- Stored as JSON-like object

Example:

```
{
name:"Vikas",
age:21,
skills: ["Java","Node.js"]
}
```

---

### 6. JSON vs BSON(refer offical document)

#### JSON

- Text-based format
- Used in JavaScript

#### BSON (Binary JSON)

- Binary format used internally by MongoDB
- Supports additional data types like:
  - Date
  - ObjectId
  - Binary data

---

### 7. CRUD Operations in Mongo Shell

#### Create Operations

#### Insert One Document

```
db.students.insertOne({
  name:"Vikas",
  age:21,
  course:"B.Tech"
})
```

#### Insert Multiple Documents

```
db.students.insertMany([
  { name:"Aman", age:22 },
  { name:"Riya", age:20 }
])
```

---

#### Read Operations

#### Show Collections

```
show collections
```

#### Find All Documents

```
db.students.find()
```

#### Find with Condition

```
db.students.find({ age:21 })
```

---

#### Update Operations

#### Update One Document

```
db.students.updateOne(
  { name:"Vikas" },
  { $set: { age:22 } }
)
```

#### Update Many Documents

```
db.students.updateMany(
  { age: { $gt:21 } },
  { $set: { status:"senior" } }
)
```

---

#### Delete Operations

#### Delete One Document

```
db.students.deleteOne({ name:"Aman" })
```

#### Delete Many Documents

```
db.students.deleteMany({ age: { $gt:21 } })
```

---

### 8. MongoDB Operators (Important Concept)

#### Comparison Operators

- `$gt` → greater than
- `$lt` → less than
- `$gte` → greater than equal
- `$lte` → less than equal
- `$eq` → equal
- `$ne` → not equal

Example:

```
db.students.find({ age: { $gt:20 } })
```

---

#### Logical Operators

- `$and`
- `$or`
- `$not`

Example:

```
db.students.find({
  $or: [
    { age:20 },
    { name:"Harsh" }
  ]
})
```

---

#### Update Operators

- `$set`
- `$inc`
- `$push`

Example:

```
db.students.updateOne(
  { name:"Vikas" },
  { $inc: { age:1 } }
)
```

---

### 9. Drivers and ODM

#### MongoDB Driver

- Allows application (Node.js, Python, etc.) to communicate with MongoDB
- Low-level control

Example:

Node.js MongoDB Driver

---

#### ODM (Object Data Modeling)

ODM sits between application and database.

#### Why use ODM?

- Schema validation
- Cleaner code
- Easier data handling

---

### 10. Mongoose

Mongoose is an ODM for MongoDB in Node.js.

#### Features

- Schema definition
- Validation
- Middleware support
- Easy querying

Example:

```
const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
  name:String,
  age:Number
});

const User=mongoose.model("User",userSchema);
```

---

### 11. Client-Server Architecture with MongoDB

#### Flow

Client (Frontend)

↓

Server (Node.js + Express)

↓

ODM (Mongoose)

↓

MongoDB Database

#### Explanation

- Client sends request (browser / app)
- Server handles logic
- Mongoose interacts with MongoDB
- Database returns data
- Server sends response back to client

refere:- [https://www.mongodb.com/](https://www.mongodb.com/)
