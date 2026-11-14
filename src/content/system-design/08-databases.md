---
title: Databases
description: Why backends store data on disk, what a DBMS gives you over text files, SQL vs NoSQL, why Postgres is a great default, data types, migrations, modelling relationships, constraints, joins, parameterized queries, indexes, triggers, transactions and ACID, N+1 queries, connection pooling, EXPLAIN and soft deletes.
author: Bitwise School
---

A **database** exists to **persist** information: to keep it after the program that created it stops. Close a to-do app, open it tomorrow, and your list is still there. That continuity across restarts, crashes and machines is the whole point.

In a broad sense, lots of things are databases. Your phone's contacts. The browser's `localStorage` and cookies (look in DevTools → Application). Even a text file of notes. They all let you **create, read, update and delete** data: **CRUD**. But when backend engineers say "database", they usually mean something specific: a **disk-based** system like Postgres, MySQL or MongoDB.

All the SQL in this chapter was run against PostgreSQL. The [DBMS and SQL note](/notes/dbms-sql) and the [PostgreSQL with Node.js note](/notes/postgresql-nodejs) are good companions.

## Why disk, not RAM?

Your CPU can use two kinds of storage:

| | RAM (primary memory) | Disk: SSD or HDD (secondary memory) |
| --- | --- | --- |
| Speed | extremely fast | much slower |
| Cost | expensive | cheap |
| Typical size | 8 to 128 GB | 512 GB to many TB |
| Survives a restart? | no | yes |

So the split is: **caches live in RAM** (small and fast, [Chapter 09](/system-design/09-caching/)), **databases live on disk** (large and durable). Indexes, covered below, are how databases win back speed on slow disks.

## What a DBMS gives you over text files

Storing bytes on disk isn't enough. You need to find, change and delete records quickly across hundreds of gigabytes, safely. That's the job of a **DBMS (database management system)**:

| Job | Meaning |
| --- | --- |
| **Organisation** | lay data out so reads and writes are fast |
| **Access** | a query language for CRUD |
| **Integrity** | keep data valid: a price column only ever holds numbers |
| **Security** | users, roles and permissions |
| **Concurrency** | many clients reading and writing at once without corrupting anything |

Before DBMSs, people kept records in text files. That breaks down quickly:

1. **Parsing is slow and fragile.** Finding one customer means reading the whole file, splitting lines and comparing fields. One bug and you corrupt data.
2. **There's no structure.** Nothing stops a line from having a word where a number should be.
3. **No concurrency control**, and this is the killer. A counter holds 40. Two requests read it at the same moment; one adds 10 and writes 50, the other adds 20 and writes 60. The right answer is 70, but one update simply vanished. This is the **lost update** problem, and we'll see how databases solve it in the transactions section.

## Relational vs non-relational

| | Relational (SQL) | Non-relational (NoSQL), e.g. MongoDB |
| --- | --- | --- |
| Shape | **tables** of rows and columns, linked by **foreign keys** | **collections** of **documents** (JSON-like) |
| Schema | strict and declared up front | flexible: documents in one collection can differ |
| Strength | **integrity** and powerful queries across tables | speed of change; good when the shape is unknown or varies |
| Cost | changing structure needs a migration | correctness has to be enforced in application code |
| Examples | PostgreSQL, MySQL, SQL Server | MongoDB, DynamoDB, Firestore |

Two examples to build intuition:

- A **CRM** (contacts, deals, companies, who owns what) is highly structured and relational, with critical data. Use a relational database.
- A **CMS** where one article might hold text, images, code blocks and video embeds in any order has content that's hard to fit into fixed columns. A document store fits naturally, or a JSON column in Postgres.

The [MongoDB note](/notes/mongodb) covers the document model in detail.

## Why Postgres is a great default

1. **Free and open source.** Self-host it anywhere or use any managed provider.
2. **Follows the SQL standard closely**, so your SQL skills transfer to other databases.
3. **Extensible and feature-rich**: full-text search, geospatial data (PostGIS), vectors for AI (pgvector) and much more.
4. **Reliable and proven** at very large scale.
5. **Excellent JSON support.** The `jsonb` type lets you store and index schemaless data inside a relational database. That removes the most common reason teams reach for MongoDB.

You'll read benchmarks claiming MySQL is faster at something. Until you have millions of users and a specific bottleneck, it won't matter. Postgres is a strong first choice, and it's what this chapter uses.

