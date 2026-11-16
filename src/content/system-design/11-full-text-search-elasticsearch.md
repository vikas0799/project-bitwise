---
title: Full-Text Search and Elasticsearch
description: Why ILIKE '%term%' collapses at scale, how an inverted index and text analysis work, BM25 relevance scoring, typo tolerance with fuzzy matching, Postgres full-text search with tsvector, GIN indexes and pg_trgm, Elasticsearch mappings and queries, keeping a search index in sync, and how to choose.
author: Bitwise School
---

Search looks easy until your data grows. This chapter starts from the query everyone writes first, shows exactly why it stops working, and builds up to the tools that power the search box on every large site: inverted indexes, relevance scoring, typo tolerance, Postgres full-text search and Elasticsearch.

## How search gets hard

Your course platform has 2,000 courses, and the search endpoint is one line of SQL:

```sql
SELECT id, title FROM courses WHERE title ILIKE '%' || $1 || '%';
```

It answers in a few milliseconds. Two years later you've added millions of reviews, lessons and forum posts, and the same kind of query takes seconds. Meanwhile, product asks for more:

- **Relevance**: searching "node" should show "Node.js Backend Development" before a course that mentions Node once in lesson 14.
- **Typo tolerance**: a student typing "javscript" in a hurry should still find JavaScript courses.
- **Speed**: results in tens of milliseconds, while typing.

Speed, relevance and typo tolerance are exactly what full-text search engines were built for.

## Why ILIKE can't keep up

Think of your database as a very organised librarian who knows where every book sits. Ask for "books that mention machine learning anywhere" and the librarian must walk to every shelf, open every book and read every page. That's a **sequential scan**. And the librarian can't tell you which book is *most* relevant: a book titled "Machine Learning" counts the same as one that mentions it once in an appendix.

A normal B-tree index can't help either. B-trees store values in sorted order, so `title LIKE 'mach%'` (a known prefix) can use one. But `'%machine%'` starts with a wildcard: there is no prefix to look up, so Postgres reads every row.

We measured it: 200,000 product reviews, searching for "machine" (which appears in 400 of them):

```text
EXPLAIN ANALYZE SELECT id FROM reviews WHERE body ILIKE '%machine%';
Seq Scan on reviews  (actual time=0.496..157.265 rows=400 loops=1)
  Filter: (body ~~* '%machine%'::text)
  Rows Removed by Filter: 199600                          ← read every row, kept 400
Execution Time: 157.700 ms

EXPLAIN ANALYZE SELECT id FROM reviews WHERE search @@ websearch_to_tsquery('english', 'machine');
Bitmap Heap Scan on reviews  (actual time=0.522..1.139 rows=400 loops=1)
  Recheck Cond: (search @@ '''machin'''::tsquery)         ← used the full-text index
Execution Time: 1.657 ms
```

Same 400 results, about **95 times faster**, and the gap grows with the table. The second query uses an **inverted index**.

## The inverted index

The key idea: instead of scanning documents to find a word, keep a map from **every word to the documents that contain it**. A book's index at the back works the same way: "B-trees: pages 212, 240". A normal index maps document → content; this one is *inverted*: word → documents.

When a document is saved, the search engine runs its text through an **analysis** pipeline:

1. **Tokenise**: split into words. "Introduction to Machine Learning" → `introduction`, `to`, `machine`, `learning`.
2. **Normalise**: lowercase, so "Machine" and "machine" match.
3. **Remove stop words**: drop words like "to", "the" and "a" that appear everywhere and carry no meaning (optional).
4. **Stem**: cut words to a root, so "learning", "learned" and "learns" all become `learn`, and "searches" becomes `search`.
5. **Record** each resulting term with the document id (and its position, for phrase searches).

![Three course titles analysed into terms and stored in an inverted index, where a search for learning jumps straight to documents 1 and 3](/images/system-design/inverted-index.svg "The query goes through the same analysis, so 'learning' finds every form of 'learn'.")

The search text goes through the **same analysis**, so a search for "learning" looks up `learn` and gets documents 1 and 3 directly. The cost depends on how many documents **match**, not on how many exist. A hundred million documents is fine as long as the match list is small.

