---
title: Message Brokers and Kafka
description: Kafka from first principles. The append-only log, queue vs log, topics, partitions and keys, brokers, replication, acks and in-sync replicas, producers, consumer groups, offsets and lag, delivery semantics and idempotent consumers, ordering, retention and compaction, schemas, event-driven patterns, event sourcing and CQRS, the outbox pattern and CDC, stream processing, Kafka vs queues, consumer pitfalls and dead-letter topics, and operations, tested on a real three-broker cluster.
author: Bitwise School
---

Strip away the marketing and Kafka is one thing: **a distributed, durable, append-only log of events that many independent consumers can read at their own pace.** Producers add records to the end. Consumers read forward from a position they track themselves. And records **stay** after they're read, for as long as the topic's retention allows. Almost every Kafka feature follows from that one picture.

The official description, "a distributed event streaming platform", fits too. **Distributed**: it runs as a cluster of servers (brokers) that replicate data and scale out. **Event streaming**: it carries a continuous flow of immutable facts (an order was placed, a payment was captured, a video was watched), not request/response calls. **Platform**: producers, consumers, connectors and stream processing all share the same log.

A traditional queue is a to-do list: you take an item, do it, and it's gone. Kafka is a ship's logbook: every event is written down in order and stays in the book, and any number of readers can read from wherever they left off, re-read yesterday's entries, or start again from page one.

Every experiment in this chapter ran against a real three-broker Kafka 4.1 cluster in Docker, using Confluent's official JavaScript client from Node.js, plus Postgres for the idempotency and outbox examples.

## Queue vs log

This is the most important idea in the chapter. Mixing up Kafka with a traditional message queue causes most of the confusion around it. [Chapter 10](/system-design/10-task-queues-and-background-jobs/) covered queues (BullMQ, RabbitMQ, SQS). Kafka is a different shape of tool.

![In a queue each job goes to one worker and is deleted; in a log events stay at their offsets and each consumer group reads at its own position](/images/system-design/queue-vs-log.svg "A queue distributes work. A log records history that many systems can read.")

| | Traditional queue | Kafka log |
| --- | --- | --- |
| After a message is read | deleted | kept until retention expires |
| Who gets a message | one of the competing workers | every consumer group, independently |
| Re-reading | impossible, it's gone | seek to any offset and replay |
| Who tracks progress | the broker | each consumer group (its offset) |
| Ordering | weak across workers | strict within a partition |
| Think of it as | a to-do list | a logbook / source of truth |
| Best at | background jobs | event streams with many subscribers, replay, high throughput |

They're not rivals. Many systems use **both**: Kafka as the event backbone that orders, payments and clicks flow through to many systems, and a job queue for discrete tasks like "send this email" or "resize this image".

## The commit log

