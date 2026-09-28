---
title: DBMS and SQL
description: Keys, ER modelling, normalization, SQL joins and queries, transactions and ACID, isolation levels, indexing, and SQL vs NoSQL, with interview questions.
author: Bitwise School
---

A Database Management System (DBMS) stores, organises and protects data, and lets many users query and change it safely at the same time.

## Why a DBMS instead of files?

| Problem with plain files | How a DBMS solves it |
| --- | --- |
| Duplicate, inconsistent data | Central storage, constraints and normalization |
| Hard to query | A query language (SQL) and an optimizer |
| No safe concurrent access | Transactions, locking and isolation |
| Data loss on crashes | Logging, backups and recovery |
| Weak security | Users, roles and permissions |

### Three-schema architecture

1. **External level**: what each user or application sees (views).
2. **Conceptual level**: the logical structure of the whole database (tables, relationships, constraints).
3. **Internal level**: how data is physically stored (files, indexes, pages).

This gives **data independence**. With **logical independence** you can change the conceptual schema without changing applications. With **physical independence** you can change storage without changing the conceptual schema.

## ER modelling

- **Entity**: a real-world object (Student, Course). A **weak entity** cannot be identified without its owner (for example, Dependent of an Employee).
- **Attributes**: simple, composite (name → first, last), multivalued (phone numbers) and derived (age from date of birth).
- **Relationship**: an association between entities (Student *enrolls in* Course).
- **Cardinality**: 1:1, 1:N and M:N. An M:N relationship becomes a separate **junction table** (for example `enrollments(student_id, course_id)`).
- **Participation**: total (every entity must participate) or partial.

## Keys

| Key | Meaning | Example (students table) |
| --- | --- | --- |
| Super key | Any set of columns that uniquely identifies a row | {roll_no}, {roll_no, name} |
| Candidate key | A minimal super key | {roll_no}, {email} |
| Primary key | The candidate key you choose; unique and not null | roll_no |
| Alternate key | Candidate keys not chosen as primary | email |
| Composite key | A key made of two or more columns | (student_id, course_id) |
| Foreign key | A column that refers to the primary key of another table | enrollments.student_id → students.roll_no |
| Unique key | Unique, but may allow a NULL (depends on the database) | phone |

## SQL essentials

| Category | Commands |
| --- | --- |
| DDL (define structure) | CREATE, ALTER, DROP, TRUNCATE, RENAME |
| DML (change data) | INSERT, UPDATE, DELETE |
| DQL (query) | SELECT |
| DCL (permissions) | GRANT, REVOKE |
| TCL (transactions) | COMMIT, ROLLBACK, SAVEPOINT |

**Constraints**: NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK and DEFAULT.

### Logical order of a SELECT

```sql
SELECT department, COUNT(*) AS headcount   -- 5
FROM employees                              -- 1
WHERE salary > 30000                        -- 2
GROUP BY department                         -- 3
HAVING COUNT(*) > 5                         -- 4
ORDER BY headcount DESC                     -- 6
LIMIT 3;                                    -- 7
```

`FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`. This is why you cannot use a SELECT alias inside WHERE in standard SQL.

### Joins

```sql
SELECT s.name, c.title
FROM students s
INNER JOIN enrollments e ON e.student_id = s.id
INNER JOIN courses c ON c.id = e.course_id;
```

| Join | Returns |
| --- | --- |
| INNER JOIN | Only rows that match in both tables |
| LEFT JOIN | All rows from the left table, matching rows from the right (NULL if none) |
| RIGHT JOIN | All rows from the right table, matching rows from the left |
| FULL OUTER JOIN | All rows from both, NULL where there is no match |
| CROSS JOIN | Every combination (Cartesian product) |
| SELF JOIN | A table joined with itself, e.g. employee and manager |

### Classic interview queries

**Second highest salary**

```sql
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

**Nth highest salary with a window function** (N = 3 here)

```sql
SELECT DISTINCT salary
FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk = 3;
```

**Find duplicate emails**

```sql
SELECT email, COUNT(*) AS times
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

**Employees earning more than their manager (self join)**

