---
title: "PostgreSQL with Node.js: Tables, Joins, Queries and Transactions"
description: Why PostgreSQL, setting it up, psql, data types and constraints, primary and foreign keys with a join diagram, INNER and LEFT JOIN, GROUP BY, indexes, JSONB, using pg from Node with a pool, parameterised queries and SQL injection, transactions, migrations, and Prisma or Drizzle.
author: Vikas Patel
---

**PostgreSQL** ("Postgres") is a free, open-source **relational database**, and in the last few years it has become the default choice for new applications. Data lives in **tables** with a fixed set of **columns**, tables are linked by **keys**, and SQL lets you ask almost any question of that data. It's reliable (full ACID transactions), fast, and flexible (it even stores JSON well). The current major version is **PostgreSQL 18**.

For database theory (normalisation, ACID, isolation levels), see [DBMS and SQL](/notes/dbms-sql). This note is the practical side: Postgres from a Node.js app.

## Why PostgreSQL?

- **Relationships and integrity:** foreign keys, constraints and transactions keep data correct: no order for a user who doesn't exist, no payment half-saved.
- **Powerful SQL:** joins, aggregates, window functions, full-text search.
- **JSONB:** store and index flexible JSON when you need it, next to regular columns.
- **Ecosystem:** managed hosting everywhere (Neon, Supabase, AWS RDS, Google Cloud SQL), extensions like PostGIS (maps) and pgvector (AI embeddings).

Choosing between Postgres and MongoDB? See the comparison in [MongoDB](/notes/mongodb). For most apps with users, orders, payments and reports, Postgres is the safer default.

## Setting up

- **Cloud (easiest):** create a free database on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/) and copy the connection string.
- **Mac:** `brew install postgresql@18`, then `brew services start postgresql@18`.
- **Docker:** `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:18`.

A connection string looks like `postgres://user:password@host:5432/dbname`. Keep it in `.env` as `DATABASE_URL`.

### psql basics

```sql
\l                -- list databases
\c bitwise        -- connect to a database
\dt               -- list tables
\d students       -- describe a table
\q                -- quit
```

## Tables, types and constraints

```sql
CREATE TABLE students (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- auto-increment id
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  age         INTEGER CHECK (age >= 16),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE enrolments (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,  -- foreign key
  course      TEXT NOT NULL,
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  UNIQUE (student_id, course)                                              -- no double enrolment
);
```

| Type | Use for |
| --- | --- |
| `INTEGER`, `BIGINT` | whole numbers, ids (`GENERATED … AS IDENTITY` is the modern `SERIAL`) |
| `NUMERIC(10, 2)` | **money** and exact decimals (never `FLOAT` for money) |
| `TEXT`, `VARCHAR(n)` | strings (`TEXT` is fine; add a `CHECK` for length limits) |
| `BOOLEAN` | true / false |
| `TIMESTAMPTZ` | points in time (stores UTC; always prefer it over `TIMESTAMP`) |
| `DATE` | calendar dates |
| `UUID` | random ids (Postgres 18 has a built-in `uuidv7()`, which sorts by time) |
| `JSONB` | flexible JSON documents, indexable |
| `TEXT[]` | arrays |

**Constraints** are rules the database enforces for you: `NOT NULL`, `UNIQUE`, `CHECK`, `PRIMARY KEY`, `REFERENCES` (foreign key). Put rules in the database, not only in your code: the database is the last line of defence, whichever app or script writes to it.

## Keys and joins

A **primary key** uniquely identifies a row. A **foreign key** in one table points to a primary key in another, linking them. A **JOIN** combines rows from linked tables.

![Students and enrolments tables linked by student_id, and the result of joining them](/images/backend/postgres-join.svg "An INNER JOIN keeps only students who have enrolments. A LEFT JOIN keeps every student.")

```sql
INSERT INTO students (name, email, age) VALUES
  ('Asha', 'asha@example.com', 21),
  ('Ravi', 'ravi@example.com', 23),
  ('Meena', 'meena@example.com', 20);

INSERT INTO enrolments (student_id, course) VALUES (1, 'dsa'), (1, 'react'), (3, 'dsa');

-- INNER JOIN: only matching rows (Ravi disappears: he has no enrolments)
SELECT s.name, e.course
FROM students s
JOIN enrolments e ON e.student_id = s.id;

-- LEFT JOIN: every student; course is NULL where there's no match
SELECT s.name, e.course
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.id;

-- Students with no enrolments at all
SELECT s.name
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.id
WHERE e.id IS NULL;                      -- Ravi
```

### Everyday queries

```sql
-- Filter, sort, paginate
SELECT id, name FROM students WHERE age >= 18 ORDER BY name LIMIT 10 OFFSET 20;

-- Aggregate: enrolments per course, most popular first
SELECT course, COUNT(*) AS students
FROM enrolments
GROUP BY course
HAVING COUNT(*) >= 1                      -- HAVING filters groups; WHERE filters rows
ORDER BY students DESC;

-- Update and delete (always with a WHERE!)
UPDATE enrolments SET progress = progress + 10 WHERE student_id = 1 AND course = 'dsa';
DELETE FROM students WHERE id = 2;        -- ON DELETE CASCADE also removes his enrolments

-- Insert or update ("upsert")
INSERT INTO enrolments (student_id, course, progress) VALUES (1, 'dsa', 50)
ON CONFLICT (student_id, course) DO UPDATE SET progress = EXCLUDED.progress;

-- Return the new row straight away
INSERT INTO students (name, email) VALUES ('Kabir', 'kabir@example.com') RETURNING id, created_at;
```