**SQL** is the language you write queries in. **Postgres** is the software that runs them.

## Data types that matter

| Type | Use it for |
| --- | --- |
| `uuid` | ids, especially in distributed systems; `gen_random_uuid()` generates them (built in since Postgres 13) |
| `bigint` / `bigserial` | integer ids that auto-increment; prefer the 64-bit versions in production |
| `integer`, `smallint` | counts, positions, small numbers |
| `numeric(10, 2)` | **money**: exact, 10 digits in total, 2 after the decimal point |
| `real`, `double precision` | measurements where tiny rounding differences don't matter |
| `text` | strings of any length: **the default for text in Postgres** |
| `varchar(n)` | only if a hard maximum length is truly part of the data |
| `boolean` | true / false |
| `timestamptz` | points in time, stored with time-zone awareness: use for `created_at`, `updated_at` |
| `date`, `interval` | calendar dates; durations like "7 days" |
| `jsonb` | flexible JSON, stored in a binary format you can index and query |
| `text[]`, `integer[]` | arrays |
| enums | a fixed set of allowed values (more below) |

### Money: numeric, never float

Floating-point numbers are stored in binary, so many decimals can't be represented exactly. In JavaScript, `0.1 + 0.2` gives `0.30000000000000004`. For prices, totals and balances that's unacceptable, so use `numeric(10, 2)`: `numeric(10, 2)` holds up to `99999999.99`. A value needing more digits is rejected. Exactness costs a little speed, so floats are still right for science and measurements. (Many teams also store money as an integer number of paise.)

### text vs varchar(n) vs char(n)

- `char(10)` **pads with spaces**: store `"ab"` and it saves `"ab"` followed by 8 spaces. Almost never what you want.
- `varchar(255)` stores what you give it, up to 255 characters, then errors.
- `text` is the same as `varchar` without a limit.

In Postgres there is **no performance difference** between `text` and `varchar(n)`, and both can be indexed. (The famous `255` is a habit carried over from MySQL.) Prefer `text`, and enforce lengths in your validation layer ([Chapter 05](/system-design/05-validations-and-transformations/)). Changing a `varchar` limit later needs a migration, and a reader wastes time wondering why it's 255.

### json vs jsonb

`json` stores the raw text. `jsonb` stores a parsed binary form that can be indexed and queried quickly. Use **`jsonb`**.

## Migrations: version control for your schema

In production you don't open a database GUI and run `CREATE TABLE` by hand. There'd be no record of who changed what, and no way to reproduce the database on a new machine. Instead you use **migrations**: numbered SQL files, kept in git next to your code, applied in order by a tool such as **dbmate**, **node-pg-migrate**, **Prisma Migrate**, **Knex** or **Drizzle**.

Each migration has an **up** part (the change) and a **down** part (how to undo it). The tool records which migrations have run in a `schema_migrations` table, so it never applies one twice.

```text
db/migrations/
  20261101093000_create_users.sql
  20261101094500_create_courses.sql
  20261105120000_add_seats_left_to_courses.sql
```

```sql
-- migrate:up
CREATE TABLE courses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE courses;
```

```bash
dbmate new add_level_to_courses
```

```bash
dbmate up
```

```bash
dbmate rollback
```

**Seeding** is loading sample data (test users, a few courses) so you can develop locally. Keep seed files separate from schema migrations so they never run in production by accident.

## Modelling relationships

We'll model a course platform like the one in [Chapter 07](/system-design/07-api-design-rest/). The nouns from the product become tables: `users`, `user_profiles`, `courses`, `lessons` and `enrollments`.

Two naming conventions save a lot of pain: **plural table names** (`users`, `courses`) and **snake_case columns** (`full_name`, `created_at`). Postgres folds unquoted names to lowercase, so `fullName` silently becomes `fullname` unless you quote it everywhere.

![One-to-one users and profiles, one-to-many courses and lessons, and many-to-many users and courses through an enrollments linking table](/images/system-design/db-relationships.svg "The three shapes cover almost every data model you'll build.")

- **One-to-one: users ↔ user_profiles.** Profiles keep growing (bio, phone, avatar, links), so putting them in their own table keeps the core `users` table small and stable. Since each user has exactly one profile, `user_id` serves as both the profile's **primary key** and its **foreign key**.
- **One-to-many: courses → lessons.** Each lesson belongs to one course, so `lessons` gets a `course_id` foreign key. Many lessons can share the same `course_id`.
- **Many-to-many: users ↔ courses.** A student takes many courses, and a course has many students. One foreign key can't express that, so a **linking table** (`enrollments`) holds both foreign keys, and the pair is its **composite primary key**. The link can carry its own data too, like `progress`.

