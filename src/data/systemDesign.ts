// Chapters of the System Design series at /system-design/.
// To add a chapter: write src/content/system-design/<slug>.md (title/description/author
// frontmatter), then add an entry below in reading order and a <url> in public/sitemap.xml.

export interface SystemDesignPart {
  id: string;
  title: string;
  description: string;
}

export interface SystemDesignChapter {
  slug: string;
  number: string;
  part: SystemDesignPart['id'];
  title: string;
  description: string;
  minutes: number;
  topics: string[];
  /** The chapter of Backend from First Principles this one is based on. */
  sourceUrl: string;
}

export const SYSTEM_DESIGN_SOURCE = {
  name: 'Backend from First Principles',
  url: 'https://backend-from-first-principle.vercel.app/',
};

// Chapters are grouped into parts on the index page and in the chapter sidebar.
export const systemDesignParts: SystemDesignPart[] = [
  { id: 'foundations', title: 'Part I: Foundations', description: 'How a request travels, who sent it, and how a backend is organised to answer it.' },
  { id: 'data', title: 'Part II: Data and background work', description: 'Databases, caches, queues and search: where data lives and how slow work moves out of the request.' },
  { id: 'production', title: 'Part III: Production readiness', description: 'Errors, service-to-service calls, configuration, observability, shutdowns and security.' },
  { id: 'scale', title: 'Part IV: Scale and delivery', description: 'Performance, concurrency, containers, CI/CD and testing.' },
  { id: 'advanced', title: 'Part V: Advanced topics and a case study', description: 'Event streaming, real-time apps, API specs, AI agents and a full system design walkthrough.' },
];