## Indexes

Postgres automatically indexes primary keys and `UNIQUE` columns. Add indexes for columns you **filter, join or sort on** often, and foreign keys (Postgres does **not** index foreign keys automatically).

```sql
CREATE INDEX idx_enrolments_student ON enrolments (student_id);
EXPLAIN ANALYZE SELECT * FROM enrolments WHERE student_id = 1;  -- look for "Index Scan" vs "Seq Scan"
```

## JSONB: flexible data inside a relational table

```sql
ALTER TABLE students ADD COLUMN preferences JSONB NOT NULL DEFAULT '{}';
UPDATE students SET preferences = '{"theme": "dark", "langs": ["js", "py"]}' WHERE id = 1;

SELECT name FROM students WHERE preferences->>'theme' = 'dark';   -- ->> returns text
SELECT name FROM students WHERE preferences @> '{"langs": ["js"]}'; -- containment
CREATE INDEX idx_students_prefs ON students USING GIN (preferences); -- makes @> fast
```

Use JSONB for truly variable data (settings, metadata, form answers). Keep fields you query and join on as normal columns.

## Postgres from Node.js with pg

```bash
npm install pg
```

```js
// src/db.js
import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                                   // up to 10 connections, reused across requests
});
```

```js
import { pool } from "./db.js";

// Parameterised query: $1, $2 are placeholders; values are sent separately
const { rows } = await pool.query(
  "SELECT id, name, email FROM students WHERE age >= $1 ORDER BY name LIMIT $2",
  [18, 20],
);

app.get("/api/students/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT id, name, email FROM students WHERE id = $1", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Student not found" });
  res.json(rows[0]);
});

app.post("/api/students", async (req, res) => {
  const { name, email } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO students (name, email) VALUES ($1, $2) RETURNING id, name, email",
    [name, email],
  );
  res.status(201).json(rows[0]);
});
```

Use **one pool** for the whole app. A pool keeps connections open and lends them out, which is much faster than connecting per request. On serverless platforms, use your provider's pooled connection string (Neon and Supabase both offer one).

### SQL injection: never build SQL with strings

```js
// DANGEROUS: the user controls part of the SQL
const email = req.query.email;       // attacker sends: ' OR '1'='1
await pool.query(`SELECT * FROM students WHERE email = '${email}'`);
// → SELECT * FROM students WHERE email = '' OR '1'='1'   → returns every student

// SAFE: a parameter is always treated as a value, never as SQL
await pool.query("SELECT * FROM students WHERE email = $1", [email]);
```

**SQL injection** is one of the most damaging security bugs: attackers can read, change or delete your whole database. Always use parameters (or an ORM, which uses them for you). Parameters work for **values** only; if you must choose a column or sort direction dynamically, pick from a fixed allow-list.

## Transactions

A transaction makes several statements **all succeed or all fail** (the "A" in ACID). Use a single client from the pool for the whole transaction:

```js
async function transferPoints(fromId, toId, points) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rowCount } = await client.query(
      "UPDATE wallets SET points = points - $1 WHERE student_id = $2 AND points >= $1",
      [points, fromId],
    );
    if (rowCount === 0) throw new Error("Not enough points");
    await client.query("UPDATE wallets SET points = points + $1 WHERE student_id = $2", [points, toId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");               // undo everything since BEGIN
    throw err;
  } finally {
    client.release();                             // always return the client to the pool
  }
}
```

The `AND points >= $1` condition makes the check and the update **one atomic step**, so two simultaneous transfers can't both spend the same points.

## Migrations

Never change a production schema by hand. A **migration** is a versioned file (in git) that changes the schema, like `003_add_preferences.sql`. Tools run pending migrations in order on every environment: Prisma Migrate, Drizzle Kit, node-pg-migrate, Knex.

## ORMs and query builders

| Tool | Style | Notes |
| --- | --- | --- |
| **pg** | raw SQL | full control, learn SQL properly first |
| **Prisma** | schema file + generated, typed client | very popular, great developer experience, built-in migrations |
| **Drizzle** | TypeScript schema, SQL-like queries | lightweight, close to SQL, fully typed |
| **Knex** | query builder | older but solid |
| **Sequelize**, **TypeORM** | classic ORMs | common in older codebases |

```js
// Prisma: the same "students with their enrolments" query
const students = await prisma.student.findMany({
  where: { age: { gte: 18 } },
  include: { enrolments: true },
  orderBy: { name: "asc" },
});
```

Whatever you use, learn SQL itself: every ORM eventually needs a raw query, and interviews test SQL directly.

## Interview questions

1. Primary key vs foreign key vs unique key.
2. INNER JOIN vs LEFT JOIN. Find students with no enrolments.
3. WHERE vs HAVING.
4. What is SQL injection? Show a vulnerable query and the fix.
5. Why use a connection pool?
6. Write a transaction to transfer money. What does ROLLBACK do?
7. When would you use JSONB instead of columns?
8. Which columns should be indexed? Does Postgres index foreign keys automatically?
9. Raw SQL vs an ORM like Prisma: pros and cons.

## Further reading

- [PostgreSQL tutorial (official)](https://www.postgresql.org/docs/current/tutorial.html)
- [node-postgres documentation](https://node-postgres.com/)
- [Prisma docs](https://www.prisma.io/docs) and [Drizzle docs](https://orm.drizzle.team/docs/overview)
- [SQLBolt](https://sqlbolt.com/): interactive SQL lessons

Next: [Authentication: sessions, JWT and OAuth](/notes/authentication).