## Relevance: BM25

Finding matching documents is half the job; ranking them is the other half. Elasticsearch, OpenSearch and most modern engines rank with **BM25** ("Best Match 25"). You don't need the formula, just the four ideas behind it:

| Factor | Idea | Effect |
| --- | --- | --- |
| **Term frequency** | how often the term appears in this document | more is better, with diminishing returns: the 10th mention adds less than the 2nd |
| **Inverse document frequency (IDF)** | how rare the term is across all documents | rare words count more: "kubernetes" says much more than "course" |
| **Document length** | how long this document is compared with the average | a match in a short title outweighs a match in a 5,000-word page |
| **Field boost** | which field matched | you decide that a title match matters, say, 3× more than a description match |

IDF is why stop words don't matter much even if you keep them: a word that appears in every document has an IDF close to zero, so it barely moves the score.

## Typo tolerance: fuzzy matching

Fuzzy search finds terms within a small **edit distance** of what was typed: the number of single-character insertions, deletions, substitutions (and, in Elasticsearch, swaps of two neighbouring letters) needed to turn one word into the other.

| Typed | Meant | Edits |
| --- | --- | --- |
| `javscript` | `javascript` | 1 (insert `a`) |
| `bakend` | `backend` | 1 (insert `c`) |
| `dokcer` | `docker` | 1 (swap `k` and `c`) |

Elasticsearch's `"fuzziness": "AUTO"` allows 0 edits for very short words, 1 for medium words and 2 for long ones, which avoids silly matches on short words. Setting a `prefix_length` of 1 requires the first letter to be right, which removes a lot of noise and speeds things up. The same machinery powers search-as-you-type suggestions.

## Postgres full-text search

You may not need a separate search engine at all. Postgres has built-in full-text search:

- **`tsvector`**: a document's analysed terms (with positions).
- **`tsquery`**: an analysed search query.
- **`@@`**: the "matches" operator.
- **GIN index**: Postgres's inverted index.
- **`ts_rank`**: a relevance score; **`setweight`** gives fields different importance, like field boosts.

```sql
CREATE TABLE courses (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  search      TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', description), 'B')
  ) STORED
);
CREATE INDEX courses_search_idx ON courses USING GIN (search);
```

The `search` column is computed by Postgres whenever a row changes, so it can never be out of date. Weight `A` (title) outranks weight `B` (description). Here's what the analysis produces:

```text
SELECT to_tsvector('english', 'Introduction to Machine Learning and running searches');
'introduct':1 'learn':4 'machin':3 'run':6 'search':7          ← lowercased, stemmed, "to"/"and" dropped
```

And the search endpoint:

```js
import { z } from "zod";

const SearchQuery = z.object({ q: z.string().trim().min(2).max(100) });

app.get("/api/search", validate({ query: SearchQuery }), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, title,
            ts_rank(search, query) AS rank,
            ts_headline('english', description, query) AS snippet
     FROM courses, websearch_to_tsquery('english', $1) AS query
     WHERE search @@ query
     ORDER BY rank DESC
     LIMIT 20`,
    [req.valid.query.q]
  );
  res.json({ data: rows });
});
```

- `websearch_to_tsquery` accepts what people type into search boxes: `machine learning -python` becomes `'machin' & 'learn' & !'python'`, and quoted phrases work too.
- `ts_headline` returns a snippet with the matches wrapped in `<b>`…`</b>`. Escape or sanitise it before inserting it into HTML.
- The search text is a **parameter**, as always ([Chapter 08](/system-design/08-databases/)).

With five sample courses, "machine learning" returned "Introduction to Machine Learning" (rank 0.991) well above a data-structures course that mentions machine learning only in its description (rank 0.396). That's the title weight at work.

### Typos in Postgres: pg_trgm

Full-text search matches whole (stemmed) words, so "machne" finds nothing. The **`pg_trgm`** extension adds typo tolerance by comparing **trigrams**, the three-letter chunks of a word:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX courses_title_trgm ON courses USING GIN (title gin_trgm_ops);

SET pg_trgm.word_similarity_threshold = 0.4;   -- the default 0.6 is too strict for typos

SELECT title, word_similarity($1, title) AS score
FROM courses
WHERE $1 <% title            -- "is $1 similar to some word in title?", can use the index
ORDER BY score DESC
LIMIT 10;
```