```sql
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-to-one: the profile's primary key is also its foreign key
CREATE TABLE user_profiles (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio        TEXT,
  phone      TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE courses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  co_instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  level            course_level NOT NULL DEFAULT 'beginner',
  status           course_status NOT NULL DEFAULT 'draft',
  price            NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  seats_left       INTEGER NOT NULL DEFAULT 100 CHECK (seats_left >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-to-many: many lessons point at one course
CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  position         INTEGER NOT NULL CHECK (position > 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 300),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, position)
);

-- Many-to-many: a linking table with a composite primary key
CREATE TABLE enrollments (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress    SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
```

## Constraints: let the database guard your data

Validation in your API is one line of defence. **Constraints** are the guarantee: the database refuses bad data no matter which code path, script or person tries to write it. Every error below is real output from running this schema:

| Constraint | Example | What happens on bad data |
| --- | --- | --- |
| **Primary key** | `id UUID PRIMARY KEY` | implies `NOT NULL` + `UNIQUE` |
| **NOT NULL** | `title TEXT NOT NULL` | `null value in column "title" violates not-null constraint` |
| **UNIQUE** | `email TEXT NOT NULL UNIQUE` | `duplicate key value violates unique constraint "users_email_key"` |
| **Foreign key** | `REFERENCES users(id)` | `violates foreign key constraint "courses_instructor_id_fkey"` |
| **CHECK** | `CHECK (price >= 0)` | `violates check constraint "courses_price_check"` |
| **Enum** | `level course_level` | `invalid input value for enum course_level: "expert"` |

- **Make most columns `NOT NULL`.** Postgres allows nulls by default, and nulls creep in through buggy scripts and forgotten fields. Leave a column nullable only if it's genuinely optional (a bio, a phone number).
- **Enums** do double duty: they protect data, and they **document** the allowed values right in the schema, so nobody has to search the codebase to learn which statuses exist.

### What happens on delete?

Each foreign key declares what to do when the row it points to is deleted:

| Rule | Effect | Used here for |
| --- | --- | --- |
| `ON DELETE RESTRICT` | refuse the delete while children exist | can't delete an instructor who still owns courses |
| `ON DELETE CASCADE` | delete the children too | deleting a course deletes its lessons and enrollments |
| `ON DELETE SET NULL` | clear the reference (column must be nullable) | deleting a co-instructor just clears `co_instructor_id` |
| `ON DELETE SET DEFAULT` | set the reference to its default | rarely used |

## Querying

### Write queries starting from FROM

A useful habit: write the **`FROM`** clause first, then the joins, *then* choose the columns. Decide where the data comes from before deciding what to pick from it.

```sql
SELECT u.id, u.email, u.full_name, to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY u.created_at DESC;
```

- **Aliases** (`u`, `up`) keep long queries readable.
- **`LEFT JOIN`**, not `INNER JOIN`: a user without a profile row must still appear. An inner join only returns rows that match on both sides, so profile-less users would silently disappear. With a left join they appear with `"profile": null`.
- **`to_jsonb(up.*)`** turns the joined profile into a nested JSON object, so the frontend gets `user.profile` in one round trip.
- **Never `SELECT *` from `users` in an API**: you'd send `password_hash` to the client.
- **Always `ORDER BY`** in list queries. Without it, row order isn't guaranteed and can change between calls.

### Parameterized queries: never build SQL from strings

This is the most important security habit with databases. If you glue user input into SQL text, an attacker can send input that *is* SQL:

```js
// NEVER do this. A search of  ' OR 1=1; DROP TABLE users; --  becomes part of the command
const rows = await pool.query(`SELECT * FROM courses WHERE title = '${req.query.title}'`);

// Always do this. $1 is sent separately and treated purely as data
const { rows } = await pool.query("SELECT id, title FROM courses WHERE title = $1", [req.query.title]);
```

Parameters can only stand in for **values**. Column names and sort directions can't be parameters, so take them from an **allow-list** (as in the next example), never from the request.

### Insert, update, and a filtered, sorted, paginated list

```sql
INSERT INTO courses (instructor_id, title, slug, level, price)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- PATCH-style update: only change fields that were provided (null = keep the old value)
UPDATE courses
SET title = COALESCE($2, title),
    price = COALESCE($3, price)
WHERE id = $1
RETURNING *;
```