export const systemDesignChapters: SystemDesignChapter[] = [
  {
    slug: '01-http-and-cors',
    number: '01',
    part: 'foundations',
    title: 'HTTP and CORS: How Clients and Servers Talk',
    description:
      'Statelessness, HTTP versions, request and response messages, headers, methods and idempotency, cookies and JWTs, CORS and preflight requests, status codes, redirects, caching, proxies, WebSockets and HTTPS, with Node.js and Express code.',
    minutes: 37,
    topics: ['Statelessness', 'Methods', 'Headers', 'CORS', 'Status codes', 'Caching', 'HTTPS'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/01-http-and-cors/',
  },
  {
    slug: '02-routing-in-backend',
    number: '02',
    part: 'foundations',
    title: 'Routing in the Backend',
    description:
      'How a server maps method + path to a handler: static and dynamic routes, path and query parameters, pagination, nested routes, route order, versioning and deprecation, 404 catch-all routes, and a small router built from scratch in JavaScript.',
    minutes: 10,
    topics: ['Path params', 'Query params', 'Nested routes', 'Versioning', '404 handler'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/02-routing-in-backend/',
  },
  {
    slug: '03-serialization-and-deserialization',
    number: '03',
    part: 'foundations',
    title: 'Serialization and Deserialization',
    description:
      'Why a JavaScript client and a Go or Java server need a shared data format, text vs binary formats, JSON rules, JSON.stringify and JSON.parse gotchas, the full request round trip in Express, and why parsed data still has to be validated.',
    minutes: 9,
    topics: ['JSON', 'Protobuf', 'JSON.stringify', 'JSON.parse', 'Validation'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/03-serialization-and-deserialization/',
  },
  {
    slug: '04-authentication-and-authorization',
    number: '04',
    part: 'foundations',
    title: 'Authentication and Authorization',
    description:
      'Who are you, and what are you allowed to do? Password hashing with Argon2, sessions, JWTs, refresh token rotation, cookies, CSRF, API keys, OAuth 2.0 with PKCE, OpenID Connect, RBAC and ABAC, and timing attacks, with Node.js code.',
    minutes: 22,
    topics: ['Argon2', 'Sessions', 'JWT', 'CSRF', 'OAuth + PKCE', 'OIDC', 'RBAC'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/04-authentication-and-authorization/',
  },
  {
    slug: '05-validations-and-transformations',
    number: '05',
    part: 'foundations',
    title: 'Validations and Transformations',
    description:
      'Check every piece of client data at the front door. Where validation lives, the 400 vs 500 story, type, syntax, semantic and cross-field checks, casting and normalising input, stripping unknown fields, and why frontend validation never replaces backend validation, with Zod and Express.',
    minutes: 10,
    topics: ['Zod', '400 vs 500', 'Cross-field rules', 'Coercion', 'Mass assignment'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/05-validations-and-transformations/',
  },
  {
    slug: '06-controllers-services-and-middlewares',
    number: '06',
    part: 'foundations',
    title: 'Controllers, Services and Middlewares',
    description:
      'What happens inside the server between a request arriving and a response leaving. The entry point, routing, controller, service and repository layers, middleware and next(), why middleware order matters, the common middlewares, and the request context for auth data, tracing and cancellation, with Express.',
    minutes: 12,
    topics: ['Layered architecture', 'Middleware', 'next()', 'Error handler', 'Request context'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/06-controllers-services-and-middlewares/',
  },
  {
    slug: '07-api-design-rest',
    number: '07',
    part: 'foundations',
    title: 'API Design: REST Done Right',
    description:
      'What REST really means and where it came from, Fielding\'s six constraints, naming resources, choosing methods, custom actions, pagination, sorting and filtering, honest status codes, consistent errors (RFC 9457), versioning, and a complete REST API in Express you can run and test.',
    minutes: 16,
    topics: ['Six constraints', 'Resource naming', 'Custom actions', 'Pagination', 'Error envelope', 'Versioning'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/07-api-design-rest/',
  },
  {
    slug: '08-databases',
    number: '08',
    part: 'data',
    title: 'Databases',
    description:
      'Why backends store data on disk, what a DBMS gives you over text files, SQL vs NoSQL, why Postgres is a great default, data types, migrations, modelling relationships, constraints, joins, parameterized queries, indexes, triggers, transactions and ACID, N+1 queries, connection pooling, EXPLAIN and soft deletes.',
    minutes: 19,
    topics: ['Postgres', 'Relationships', 'Constraints', 'Indexes', 'Transactions', 'N+1'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/08-databases/',
  },
  {
    slug: '09-caching',
    number: '09',
    part: 'data',
    title: 'Caching',
    description:
      'Keep the right subset of data somewhere faster. Cache hits and misses, what to cache, CDNs and DNS caching, CPU caches and why RAM beats disk, Redis and in-memory stores, cache-aside and write-through, invalidation, eviction policies, stampedes, and real use cases with Node.js and Redis code.',
    minutes: 16,
    topics: ['Redis', 'CDN', 'Cache-aside', 'Invalidation', 'Eviction', 'Rate limiting'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/09-caching/',
  },
  {
    slug: '10-task-queues-and-background-jobs',
    number: '10',
    part: 'data',
    title: 'Task Queues and Background Jobs',
    description:
      'Move slow and unreliable work out of the request. Producers, queues, workers and brokers, retries with exponential backoff and jitter, acknowledgements and visibility timeouts, dead-letter queues, idempotent handlers, scheduled and chained jobs, rate-limited workers, monitoring, and when to reach for Temporal, with BullMQ code.',
    minutes: 16,
    topics: ['BullMQ', 'Retries + backoff', 'Idempotency', 'Dead-letter queue', 'Schedulers', 'Temporal'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/10-task-queues-and-background-jobs/',
  },
  {
    slug: '11-full-text-search-elasticsearch',
    number: '11',
    part: 'data',
    title: 'Full-Text Search and Elasticsearch',
    description:
      'Why ILIKE \'%term%\' collapses at scale, how an inverted index and text analysis work, BM25 relevance scoring, typo tolerance with fuzzy matching, Postgres full-text search with tsvector, GIN indexes and pg_trgm, Elasticsearch mappings and queries, keeping a search index in sync, and how to choose.',
    minutes: 11,
    topics: ['Inverted index', 'BM25', 'Fuzzy search', 'Postgres FTS', 'pg_trgm', 'Elasticsearch'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/11-full-text-search-elasticsearch/',
  },
  {
    slug: '12-error-handling-and-fault-tolerance',
    number: '12',
    part: 'production',
    title: 'Error Handling and Fault Tolerance',
    description:
      'Design for failure from day one. The five kinds of backend errors, database errors and deadlocks, timeouts, retries with backoff, circuit breakers and graceful degradation, failing fast on bad configuration, liveness and readiness checks, monitoring business metrics, a global error handler, and what never to reveal in an error, with Express code.',
    minutes: 14,
    topics: ['Deadlocks', 'Timeouts', 'Retries', 'Circuit breaker', 'Health checks', 'Global error handler'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/12-error-handling-and-fault-tolerance/',
  },
  {
    slug: '13-grpc-and-inter-service-communication',
    number: '13',
    part: 'production',
    title: 'gRPC and Inter-Service Communication',
    description:
      'Call a function on another machine as if it were local. What RPC is, Protocol Buffers and how they encode, HTTP/2 underneath, the four call types, code generation, channels and stubs, metadata, deadlines and cancellation, status codes, interceptors, TLS and mTLS, load balancing, gRPC vs REST, and browser options, with Node.js code.',
    minutes: 17,
    topics: ['Protobuf', 'HTTP/2', 'Streaming', 'Deadlines', 'Interceptors', 'Load balancing'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/13-grpc-and-inter-service-communication/',
  },
  {
    slug: '14-configuration-management',
    number: '14',
    part: 'production',
    title: 'Configuration Management',
    description:
      'All the settings that decide how the same code behaves in different places. Kinds of configuration, environment variables and .env files, YAML config files, secret managers, merging sources by priority, per-environment values, feature flags and gradual rollouts, keeping secrets safe, and validating everything at startup, with Node.js code.',
    minutes: 11,
    topics: ['Env vars', '.env', 'YAML', 'Secret managers', 'Feature flags', 'Validation'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/14-configuration-management/',
  },
  {
    slug: '15-logging-and-observability',
    number: '15',
    part: 'production',
    title: 'Logging and Observability',
    description:
      'See inside a running system. The three pillars (logs, metrics, traces), monitoring vs observability, what and how to log, log levels, structured JSON logs, Prometheus metric types, distributed tracing and OpenTelemetry, the open-source and managed tool stacks, alert design with the four golden signals, and a real debugging walkthrough, with Node.js code.',
    minutes: 15,
    topics: ['Logs', 'Metrics', 'Traces', 'pino', 'Prometheus', 'OpenTelemetry'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/15-logging-and-observability/',
  },
  {
    slug: '16-graceful-shutdown',
    number: '16',
    part: 'production',
    title: 'Graceful Shutdown',
    description:
      'Stop a server without dropping requests or corrupting data. Process lifecycles, Unix signals (SIGTERM, SIGINT, SIGKILL), connection draining with a timeout, coordinating with load balancers and Kubernetes, cleaning up resources in reverse order, and a tested Node.js implementation, plus the Docker, PM2 and Kubernetes details that trip people up.',
    minutes: 9,
    topics: ['SIGTERM', 'SIGKILL', 'Draining', 'Cleanup order', 'Kubernetes', 'Docker PID 1'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/16-graceful-shutdown/',
  },
  {
    slug: '17-backend-security',
    number: '17',
    part: 'production',
    title: 'Backend Security',
    description:
      'Think like an attacker. SQL, NoSQL and command injection, password storage, cookie flags, JWT pitfalls, rate-limiting logins, broken authorization (BOLA and BFLA), XSS and CSP, CSRF, misconfigurations and leaked secrets, supply-chain risks, defence in depth, security testing, and lessons from real breaches, with tested Node.js examples.',
    minutes: 20,
    topics: ['SQL injection', 'XSS', 'BOLA / BFLA', 'Rate limiting', 'Security headers', 'Real breaches'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/17-backend-security/',
  },
  {
    slug: '18-scaling-and-performance-part-1',
    number: '18',
    part: 'scale',
    title: 'Scaling and Performance, Part 1',
    description:
      'Measure first: latency percentiles, throughput, queueing, profiling, event-loop blocking, indexes, pooling, caching, the cluster module and load balancing.',
    minutes: 26,
    topics: ['Percentiles', 'Profiling', 'Indexes', 'Load balancing'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/18-scaling-and-performance-part-1/',
  },
  {
    slug: '19-scaling-and-performance-part-2',
    number: '19',
    part: 'scale',
    title: 'Scaling and Performance, Part 2',
    description:
      'Stateless servers, load balancing, read replicas and replication lag, partitioning, sharding and consistent hashing, CDNs, edge, async work, microservices and serverless.',
    minutes: 22,
    topics: ['Read replicas', 'Sharding', 'CDN', 'Serverless'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/19-scaling-and-performance-part-2/',
  },
  {
    slug: '20-concurrency-and-parallelism',
    number: '20',
    part: 'scale',
    title: 'Concurrency and Parallelism',
    description:
      'Why servers mostly wait, threads vs the event loop vs goroutines, libuv and its thread pool, async/await under the hood, worker threads, and fixing race conditions in code and in the database.',
    minutes: 21,
    topics: ['Event loop', 'Worker threads', 'Race conditions', 'Locks'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/20-concurrency-and-parallelism/',
  },
  {
    slug: '21-docker-k8s-and-ci-cd',
    number: '21',
    part: 'scale',
    title: 'Docker, Kubernetes and CI/CD',
    description:
      'What containers really are, Dockerfiles, layer caching and small images, signals and memory limits, Compose, Kubernetes Deployments, Services, probes and autoscaling, CI/CD pipelines and GitOps.',
    minutes: 27,
    topics: ['Docker', 'Kubernetes', 'CI/CD', 'GitOps'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/21-docker-k8s-and-ci-cd/',
  },
  {
    slug: '22-automated-testing',
    number: '22',
    part: 'scale',
    title: 'Automated Testing',
    description:
      'The testing pyramid, unit tests and test doubles, real-database integration tests with Testcontainers, HTTP and contract tests, coverage, flaky tests, TDD, fake timers and load tests with SLOs.',
    minutes: 23,
    topics: ['Unit tests', 'Testcontainers', 'Pact', 'TDD'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/22-automated-testing/',
  },
  {
    slug: '23-message-brokers-and-kafka',
    number: '23',
    part: 'advanced',
    title: 'Message Brokers and Kafka',
    description:
      'The append-only log, partitions and keys, replication and acks, consumer groups, offsets and lag, idempotent consumers, compaction, the outbox pattern and dead-letter topics, tested on a three-broker cluster.',
    minutes: 23,
    topics: ['Kafka', 'Consumer groups', 'Outbox', 'Event-driven'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/23-message-brokers-and-kafka/',
  },
];

// Parts that have at least one chapter, each with its chapters in reading order.
export const chapterGroups = systemDesignParts
  .map((part) => ({ ...part, chapters: systemDesignChapters.filter((c) => c.part === part.id) }))
  .filter((group) => group.chapters.length > 0);

export const getChapter = (slug?: string) => systemDesignChapters.find((c) => c.slug === slug);

export const chapterPath = (slug: string) => `/system-design/${slug}/`;