`SET` only affects the current connection. With a connection pool, either run it as `SET LOCAL` inside the same transaction as the query, or set it once for the whole database: `ALTER DATABASE coursehub SET pg_trgm.word_similarity_threshold = 0.4`.

In our test, "lerning" scored 0.55 against "Learning" and "bakend" 0.50 against "Backend", so both matched once the threshold was lowered to 0.4. Trigrams handle swapped letters poorly, though: "dokcer" scored only 0.29 against "Docker". That's one area where Elasticsearch's fuzzy matching is clearly better.

## Elasticsearch

**Elasticsearch** is a distributed search engine built on **Apache Lucene**, the Java library (around since 1999) that implements inverted indexes and BM25. Elasticsearch (2010) wraps Lucene in a JSON REST API and adds clustering and replication. **OpenSearch** is an open-source fork with the same core ideas.

- **JSON documents**: you index JSON, a bit like MongoDB. Fields are detected automatically or mapped explicitly.
- **Near real time**: a new document becomes searchable within about a second.
- **Scales horizontally**: an index is split into **shards** (each one a complete Lucene index) spread across nodes, with replicas for safety.
- **A rich query language**: full-text, fuzzy, phrase, range, geo and aggregations, all in JSON.

### Mapping: text vs keyword

The most important mapping decision:

| Type | Analysed? | Use for | Example |
| --- | --- | --- | --- |
| `text` | yes: tokenised, lowercased, stemmed | full-text search | course titles, descriptions, reviews |
| `keyword` | no: stored exactly as given | filters, sorting, aggregations | level, status, tags, category ids |

A field that needs both (search by title *and* sort by title) can be mapped as `text` with a `keyword` sub-field.

### Index, bulk-load and search from Node.js

```bash
npm install @elastic/elasticsearch
```

```js
import { Client } from "@elastic/elasticsearch";

export const es = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: { apiKey: process.env.ELASTICSEARCH_API_KEY },
});

// 1. Create the index with an explicit mapping
await es.indices.create({
  index: "courses",
  mappings: {
    properties: {
      title: { type: "text" },
      description: { type: "text" },
      level: { type: "keyword" },
      price: { type: "integer" },          // in rupees
      publishedAt: { type: "date" },
    },
  },
});

// 2. Load many documents efficiently
await es.helpers.bulk({
  datasource: courses,                    // an array or async iterator of course objects
  onDocument: (course) => ({ index: { _index: "courses", _id: String(course.id) } }),
});

// 3. Search: fuzzy, boosted, filtered
export async function searchCourses(text, { level, maxPrice } = {}) {
  const result = await es.search({
    index: "courses",
    size: 20,
    query: {
      bool: {
        must: {
          multi_match: {
            query: text,
            fields: ["title^3", "description"],   // a title match counts 3x
            fuzziness: "AUTO",
            prefix_length: 1,
          },
        },
        filter: [
          ...(level ? [{ term: { level } }] : []),
          ...(maxPrice ? [{ range: { price: { lte: maxPrice } } }] : []),
        ],
      },
    },
    highlight: { fields: { description: {} } },
  });
  return result.hits.hits.map((hit) => ({ id: hit._id, score: hit._score, ...hit._source, highlight: hit.highlight }));
}
```

Two ideas worth noticing:

- **`must` scores, `filter` doesn't.** Clauses in `must` affect relevance. Clauses in `filter` are a plain yes/no gate (beginner level, under ₹500); they're faster and can be cached. Put exact conditions in `filter`.
- **`^3` is a field boost.** Tune boosts with real queries and see what users actually click.

### Keeping the search index in sync

Postgres stays your **source of truth**; Elasticsearch holds a **copy** optimised for searching. Whenever a course is created, updated or deleted, the copy must change too:

- **On write, in the background**: after saving to Postgres, enqueue a "reindex course 42" job ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)). The worker reads the fresh row and indexes it. Simple, and retries make it reliable.
- **Change data capture (CDC)**: stream Postgres changes to Elasticsearch with a tool like Debezium and Kafka ([Chapter 23](/system-design/23-message-brokers-and-kafka/)). More moving parts, but nothing can forget to reindex.
- **Periodic full rebuild**: re-create the index from scratch into a new index, then switch an alias to it. Useful after mapping changes, and as a safety net.

Avoid writing to Postgres and Elasticsearch one after the other inside the request: if the second write fails, the two silently disagree.

## The ELK stack: search for logs

Elasticsearch isn't only for product search. It's the **E** in the **ELK stack**, the classic setup for centralised logging:

- **Logstash** (or the lighter **Beats** shippers) collects logs from every server and parses them.
- **Elasticsearch** indexes them, so you can search millions of log lines instantly.
- **Kibana** gives you dashboards, charts and a search UI.

If your company already runs ELK for logs, adding product search on the same cluster can be a cheap, natural step: you already pay for it, and your team already knows how to run it. [Chapter 15](/system-design/15-logging-and-observability/) covers logging in depth.

## Which should you use?

| Choose **Postgres full-text search** when… | Choose **Elasticsearch** (or OpenSearch) when… |
| --- | --- |
| the data already lives in Postgres | search is a core feature of the product |
| search is a secondary feature | you have many millions of documents |
| you're a small team without spare ops capacity | you need strong typo tolerance and autocomplete |
| data is up to a few million rows | you need advanced relevance tuning |
| basic typo handling (pg_trgm) is enough | you need aggregations, facets and analytics on results |
| you want zero extra infrastructure | you already run ELK for logs |

A sensible path: start with Postgres full-text search. Move to Elasticsearch when search becomes central to the product or Postgres can't keep up, and not before. You don't need to master Elasticsearch the way you must master your main database. Understand the ideas in this chapter, know when to reach for it, and the official docs cover the rest.

## Quick revision

| Idea | One line |
| --- | --- |
| `ILIKE '%x%'` | a leading wildcard can't use a B-tree, so it scans every row |
| Inverted index | word → documents; cost depends on matches, not table size |
| Analysis | tokenise, lowercase, drop stop words, stem |
| BM25 | term frequency, rarity (IDF), document length, field boosts |
| Fuzzy search | edit distance; `fuzziness: "AUTO"`, `prefix_length` |
| Postgres FTS | `tsvector`, `tsquery`, `@@`, GIN index, `ts_rank`, `setweight` |
| pg_trgm | trigram similarity for typos; lower the threshold |
| Elasticsearch | Lucene + REST + shards; `text` vs `keyword`; `must` vs `filter` |
| Sync | Postgres is the truth; reindex via jobs or CDC |
| ELK | Logstash/Beats + Elasticsearch + Kibana for logs |

## Interview questions

1. Why does `WHERE title ILIKE '%term%'` get slow on large tables, even with an index on `title`?
2. What is an inverted index? How is it built?
3. What are tokenisation, stop words and stemming? Why must queries be analysed the same way as documents?
4. Explain the factors BM25 uses to rank results. Why do rare words count more?
5. How does fuzzy search work? What does `fuzziness: "AUTO"` do?
6. How do you implement full-text search in Postgres? What is a GIN index?
7. How can Postgres handle typos?
8. In Elasticsearch, what is the difference between `text` and `keyword`? Between `must` and `filter`?
9. How do you keep Elasticsearch in sync with your primary database?
10. When would you choose Postgres full-text search over Elasticsearch, and vice versa?

## Further reading

- [PostgreSQL: full-text search](https://www.postgresql.org/docs/current/textsearch.html) and [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Elasticsearch guide](https://www.elastic.co/docs/solutions/search) and [query DSL](https://www.elastic.co/docs/explore-analyze/query-filter/languages/querydsl)
- [Elasticsearch JavaScript client](https://www.elastic.co/docs/reference/elasticsearch/clients/javascript)
- [Apache Lucene](https://lucene.apache.org/)

Next: [Chapter 12, Error Handling and Fault Tolerance](/system-design/12-error-handling-and-fault-tolerance/).