(The `COALESCE` trick can't set a column *to* null on purpose. If you need that, build the `SET` list dynamically from the fields the client actually sent.)

```js
import { pool } from "./db.js";

const SORT_COLUMNS = { title: "c.title", price: "c.price", createdAt: "c.created_at" };

export async function listCourses({ search, level, sortBy = "createdAt", sortOrder = "desc", page = 1, limit = 10 }) {
  const where = ["c.status = 'published'"];
  const values = [];
  if (search) {
    values.push(`%${search}%`);
    where.push(`c.title ILIKE $${values.length}`);   // ILIKE = case-insensitive match
  }
  if (level) {
    values.push(level);
    where.push(`c.level = $${values.length}`);
  }
  const whereSql = where.join(" AND ");
  const orderSql = `${SORT_COLUMNS[sortBy] ?? "c.created_at"} ${sortOrder === "asc" ? "ASC" : "DESC"}, c.id`;

  const [list, count] = await Promise.all([
    pool.query(
      `SELECT c.id, c.title, c.slug, c.level, c.price
       FROM courses c
       WHERE ${whereSql}
       ORDER BY ${orderSql}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, (page - 1) * limit]   // page 1 → OFFSET 0
    ),
    pool.query(`SELECT count(*)::int AS total FROM courses c WHERE ${whereSql}`, values),
  ]);

  return { data: list.rows, total: count.rows[0].total, page, limit };
}
```

Every value goes in as a parameter. The sort column comes from `SORT_COLUMNS`, so a client can't inject SQL through `sortBy`. Adding `c.id` as a tie-breaker keeps the order stable when two rows have the same sort value.

## Indexes: the biggest performance lever

Think of the index at the back of a textbook. To find "B-trees", you don't read every page; you look it up and jump to page 212.

Without an index, finding rows means a **sequential scan**: the database reads row after row until it has checked them all. Fine for 50 rows, painful for 50 million.

An **index** is a separate, sorted structure (usually a **B-tree**) that maps column values to where their rows live. The database walks down the tree in a few steps and jumps straight to the matching rows. An index can also be stored in **descending order**, so `ORDER BY created_at DESC` comes back already sorted.

![A sequential scan checking every row compared with a B-tree index lookup that jumps to the matching row](/images/system-design/index-vs-scan.svg "An index trades a little extra work on every write for much faster reads.")

### What to index

Index columns that appear in **`WHERE`**, **`JOIN ... ON`** and **`ORDER BY`** of frequent queries. A few details people miss:

- **Primary keys and `UNIQUE` columns are indexed automatically.** `users.email` is `UNIQUE`, so it already has an index (`users_email_key`). Don't add a second one.
- **Foreign keys are *not* indexed automatically.** Columns you join or filter on, like `courses.instructor_id` and `enrollments.course_id`, usually need one.
- **Composite indexes work left to right.** `UNIQUE (course_id, position)` on `lessons` creates an index that also serves `WHERE course_id = $1`, so `lessons.course_id` needs no separate index. Likewise the `enrollments` primary key `(user_id, course_id)` covers lookups by `user_id`, but not by `course_id` alone.

```sql
CREATE INDEX idx_courses_instructor ON courses (instructor_id);
CREATE INDEX idx_courses_status ON courses (status);
CREATE INDEX idx_courses_created_at ON courses (created_at DESC);
CREATE INDEX idx_enrollments_course ON enrollments (course_id);
```

**Indexes aren't free.** Every `INSERT`, `UPDATE` and `DELETE` must also update every index on the table, and indexes take space. Index the hot `WHERE`/`JOIN`/`ORDER BY` columns, measure, and drop indexes nothing uses.

### Check that your index is used: EXPLAIN

Creating an index doesn't guarantee the query planner uses it. `EXPLAIN` shows the plan; `EXPLAIN ANALYZE` runs the query and shows real timings. These are real plans from the schema above with 50,000 courses:

```text
EXPLAIN SELECT * FROM courses WHERE title = 'Course 9';
Seq Scan on courses  (cost=0.00..1435.03 rows=1 width=111)        ← no index on title: reads every row
  Filter: (title = 'Course 9'::text)

EXPLAIN SELECT * FROM courses WHERE status = 'archived';
Bitmap Heap Scan on courses  (cost=184.02..1241.47 ...)
  ->  Bitmap Index Scan on idx_courses_status                      ← the status index is used
        Index Cond: (status = 'archived'::course_status)
