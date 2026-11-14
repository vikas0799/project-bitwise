// Chapters of the System Design series at /system-design/.
// To add a chapter: write src/content/system-design/<slug>.md (title/description/author
// frontmatter), then add an entry below in reading order and a <url> in public/sitemap.xml.

export interface SystemDesignChapter {
  slug: string;
  number: string;
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

export const systemDesignChapters: SystemDesignChapter[] = [
  {
    slug: '01-http-and-cors',
    number: '01',
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
    title: 'Serialization and Deserialization',
    description:
      'Why a JavaScript client and a Go or Java server need a shared data format, text vs binary formats, JSON rules, JSON.stringify and JSON.parse gotchas, the full request round trip in Express, and why parsed data still has to be validated.',
    minutes: 9,
    topics: ['JSON', 'Protobuf', 'JSON.stringify', 'JSON.parse', 'Validation'],
    sourceUrl: 'https://backend-from-first-principle.vercel.app/03-serialization-and-deserialization/',
  },
];

export const getChapter = (slug?: string) => systemDesignChapters.find((c) => c.slug === slug);

export const chapterPath = (slug: string) => `/system-design/${slug}/`;