Kafka is built on the simplest data structure in computing: an **append-only log**. Records are only ever added to the end, never inserted in the middle or changed. Each record gets an **offset** (0, 1, 2, …) that is its permanent address. Databases use the same structure internally (Postgres's write-ahead log); Kafka's idea was to make the log itself the public product.

Why this works so well:

- **Sequential disk access is fast.** Appending to the end of a file and reading forward are the cheapest things a disk can do. Kafka also leans on the operating system's page cache and sends data straight from disk to the network (zero-copy), which is how modest servers handle hundreds of thousands to millions of messages per second.
- **Immutable data is simple.** Records never change, so there are no update locks and readers never get in each other's way.
- **The log is the history.** Nothing is overwritten, so the log is a complete ordered record of what happened. That's what makes replay, event sourcing and bootstrapping a new consumer from the beginning possible.

Everything else in this chapter is this log, split into pieces (partitions), copied for safety (replication), and read with bookmarks (offsets).

## Topics and partitions

A **topic** is a named stream of related events: `orders`, `payments`, `page-views`. But a topic isn't one log; it's split into **partitions**, and the partition is where the real mechanics live. It's Kafka's unit of:

- **Parallelism.** Partitions live on different brokers and are read by different consumers at the same time, so throughput grows with partition count.
- **Ordering.** Kafka guarantees order **within a partition only**.
- **Storage.** Each partition is a set of log files on a broker's disk. Retention and compaction work per partition.

A record's **key** decides its partition: Kafka hashes the key and takes it modulo the partition count. Same key, same partition, strict order. I created an `orders` topic with 6 partitions and sent four events for each of three orders, keyed by order ID:

```text
order-41 OrderPlaced      -> partition 2, offset 0
order-42 OrderPlaced      -> partition 0, offset 0
order-43 OrderPlaced      -> partition 4, offset 0
order-41 PaymentCaptured  -> partition 2, offset 1
order-42 PaymentCaptured  -> partition 0, offset 1
...
order-42 OrderDelivered   -> partition 0, offset 3
```

![Records are routed to one of six partitions by hashing their key; all events for order-42 go to partition 0 in order](/images/system-design/kafka-partitions.svg "The key picks the partition, and order is only guaranteed inside one partition.")

Every event for `order-42` went to partition 0, in order. Records with **no key** are spread across partitions for maximum parallelism, with no ordering between them. That's fine for independent events and a bug when events for the same entity must stay in order. **Key by the thing whose events must stay ordered**, usually an entity ID.

> **Choose the partition count carefully.** You can add partitions later, but that changes `hash(key) % partitions`, so existing keys can move to a different partition and lose their ordering guarantee. You can't reduce partitions at all. Size for your expected peak throughput and the number of consumers you'll want.

## Brokers, replication and durability

A cluster is a set of **brokers**. Each partition has one **leader** replica and some **follower** replicas on other brokers. Producers and consumers talk to the leader; followers keep copying from it. If the leader's broker dies, a caught-up follower becomes leader.

I created the `orders` topic with **replication factor 3** and `min.insync.replicas=2`:

```js
await admin.createTopics({
  topics: [{
    topic: "orders",
    numPartitions: 6,
    replicationFactor: 3,                                         // every partition on 3 brokers
    configEntries: [{ name: "min.insync.replicas", value: "2" }],  // acks=all needs 2 copies
  }],
});
```

```text
partition 0: leader broker 3, replicas [3,1,2], in sync [3,1,2]
partition 1: leader broker 1, replicas [1,2,3], in sync [1,2,3]
partition 2: leader broker 2, replicas [2,3,1], in sync [2,3,1]
...
```

Leadership is spread across brokers so they share the load.

### acks and in-sync replicas

How safe a write is depends on two settings:

- The producer's **`acks`**: how many replicas must confirm before the write counts as done.
- **ISR** (in-sync replicas): the followers that are currently caught up with the leader. `min.insync.replicas` says how many must exist for an `acks=all` write to be accepted.

| Setting | Guarantee | Trade-off |
| --- | --- | --- |
| `acks=0` | none: fire and forget | fastest; can silently lose data |
| `acks=1` | the leader has it | lost if the leader dies before followers copy it |
| `acks=all` + `min.insync.replicas=2` | at least 2 brokers have it | slightly slower; the standard for data that matters |

Then I started stopping brokers while writing with `acks=all`:

```text
--- all 3 brokers up:
  partition 0: leader 3, in sync [3,1,2]
  acks=all write succeeded in 509 ms
--- broker 3 stopped:
  partition 0: leader 1, in sync [1,2]
  acks=all write succeeded in 36 ms
--- brokers 2 and 3 stopped:
  partition 0: leader 1, in sync [1]
  write failed after 5007 ms: Local: Message timed out
--- both restarted:
  partition 0: leader 1, in sync [1,2,3]
  acks=all write succeeded in 514 ms
```

![A partition leader on broker 1 replicates to followers on brokers 2 and 3; with min.insync.replicas of 2, writes succeed with one broker down and are refused with two down](/images/system-design/kafka-replication.svg "Losing one broker changes leaders but loses nothing. Losing two stops writes rather than risk losing them.")

With one broker gone, partition 0 got a new leader within seconds and writes kept working. With two gone, only one copy remained, below `min.insync.replicas=2`, so the broker **refused** the write (its log says `NotEnoughReplicasException: The size of the current ISR : 1 is insufficient to satisfy the min.isr requirement of 2`), and the producer gave up after its 5-second timeout. Kafka chose to stop accepting writes rather than accept ones it might lose. When the brokers came back, they caught up and rejoined the ISR.

**No more ZooKeeper.** Older Kafka needed a separate ZooKeeper cluster for metadata and leader election. Modern Kafka uses **KRaft**, a Raft-based controller quorum built into the brokers. Kafka 4.0 removed ZooKeeper entirely, so if old tutorials mention it, KRaft is the replacement.

## Producers

A producer sends records: a **key**, a **value** (your event, usually JSON, Avro or Protobuf), optional **headers** and a timestamp. Behind the scenes it batches and compresses records for throughput.

The original KafkaJS library is no longer actively maintained. Confluent's official client, `@confluentinc/kafka-javascript`, wraps the battle-tested librdkafka C library and offers a KafkaJS-compatible API:

```js
// kafka.js
import { KafkaJS } from "@confluentinc/kafka-javascript";

export const kafka = new KafkaJS.Kafka({
  kafkaJS: { clientId: "course-api", brokers: ["kafka-1:9092", "kafka-2:9092", "kafka-3:9092"] },
});
```

```js
import { randomUUID } from "node:crypto";
import { kafka } from "./kafka.js";

const producer = kafka.producer({ kafkaJS: { acks: -1, idempotent: true } });   // acks=all; no duplicates on retry
await producer.connect();

await producer.send({
  topic: "orders",
  messages: [{
    key: order.id,                                       // same key -> same partition -> ordered
    value: JSON.stringify({ eventId: randomUUID(), type: "OrderPlaced", orderId: order.id, total: order.total }),
    headers: { "trace-id": traceId },                    // carry tracing context through the pipeline
  }],
});
```

Two settings to turn on for anything important:

- **`acks: -1`** (all in-sync replicas) for durability.
- **`idempotent: true`**: the broker deduplicates the producer's retries, so a network blip doesn't write the same record twice, and retries can't reorder records within a partition.

Give every event a unique **`eventId`**. Consumers will need it to recognise duplicates.

## Consumers and consumer groups

A consumer reads records from partitions. The key abstraction is the **consumer group**: consumers sharing a `groupId` split the topic's partitions between them, so each partition is read by exactly one member. Add or remove a member and Kafka **rebalances**, handing partitions out again.

```js
const consumer = kafka.consumer({ kafkaJS: { groupId: "fulfilment", autoCommit: false } });
await consumer.connect();
await consumer.subscribe({ topics: ["orders"] });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value.toString());
    await handleOrderEvent(event);                       // do the work first
    // then commit: a crash before this line means the event is delivered again
    await consumer.commitOffsets([{ topic, partition, offset: String(Number(message.offset) + 1) }]);
  },
});
```

I started three consumers in a `fulfilment` group and one in an `analytics` group, waited for the groups to settle, then produced 12 events:

```text
fulfilment consumer 1 owns partitions 1,4
fulfilment consumer 2 owns partitions 0,3
fulfilment consumer 3 owns partitions 2,5
fulfilment consumer 1: 4 events, partitions p4
fulfilment consumer 2: 4 events, partitions p0
fulfilment consumer 3: 4 events, partitions p2
analytics consumer 1: 12 events
order-42 as seen by analytics: OrderPlaced -> PaymentCaptured -> OrderShipped -> OrderDelivered
```

![Three consumers in the fulfilment group each own two partitions, while the single analytics consumer reads all six partitions](/images/system-design/consumer-groups.svg "Inside a group, partitions are shared out. Across groups, everyone gets everything.")

That's both models in one system: **within** a group, consumers share the work like a queue; **across** groups, every group receives every event, like publish/subscribe. Adding a new system that needs order events means adding a new group. The producer doesn't change.

> **Partitions cap a group's parallelism.** One partition goes to at most one consumer in a group, so a 6-partition topic can keep at most 6 consumers in a group busy. A seventh sits idle. Another reason to choose partition counts with your future scale in mind.

## Offsets and lag

A consumer group's **committed offset** for each partition records how far it has processed. Kafka stores these in an internal topic (`__consumer_offsets`), so after a restart or rebalance, consumers resume where the group left off.

The gap between the newest offset in a partition and the group's committed offset is **consumer lag**, the most important health metric for a consumer. I produced 24 more events while the analytics consumer was stopped:

```bash
kafka-consumer-groups.sh --bootstrap-server kafka-1:9092 --describe --group analytics
```

```text
TOPIC          PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG
orders         0         8              16             8
orders         2         8              16             8
orders         4         8              16             8
```

Lag growing over time means consumers can't keep up and the data they act on is getting stale. Alert on it.

### Replay

Because records stay in the log and each group has its own offsets, a **brand-new group** can start from the earliest offset and read the entire history:

```js
const consumer = kafka.consumer({ kafkaJS: { groupId: "search-indexer", fromBeginning: true } });
```

```text
new group replayed 48 events from the beginning
```

That's how you bootstrap a new service (a search index, a recommendations model) from existing events, or rebuild a read model after fixing a bug. Consumers can also `seek` to a specific offset or timestamp. A queue can't do any of this; once a message is consumed, it's gone.

## Delivery semantics

When things fail and get retried, how many times can a message be processed?

| Guarantee | How you get it | Risk |
| --- | --- | --- |
| **At most once** | commit the offset *before* processing | a crash after committing skips the message |
| **At least once** | commit the offset *after* processing | a crash before committing processes it again |
| **Exactly once** | Kafka transactions, for Kafka-to-Kafka processing | doesn't extend to your database or external APIs |

Kafka's idempotent producer prevents duplicate writes, and **transactions** give exactly-once processing when you read from Kafka, transform, and write back to Kafka. But the moment your consumer writes to a database or calls a payment API, Kafka can't make that external effect happen exactly once.

The practical answer is **at-least-once delivery plus idempotent processing**: accept that a message may arrive twice, and make the second time harmless. Record each `eventId` in the same database transaction as the effect:

```js
async function handlePaymentCaptured(event) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    // Record the event id first; a duplicate hits the primary key and changes nothing.
    const { rowCount } = await client.query(
      `INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING`, [event.eventId]);
    if (rowCount === 0) { await client.query("ROLLBACK"); return "duplicate, skipped"; }
    await client.query(
      `INSERT INTO revenue (day, total) VALUES (current_date, $1)
       ON CONFLICT (day) DO UPDATE SET total = revenue.total + EXCLUDED.total`, [event.amount]);
    await client.query("COMMIT");          // the effect and the "seen it" marker commit together
    return "applied";
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
```

To test it, a consumer processed a `PaymentCaptured` event and then "crashed" without committing its offset. A second consumer in the same group received the same event again:

```text
first delivery: applied
redelivery after crash: duplicate, skipped
revenue today: 4999
```

Revenue counted the payment once. Without the `processed_events` check, it would have been ₹9,998. This is the same idempotency idea as job queues ([Chapter 10](/system-design/10-task-queues-and-background-jobs/)) and REST idempotency keys ([Chapter 1](/system-design/01-http-and-cors/)). Other ways to be idempotent: upserts keyed on a natural ID, or "set status to shipped" instead of "increment".

## Ordering guarantees

One sentence to remember: **Kafka guarantees order within a partition, and nowhere else.** Across partitions, records interleave in any order. That's the direct price of parallelism: total order for a stream would mean one partition, which means one consumer.

Two ordering traps:

- **Hot keys.** If you key by something coarse, like a tenant ID, and one tenant is huge, all its traffic goes to one partition, which caps its throughput no matter how many partitions exist. Choose a key that keeps the order you need and still spreads load (an order ID or account ID rather than a whole tenant).
- **Retries reordering messages.** Without idempotence, a failed batch can be retried after a later batch succeeded. The idempotent producer prevents this, another reason to always enable it.

## Retention and log compaction

Since records aren't deleted when read, every topic needs a rule for when they are. There are two cleanup policies:

- **Delete (the default)**: keep records for a time or size, say 7 days or 50 GB per partition, then drop the oldest segments. Answers "what happened recently?"
- **Compact**: keep the **latest record for each key** and remove older ones. Answers "what's the current value of everything?"

I created a compacted topic of course prices, wrote several updates per key, and deleted one key with a **tombstone** (a record with a null value):

```js
await send("course-7", "4999"); await send("course-8", "2999"); await send("course-7", "3999");
await send("course-9", "999");  await send("course-7", "2499"); await send("course-8", "1999");
await send("course-9", null);                            // a tombstone: delete course-9
```

After the log cleaner ran, reading from the beginning returned:

```text
still in the log: [ '4:course-7=2499', '5:course-8=1999' ]
```

Only the latest price per course remained, at their original offsets, and `course-9` was gone. A compacted topic is a durable, replayable snapshot of current state: a new service can read it from the start to build a complete lookup table without the topic growing forever. It powers Kafka Streams tables and event-sourcing snapshots.

## Schemas and the Schema Registry

Kafka treats values as opaque bytes. That freedom becomes a problem at scale: if a producer renames a field, every consumer breaks, and those consumers may belong to ten different teams.

The fix is a **schema** per topic and a **Schema Registry** that stores versions and enforces compatibility rules. Producers register the schema and put its ID in each message; consumers fetch the schema by ID to decode.

- **Formats**: **Avro** (the traditional choice, compact, good evolution rules), **Protobuf** (the same IDL as gRPC, [Chapter 13](/system-design/13-grpc-and-inter-service-communication/)), or **JSON Schema** (readable, larger).
- **Compatibility**: usually **backward compatible**, meaning consumers using the new schema can read old data. You can add optional fields or remove fields that have defaults; you can't rename or change the type of a field.

A topic's schema is a public API between teams. The registry turns "please don't break the payload" from a convention into an automatic check.

## Event-driven patterns

Kafka is the usual backbone for **event-driven architecture**: services announce what happened instead of calling each other. The order service doesn't call email, inventory and analytics; it publishes `OrderPlaced`, and anyone interested subscribes. The producer doesn't know who's listening, so adding a new consumer never touches it.

| Pattern | Idea | Trade-off |
| --- | --- | --- |
| **Event notification** | the event says "X happened" plus an ID | small events; consumers call back for details, adding load and coupling |
| **Event-carried state transfer** | the event includes the data consumers need | consumers are self-sufficient; bigger events, duplicated data |
| **Choreography** | each service reacts to events on its own | loosely coupled, easy to extend; the overall flow is hard to see |
| **Orchestration** | a coordinator (a saga) tells services what to do next | explicit, visible flow; a central coordinator again |

The cost of decoupling: no single place describes "what happens when an order is placed?" any more. Counter it with trace IDs in event headers ([Chapter 15](/system-design/15-logging-and-observability/)), clear schemas, and orchestration when a workflow needs to be visible and controlled, like a multi-step payment.

## Event sourcing and CQRS

Two patterns the log makes possible, often used together.

**Event sourcing** stores state as the sequence of events that produced it. Instead of a row saying `balance = 100`, you store `Deposited 60`, `Deposited 50`, `Withdrew 10`, and compute the balance by replaying them. **CQRS** (Command Query Responsibility Segregation) separates the write side from one or more read models, each shaped for its queries and built by consuming the events.

The benefits are real: a **complete audit trail**, the ability to **rebuild state at any point in time**, and **several read models** from the same history. The costs are real too: you can never change past events, only how you interpret them, so schema evolution is hard; and "what's the current value?" needs a projection instead of a simple row lookup. Use it where history is the product (ledgers, payments, compliance-heavy domains), not as a default for ordinary CRUD apps.

## The outbox pattern and change data capture

A very common need: **save to the database and publish an event**. Doing them as two separate steps is unsafe. If the commit succeeds and the publish fails (or the process crashes in between), the order exists but no `OrderPlaced` event is ever sent. Publish first, and you can announce an order that then fails to save. This is the **dual-write problem**, and reordering the steps can't fix it.

![Writing to the database and Kafka separately can leave them out of sync; the outbox pattern writes the order and the event in one transaction and a relay publishes it](/images/system-design/outbox-pattern.svg "Turn two writes to two systems into one local transaction plus a reliable relay.")

The **outbox pattern** writes the business change and an "outbox" row describing the event in **the same database transaction**. A separate relay publishes outbox rows to Kafka:

```js
async function placeOrder(userId, total) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const orderId = randomUUID();
    await client.query(`INSERT INTO shop_orders (id, user_id, total) VALUES ($1, $2, $3)`, [orderId, userId, total]);
    await client.query(`INSERT INTO outbox (topic, key, payload) VALUES ('orders', $1, $2)`,
      [orderId, { eventId: randomUUID(), type: "OrderPlaced", orderId, userId, total }]);
    await client.query("COMMIT");                     // both rows, or neither
    return orderId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// The relay: publish unpublished rows in order, mark them, repeat. Safe to run on several servers.
async function relayOnce(producer) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, topic, key, payload FROM outbox WHERE published_at IS NULL
       ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED`);  // other relays skip rows this one holds
    for (const row of rows) {
      await producer.send({ topic: row.topic, messages: [{ key: row.key, value: JSON.stringify(row.payload) }] });
    }
    if (rows.length) await client.query(`UPDATE outbox SET published_at = now() WHERE id = ANY($1)`, [rows.map((r) => r.id)]);
    await client.query("COMMIT");
    return rows.length;
  } catch (err) {
    await client.query("ROLLBACK");                  // nothing marked: those rows are retried next time
    throw err;
  } finally {
    client.release();
  }
}
```

```text
invalid order rejected: new row for relation "shop_orders" violates check constraint "shop_orders_total_check"
orders: 2, outbox rows waiting: 2
relay published 2 events
relay published 0 events (nothing left)
```

The invalid order rolled back, and so did its event. The two valid orders' events waited safely in the outbox until the relay published them. If Kafka had been down, they would simply have waited longer. If the relay crashes after publishing but before marking rows, they're published again, so consumers must be idempotent, which they already are.

In production, the relay is often **change data capture (CDC)**: a tool like **Debezium** reads the database's own transaction log (Postgres's WAL) and streams committed outbox rows into Kafka, with no polling.

## Stream processing

So far consumers handle one event at a time. **Stream processing** computes continuously over streams: filtering, transforming, joining, and aggregating over time windows, like "failed payments per merchant in the last 5 minutes", updated as events arrive.

| Concept | Meaning |
| --- | --- |
| **Stream** | an unbounded sequence of independent events; every record matters |
| **Table** | the latest value per key, like a compacted topic |
| **Stateful operations** | aggregations and joins that remember earlier events in a local state store, backed up to Kafka |
| **Windows** | grouping events by time: tumbling (fixed, non-overlapping), hopping (overlapping), session (gaps of inactivity) |
| **Event time vs processing time** | when it happened vs when you saw it; late and out-of-order events must be handled |

A stream and a table are two views of the same data: aggregate a stream by key and you get a table; a table's changes form a stream. The common tools are **Kafka Streams** and **ksqlDB** (JVM and SQL), and **Apache Flink** for large, complex jobs. For simple per-event work, a plain consumer is enough; reach for these when you need windows, joins or large aggregations.

## Kafka vs traditional queues

| | Kafka (log) | RabbitMQ / SQS / BullMQ (queue) |
| --- | --- | --- |
| Model | durable, replayable event log | work queue |
| After consumption | kept; any group can replay | deleted once acknowledged |
| Fan-out to many systems | built in: one group per system | needs extra setup (exchanges, SNS) |
| Throughput | very high | high, usually lower |
| Ordering | strong per partition | weak; FIFO modes are limited |
| Per-message routing, priority, delay | limited, not its model | rich |
| Replay | yes | no |
| Best for | event streams, many subscribers, analytics, event sourcing | background jobs, routing, per-message control |

Use **Kafka** when events are facts many systems care about and you need throughput, ordering or replay. Use a **queue** when you're handing off individual jobs to be done once, especially if you need priorities, delays or per-message retries. Don't force queue features (per-message TTL, priorities, selective acknowledgement) onto Kafka.

## Consumer pitfalls

Most Kafka pain in production shows up on the consumer side.

| Pitfall | What happens | Fix |
| --- | --- | --- |
| **Rebalance storms** | slow processing exceeds the poll timeout, the consumer is declared dead, the group rebalances again and again | keep per-message work bounded, move slow work elsewhere, use cooperative rebalancing |
| **Poison pill** | one message that can't be processed makes the consumer crash and retry forever, blocking the partition | catch errors per message; send failures to a dead-letter topic |
| **Growing lag** | producers outpace consumers | more partitions and consumers, faster processing, batching; alert on lag |
| **Hot partition** | one huge key overloads one partition | a higher-cardinality or composite key |
| **One slow message delays the rest** | partitions are processed in order | parallelise across partitions, not within one |
| **Duplicates after crashes** | normal under at-least-once | idempotent processing |

### Dead-letter topics

A single malformed message must never stall a partition. Catch the error, publish the record with error details to a **dead-letter topic**, commit past it and keep going:

```js
consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    try {
      const event = JSON.parse(message.value.toString());
      await sendWelcomeEmail(event);                                             // the real work
    } catch (err) {
      await producer.send({ topic: `${topic}.dlq`, messages: [{                 // park it with context
        key: message.key, value: message.value,
        headers: { "error": err.message, "source-topic": topic, "source-partition": String(partition), "source-offset": message.offset },
      }] });
    }
    await consumer.commitOffsets([{ topic, partition, offset: String(Number(message.offset) + 1) }]);   // move past it either way
  },
});
```

With a bad record sandwiched between two good ones:

```text
offset 1 sent to signups-….dlq: Expected property name or '}' in JSON at position 1 (line 1 column 2)
processed: [ 'asha@example.com', 'asha.v@example.com' ]
```

Both good records were processed, and the bad one waits in the dead-letter topic with enough context to investigate and replay it. Only dead-letter **permanent** failures like this; for temporary ones (a database timeout), retry a few times with backoff first.

## Operations and monitoring

| Watch | Why |
| --- | --- |
| **Consumer lag** | the headline consumer metric; growing lag means stale data |
| **Under-replicated partitions** | replicas dropped out of the ISR; durability is at risk |
| **Disk and network per broker** | retention means real disk usage; saturation throttles everything |
| **Rebalance rate** | frequent rebalances mean unstable consumers and stalls |
| **Produce and fetch latency, error rates** | early warning of broker or client trouble |

The sizing decisions you'll actually make:

- **Partition count**: sets maximum consumer parallelism and throughput. Estimate from peak throughput and consumer count, err a little high, but not wildly (every partition has overhead). Hard to change later.
- **Replication factor**: 3 in production, with `min.insync.replicas=2` and `acks=all`.
- **Retention**: how far back consumers might need to replay, balanced against disk.

Broker and client metrics usually go to Prometheus and Grafana ([Chapter 15](/system-design/15-logging-and-observability/)); tools like Kafka UI, AKHQ or Conduktor show topics and lag. Managed services (Confluent Cloud, Amazon MSK, Aiven, Redpanda Cloud) take on most of the operations work.

## Designing with Kafka

1. **Model topics around facts, not commands.** A topic is "things that happened" (`PaymentCaptured`), not a way to tell one service to do something. If you want a request and a response, use HTTP or gRPC.
2. **Choose the key by your ordering boundary**, at a granularity that still spreads load.
3. **Assume at-least-once and build idempotent consumers.** Don't chase exactly-once across external systems.
4. **Govern schemas from day one** with backward-compatible evolution.
5. **Use the outbox (or CDC) whenever a database write must produce an event.** Never dual-write.
6. **Size partitions for future peak load**, because repartitioning breaks key ordering.
7. **Always have a dead-letter strategy.**

**Reach for Kafka** for event streams many systems consume, high throughput, replay, event-driven architecture, event sourcing, analytics pipelines, and log or metrics ingestion. **Don't** use it for simple request/response, for background jobs that need per-message priority or delays (use a job queue), or as your only database for point lookups.

## Quick revision

| Concept | Remember |
| --- | --- |
| Kafka | a distributed, durable, append-only log read by many consumers at their own offsets |
| Queue vs log | queue: consumed once and deleted; log: kept, replayable, every group reads all |
| Partition | unit of parallelism, ordering and storage; key → partition |
| Replication | leader + followers; ISR = caught-up replicas |
| Durability | `acks=all` + `min.insync.replicas=2` + replication factor 3 |
| Producer | key by entity, `idempotent: true`, unique `eventId` |
| Consumer group | partitions shared inside a group; every group gets every event |
| Parallelism cap | consumers per group ≤ partitions |
| Offset / lag | committed position per partition; lag = log end − committed |
| Replay | a new group from the earliest offset reads all history |
| Delivery | commit after processing = at-least-once; make consumers idempotent |
| Ordering | only within a partition; watch for hot keys |
| Retention / compaction | delete by age or size, or keep the latest value per key; tombstones delete |
| Schema Registry | versioned schemas with enforced compatibility |
| Event-driven | notification vs state transfer; choreography vs orchestration |
| Event sourcing / CQRS | events are the source of truth; read models are projections |
| Outbox / CDC | data and event in one transaction; a relay or Debezium publishes |
| Pitfalls | rebalance storms, poison pills, lag, hot partitions; use a dead-letter topic |
| Kafka vs queue | event streaming and replay vs job processing and routing |

## Interview questions

1. What is Kafka, in one sentence? How is it different from a message queue like RabbitMQ or SQS?
2. Why is an append-only log fast?
3. What is a partition, and what three roles does it play?
4. How does Kafka decide which partition a record goes to? What happens to ordering if you don't set a key?
5. What problems does adding partitions to an existing topic cause?
6. Explain leaders, followers and in-sync replicas. What do `acks=all` and `min.insync.replicas=2` guarantee?
7. What happens to writes when one of three brokers fails? When two fail?
8. What is a consumer group? How do you get queue-like and pub/sub-like behaviour from the same topic?
9. Why does the number of partitions limit a consumer group's parallelism?
10. What is consumer lag and why does it matter?
11. Explain at-most-once, at-least-once and exactly-once delivery. Which would you choose, and how do you handle duplicates?
12. Where does Kafka guarantee ordering? How would you keep all events for one user in order?
13. What is log compaction and what is a tombstone? When would you use a compacted topic?
14. Why use a Schema Registry? What does backward compatibility allow?
15. Compare event notification and event-carried state transfer, and choreography and orchestration.
16. What are event sourcing and CQRS? When are they worth the complexity?
17. What is the dual-write problem? How does the outbox pattern solve it?
18. What is a poison pill message and how do you handle it?
19. When would you choose Kafka over a traditional queue, and vice versa?
20. What would you monitor on a Kafka cluster?

## Further reading

- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Jay Kreps: The Log: What every software engineer should know about real-time data's unifying abstraction](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying)
- [Confluent JavaScript client](https://github.com/confluentinc/confluent-kafka-javascript)
- [Kafka: The Definitive Guide](https://www.confluent.io/resources/kafka-the-definitive-guide-v2/) (free from Confluent)
- [Debezium: the outbox pattern](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)
- [Martin Fowler: What do you mean by "event-driven"?](https://martinfowler.com/articles/201701-event-driven.html)
- [Microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)

Next: [Chapter 24, WebSockets and Real-Time Communication](/system-design/24-websockets-and-real-time/).