```

Look for **Index Scan**, **Index Only Scan** or **Bitmap Index Scan** (an index is used) versus **Seq Scan** (every row is read). On a tiny table, the planner may rightly choose a sequential scan anyway: reading 10 rows directly is faster than using an index. Index benefits show up at scale, so test with realistic data.

## Triggers: automate the boring parts

Every table has an `updated_at` column that should change whenever the row changes. You could remember to set it in every `UPDATE`... or let the database do it. A **trigger** runs a function automatically when something happens to a table:

```sql
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER lessons_set_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Now every update, whether from your API, a script or someone at a SQL prompt, refreshes `updated_at` automatically. Use triggers for small, mechanical jobs like this. Keep real business logic in your application, where it's visible and testable.

## Transactions and ACID

Remember the lost update from the text-file section? Real databases solve it with **transactions**: a group of operations that **all succeed together or all fail together**.

The classic example: move ₹500 from wallet A to wallet B. That's two writes: subtract from A, add to B. If the server crashes in between, ₹500 vanishes. Wrap both in a transaction (`BEGIN ... COMMIT`), and on any error `ROLLBACK` undoes everything, as if nothing happened.

| Property | Guarantee | In the wallet example |
| --- | --- | --- |
| **Atomicity** | all or nothing | A is never debited without B being credited |
| **Consistency** | every transaction leaves the data valid; constraints always hold | balances never go negative if a `CHECK` forbids it |
| **Isolation** | concurrent transactions don't see each other's half-finished work | two transfers at once can't corrupt a balance |
| **Durability** | once committed, it survives crashes and power cuts | after `COMMIT`, the transfer is permanent |

### Read-then-write: the bug hiding in your backend

A live batch has limited seats. The naive code reads `seats_left` into JavaScript, checks it, then writes `seats_left - 1`. Two students clicking "Enroll" at the same moment both read 1, both pass the check, and the batch is oversold. That's the text-file race again, just moved into your API. Two safe patterns:

**1. Do it in one atomic statement.** The database reads and writes in one step, so there's no gap for another request:

```sql
UPDATE courses
SET seats_left = seats_left - 1
WHERE id = $1 AND seats_left > 0
RETURNING seats_left;   -- no row returned = the batch is full
```

**2. Lock the row inside a transaction** with `SELECT ... FOR UPDATE`. Other transactions that try to lock the same row wait until you commit:

```js
export async function enroll(userId, courseId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT seats_left FROM courses WHERE id = $1 FOR UPDATE", [courseId]);
    if (!rows[0]) throw new NotFoundError("Course not found");
    if (rows[0].seats_left < 1) throw new ConflictError("This batch is full");

    await client.query("UPDATE courses SET seats_left = seats_left - 1 WHERE id = $1", [courseId]);
    await client.query("INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)", [userId, courseId]);
    await client.query("COMMIT");   // both writes become visible together
  } catch (err) {
    await client.query("ROLLBACK");  // or neither does
    throw err;
  } finally {
    client.release();                // always give the connection back to the pool
  }
}
```

Underneath, Postgres uses **MVCC** (multi-version concurrency control) and locks, so readers see a consistent snapshot while writers take turns. Use a transaction whenever one logical action spans several writes: an order plus a stock update, a transfer, an enrollment plus a seat count.

## Production essentials

### The N+1 query problem

You load 20 courses, then loop over them and run one query per course to get its lessons. That's **1 + 20 queries** where one would do. Every round trip costs network time and planning, and ORMs make this easy to do by accident through lazy loading inside loops.

```js
// N+1: 1 query for the courses, then 1 more per course
const { rows: courses } = await pool.query("SELECT id, title FROM courses ORDER BY created_at DESC LIMIT 20");
for (const course of courses) {
  course.lessons = (await pool.query("SELECT title FROM lessons WHERE course_id = $1", [course.id])).rows;
}
```

The fix is to fetch related data in **one query**: a join with aggregation, a batched `WHERE course_id = ANY($1)`, or your ORM's eager loading (`include`, `populate`, `preload`):

```sql
SELECT c.id, c.title,
       COALESCE(
         json_agg(json_build_object('title', l.title, 'position', l.position) ORDER BY l.position)
           FILTER (WHERE l.id IS NOT NULL),
         '[]'
       ) AS lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT 20;
```

