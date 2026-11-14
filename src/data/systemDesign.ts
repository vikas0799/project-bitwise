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
];

// Parts that have at least one chapter, each with its chapters in reading order.
export const chapterGroups = systemDesignParts
  .map((part) => ({ ...part, chapters: systemDesignChapters.filter((c) => c.part === part.id) }))
  .filter((group) => group.chapters.length > 0);

export const getChapter = (slug?: string) => systemDesignChapters.find((c) => c.slug === slug);

export const chapterPath = (slug: string) => `/system-design/${slug}/`;