```sql
SELECT e.name
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

**Top earner in each department**

```sql
SELECT department, name, salary
FROM (
  SELECT department, name, salary,
         ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
  FROM employees
) t
WHERE rn = 1;
```

### Often-confused pairs

- **WHERE vs HAVING**: WHERE filters rows before grouping; HAVING filters groups after aggregation.
- **DELETE vs TRUNCATE vs DROP**: DELETE removes chosen rows, can use WHERE and can be rolled back. TRUNCATE removes all rows quickly and resets storage. DROP removes the table itself.
- **UNION vs UNION ALL**: UNION removes duplicates (slower); UNION ALL keeps them.
- **ROW_NUMBER vs RANK vs DENSE_RANK**: for salaries 100, 100, 90, ROW_NUMBER gives 1, 2, 3; RANK gives 1, 1, 3; DENSE_RANK gives 1, 1, 2.
- **View**: a saved query that behaves like a virtual table. A **materialized view** stores the result physically.

## Normalization

Normalization organises tables to reduce redundancy and avoid **anomalies**:

- **Insertion anomaly**: you cannot add a course until a student enrolls in it.
- **Update anomaly**: a teacher's phone number stored in 100 rows must be changed in all 100.
- **Deletion anomaly**: deleting the last student of a course also deletes the course's details.

A **functional dependency** `A → B` means the value of A determines the value of B.

| Normal form | Rule |
| --- | --- |
| 1NF | Atomic values; no repeating groups or multi-valued cells |
| 2NF | 1NF, and no **partial dependency**: non-key columns depend on the whole composite key |
| 3NF | 2NF, and no **transitive dependency**: non-key columns depend only on the key |
| BCNF | For every dependency X → Y, X is a super key (a stricter 3NF) |

**Example**: `enrollments(student_id, course_id, student_name, course_fee)` breaks 2NF, because `student_name` depends only on `student_id` and `course_fee` only on `course_id`. Split it into `students`, `courses` and `enrollments(student_id, course_id)`.

**Denormalization** adds some redundancy back on purpose to make reads faster, which is common in analytics and high-traffic systems.

## Transactions

A transaction is a group of operations that must succeed or fail together, like transferring money: debit one account, credit another.

### ACID

- **Atomicity**: all or nothing (rollback on failure).
- **Consistency**: the database moves from one valid state to another, and constraints hold.
- **Isolation**: concurrent transactions do not interfere with each other's intermediate states.
- **Durability**: once committed, changes survive crashes (ensured by write-ahead logs).

### Concurrency problems

- **Dirty read**: reading data another transaction has not committed yet.
- **Non-repeatable read**: reading the same row twice and getting different values because someone updated it.
- **Phantom read**: running the same query twice and getting new rows because someone inserted them.
- **Lost update**: two transactions overwrite each other's changes.

### Isolation levels (SQL standard)

| Level | Dirty read | Non-repeatable read | Phantom read |
| --- | --- | --- | --- |
| Read uncommitted | Possible | Possible | Possible |
| Read committed | Prevented | Possible | Possible |
| Repeatable read | Prevented | Prevented | Possible |
| Serializable | Prevented | Prevented | Prevented |

Higher isolation means fewer anomalies but less concurrency. PostgreSQL defaults to Read committed; MySQL InnoDB defaults to Repeatable read.

### Concurrency control and recovery

- **Locks**: shared (read) and exclusive (write). **Two-phase locking (2PL)** acquires all locks before releasing any, which guarantees conflict-serializable schedules. Strict 2PL holds write locks until commit.
- **Serializability**: a concurrent schedule is correct if it is equivalent to some serial order. Check conflict serializability with a **precedence graph**: no cycle means serializable.
- **Deadlocks** happen in databases too; the DBMS detects them and aborts one transaction.
- **MVCC (multi-version concurrency control)**: readers see a snapshot and do not block writers (PostgreSQL, InnoDB).
- **Recovery**: a write-ahead log (WAL) records changes before they reach disk. After a crash, the DBMS **redoes** committed work and **undoes** uncommitted work. Checkpoints limit how much log must be replayed.

## Indexing

An index is a data structure that speeds up lookups at the cost of extra storage and slower writes.

- **B+ tree** indexes are the default in most relational databases. They are balanced, keep keys sorted, store data pointers in the leaves, link the leaves together and are great for range queries.
- **Hash** indexes are fast for equality lookups but useless for ranges.
- A **clustered index** decides the physical order of rows, so there is only one per table (in InnoDB it is the primary key). A **non-clustered (secondary) index** is a separate structure pointing to the rows.
- A **composite index** on `(a, b)` helps queries on `a` or on `a` and `b`, but usually not on `b` alone (the leftmost prefix rule).
- **Don't over-index**: every insert and update must also update each index.

## SQL vs NoSQL

| SQL (relational) | NoSQL |
| --- | --- |
| Tables with a fixed schema | Flexible schemas: documents, key-value, wide-column, graph |
| Strong consistency and ACID transactions | Often eventual consistency (many now support transactions) |
| Joins across tables | Data often denormalized; joins are limited |
| Usually scales vertically; sharding is harder | Built for horizontal scaling |
| MySQL, PostgreSQL | MongoDB (document), Redis (key-value), Cassandra (wide-column), Neo4j (graph) |

The **CAP theorem** says that during a network partition, a distributed database must choose between **consistency** and **availability**.

## Interview questions

**1. Primary key vs unique key?**
A primary key is unique and not null, and there is only one per table. A unique key enforces uniqueness, a table can have several, and they may allow NULLs depending on the database.

**2. What is a foreign key?**
A column that references the primary key of another table and enforces referential integrity.

**3. Explain 1NF, 2NF and 3NF in one line each.**
1NF has atomic values. 2NF removes partial dependencies on part of a composite key. 3NF removes transitive dependencies between non-key columns.

**4. What are ACID properties?**
Atomicity, consistency, isolation and durability. Together they guarantee reliable transactions.

**5. What is the difference between clustered and non-clustered indexes?**
A clustered index defines the physical order of rows (one per table). A non-clustered index is a separate structure with pointers to rows.

**6. WHERE vs HAVING?**
WHERE filters rows before GROUP BY. HAVING filters aggregated groups after it.

**7. What is a deadlock in a database and how is it resolved?**
Two transactions wait for locks the other holds. The DBMS detects the cycle and rolls back one of them.

**8. What is a view?**
A stored query that acts like a virtual table. It is useful for security and for simplifying complex queries.

**9. When would you choose NoSQL over SQL?**
For flexible or rapidly changing schemas, very high write throughput, or horizontal scaling where strict joins and transactions matter less.

**10. What is a phantom read?**
A repeated range query returns new rows because another transaction inserted them in between.

**11. Why do too many indexes hurt?**
They slow down inserts, updates and deletes, and use extra storage.

**12. What is denormalization?**
Deliberately adding redundant data to speed up reads, at the cost of harder updates.