Each course comes back with a `lessons` array, ordered by position, and an empty array for courses with no lessons yet.

### Connection pooling

Opening a Postgres connection is expensive: Postgres starts a separate process for each one, and the default limit is about **100 connections**. If every request opened its own connection, you'd hit the limit fast and pay the setup cost every time. A **pool** keeps a few long-lived connections that requests borrow and return:

```js
// db.js: one pool for the whole app, created once
import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                        // at most 10 connections from this process
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000, // fail fast instead of waiting forever for a free connection
});
```

`pool.query()` borrows and returns a connection automatically. For transactions use `pool.connect()` and always `release()` in a `finally`, as in the enroll example. When you run many app instances (say 20 servers × 10 connections), put an external pooler like **PgBouncer** in front of Postgres. Bigger pools aren't better: past a point, more connections make Postgres slower.

### Soft deletes

Sometimes "delete" shouldn't really delete: you want the row for audits, undo or history, but hidden from normal use. A **soft delete** adds a nullable `deleted_at` column:

```sql
ALTER TABLE courses ADD COLUMN deleted_at TIMESTAMPTZ;

-- "Delete" becomes an update
UPDATE courses SET deleted_at = now() WHERE id = $1;

-- Every normal read must filter deleted rows out
SELECT id, title FROM courses WHERE deleted_at IS NULL;

-- Gotcha: a plain UNIQUE(slug) would block reusing a deleted course's slug.
-- Make it unique among live rows only, with a partial unique index.
ALTER TABLE courses DROP CONSTRAINT courses_slug_key;
CREATE UNIQUE INDEX courses_slug_live ON courses (slug) WHERE deleted_at IS NULL;
```

The trade-offs are real: forget the `WHERE deleted_at IS NULL` once and deleted data leaks, unique constraints need partial indexes, and tables keep growing. Use soft deletes where history matters (orders, accounts, anything auditable) and hard deletes for disposable data.

## Quick revision

| Topic | One line |
| --- | --- |
| Database | persistent storage with CRUD; in backends, on disk |
| DBMS | organisation, access, integrity, security and concurrency |
| SQL vs NoSQL | strict schema and integrity vs flexible documents |
| Postgres | great default: standard SQL, reliable, `jsonb` |
| Types | `uuid`, `numeric` for money, `text` over `varchar`, `timestamptz`, `jsonb` |
| Migrations | versioned up/down schema changes in git |
| Relationships | 1:1 (shared PK), 1:many (FK), many:many (linking table) |
| Constraints | NOT NULL, UNIQUE, FK, CHECK, enums, ON DELETE rules |
| Joins | LEFT JOIN keeps rows without a match; always ORDER BY |
| Security | parameterized queries, allow-lists for column names |
| Indexes | for WHERE / JOIN / ORDER BY; FKs aren't auto-indexed; verify with EXPLAIN |
| Transactions | ACID; atomic updates or `FOR UPDATE` for read-then-write |
| Production | avoid N+1, pool connections, soft delete when history matters |

## Interview questions

1. Why do databases store data on disk instead of RAM?
2. What problems does a DBMS solve that a text file can't? Explain the lost update.
3. SQL vs NoSQL: how would you choose for a CRM and for a CMS?
4. Why use `numeric` for money? Why prefer `text` over `varchar(255)` in Postgres?
5. What are migrations, and why does each one need a down step?
6. How do you model one-to-one, one-to-many and many-to-many relationships?
7. What does `ON DELETE CASCADE` do? When would you use `RESTRICT` or `SET NULL`?
8. LEFT JOIN vs INNER JOIN: when do they give different results?
9. What is SQL injection and how do parameterized queries prevent it?
10. How does an index speed up a query? Which columns should you index? What's the cost?
11. Explain ACID with an example. How do you prevent two requests from overselling the last seat?
12. What is the N+1 query problem and how do you fix it?
13. Why use a connection pool? What does PgBouncer add?
14. What is a soft delete and what are its pitfalls?

## Further reading

- [PostgreSQL documentation: data types](https://www.postgresql.org/docs/current/datatype.html)
- [PostgreSQL: indexes](https://www.postgresql.org/docs/current/indexes.html) and [using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL: transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [node-postgres (pg) documentation](https://node-postgres.com/)
- [Use The Index, Luke](https://use-the-index-luke.com/): a free book on SQL indexing

Next: [Chapter 09, Caching](/system-design/09-caching/).
