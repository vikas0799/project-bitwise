// Generated from the frontmatter in src/content/notes/*.md.
// To add a note: create src/content/notes/<slug>.md with title/description/author
// frontmatter, then add its slug to a category below.

export interface NoteMeta {
  slug: string;
  title: string;
  description: string;
  author: string;
  minutes: number;
}

export interface NoteCategory {
  id: string;
  title: string;
  description: string;
  notes: NoteMeta[];
}

export const noteCategories: NoteCategory[] = [
  {
    "id": "javascript",
    "title": "JavaScript",
    "description": "Core JS, OOP, async and the interview topics that come up in every frontend round.",
    "notes": [
      {
        "slug": "javascript-revision",
        "title": "JavaScript Revision: Foundations to Advanced",
        "description": "Variables, data types, scope, hoisting, closures, arrays, objects, higher-order functions, async JavaScript, the DOM and browser APIs, with interview questions.",
        "author": "Vikas Patel",
        "minutes": 12
      },
      {
        "slug": "oop-in-javascript",
        "title": "OOP in JavaScript",
        "description": "Encapsulation, abstraction, inheritance, polymorphism, classes, this, static methods, getters and setters.",
        "author": "Vikas Patel",
        "minutes": 4
      },
      {
        "slug": "shallow-vs-deep-copy",
        "title": "Shallow Copy vs Deep Copy",
        "description": "References, spread, Object.assign, structuredClone and the pitfalls of the JSON method.",
        "author": "Vikas Patel",
        "minutes": 4
      },
      {
        "slug": "promises-prototypes-this",
        "title": "Promises, Prototypes and this",
        "description": "Promise states and methods, wrapper classes and autoboxing, the prototype chain, call/apply/bind and classes.",
        "author": "Vikas Patel",
        "minutes": 11
      },
      {
        "slug": "javascript-interview-notes",
        "title": "JavaScript Interview Notes",
        "description": "Debouncing, throttling, event propagation and delegation, polyfills and machine-coding round problems.",
        "author": "Vikas Patel",
        "minutes": 21
      }
    ]
  },
  {
    "id": "backend",
    "title": "Backend: Node, Express and MongoDB",
    "description": "Everything you need to build and explain a Node.js backend.",
    "notes": [
      {
        "slug": "node-express-basics",
        "title": "Node.js and Express Basics",
        "description": "Node.js, npm, modules, the fs and http modules, Express routes, request data, static files and CRUD.",
        "author": "Vikas Patel",
        "minutes": 4
      },
      {
        "slug": "express-middleware",
        "title": "Express Middleware",
        "description": "How middleware works, next(), built-in and third-party middleware, body parsing and error handling.",
        "author": "Vikas Patel",
        "minutes": 5
      },
      {
        "slug": "ejs-templating",
        "title": "EJS Templating",
        "description": "Rendering dynamic HTML with EJS: tags, loops, forms, render vs redirect.",
        "author": "Vikas Patel",
        "minutes": 6
      },
      {
        "slug": "ssr-vs-csr",
        "title": "SSR vs CSR",
        "description": "Server-side vs client-side rendering: trade-offs, when to use which, and hybrid rendering.",
        "author": "Vikas Patel",
        "minutes": 3
      },
      {
        "slug": "mongodb",
        "title": "MongoDB Basics",
        "description": "Documents and collections, mongosh commands, CRUD, operators, drivers and ODMs.",
        "author": "Vikas Patel",
        "minutes": 3
      },
      {
        "slug": "mongoose",
        "title": "Mongoose",
        "description": "Schemas, models, CRUD, validation, hooks, virtuals, population, indexes and best practices.",
        "author": "Vikas Patel",
        "minutes": 4
      },
      {
        "slug": "mvc-architecture",
        "title": "MVC Architecture and Backend Concepts",
        "description": "Monolith vs microservices, MVC, routers, method-override, relationships, middleware and validation with Joi.",
        "author": "Vikas Patel",
        "minutes": 3
      },
      {
        "slug": "cookies-and-sessions",
        "title": "Cookies and Sessions",
        "description": "Cookies, signed cookies, stateless vs stateful HTTP, express-session and an MVC auth flow.",
        "author": "Vikas Patel",
        "minutes": 4
      },
      {
        "slug": "authentication-jwt",
        "title": "Authentication, Hashing and JWT",
        "description": "Authentication vs authorization, hashing, salts, bcrypt and JWT-based auth with middleware.",
        "author": "Vikas Patel",
        "minutes": 4
      },
      {
        "slug": "passport-authentication",
        "title": "Passport.js Authentication",
        "description": "Session-based login with Passport, passport-local and passport-local-mongoose, step by step.",
        "author": "Vikas Patel",
        "minutes": 3
      }
    ]
  },
  {
    "id": "cs-fundamentals",
    "title": "CS fundamentals",
    "description": "The OS, networking, DBMS and system design questions asked in placement interviews.",
    "notes": [
      {
        "slug": "operating-systems",
        "title": "Operating Systems",
        "description": "Processes and threads, CPU scheduling, synchronization, deadlocks, memory management, virtual memory, file systems and disk scheduling, with interview questions.",
        "author": "Bitwise School",
        "minutes": 10
      },
      {
        "slug": "computer-networks",
        "title": "Computer Networks",
        "description": "OSI and TCP/IP models, IP addressing and subnetting, TCP vs UDP, the three-way handshake, DNS, HTTP and HTTPS, and what happens when you type a URL, with interview questions.",
        "author": "Bitwise School",
        "minutes": 9
      },
      {
        "slug": "dbms-sql",
        "title": "DBMS and SQL",
        "description": "Keys, ER modelling, normalization, SQL joins and queries, transactions and ACID, isolation levels, indexing, and SQL vs NoSQL, with interview questions.",
        "author": "Bitwise School",
        "minutes": 9
      },
      {
        "slug": "system-design",
        "title": "System Design Basics",
        "description": "A framework for system design interviews, plus scaling, load balancing, caching, databases, sharding, queues, rate limiting and a full URL-shortener walkthrough.",
        "author": "Bitwise School",
        "minutes": 8
      }
    ]
  }
];

export const allNotes = noteCategories.flatMap((category) => category.notes.map((note) => ({ ...note, category })));

export const getNote = (slug: string | undefined) => allNotes.find((note) => note.slug === slug);
