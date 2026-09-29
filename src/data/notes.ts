// Generated from the frontmatter in src/content/notes/*.md.
// To add a note: create src/content/notes/<slug>.md with title/description/author
// frontmatter, then add its slug to a category below.

export interface NoteMeta {
  slug: string;
  title: string;
  description: string;
  author: string;
  minutes: number;
  recommended?: boolean;
}

export interface NoteCategory {
  id: string;
  title: string;
  description: string;
  notes: NoteMeta[];
}

export const noteCategories: NoteCategory[] = [
  {
    "id": "dsa-foundations",
    "title": "DSA: Foundations",
    "description": "Complexity, recursion, array patterns, binary search, sorting and the C++ STL you use in every problem.",
    "notes": [
      {
        "slug": "dsa-complexity",
        "title": "Time and Space Complexity (Big-O)",
        "description": "How to measure an algorithm with Big-O, the common complexity classes, rules for finding the complexity of loops and recursion, the master theorem and how input size tells you which approach will pass.",
        "author": "Bitwise School",
        "minutes": 5
      },
      {
        "slug": "dsa-recursion",
        "title": "Recursion and the Call Stack",
        "description": "How recursion works, the base case and the leap of faith, what happens on the call stack, recursion trees, fast power, common patterns and mistakes, with C++ code.",
        "author": "Bitwise School",
        "minutes": 4
      },
      {
        "slug": "dsa-arrays-patterns",
        "title": "Arrays: Prefix Sums, Two Pointers and Sliding Window",
        "description": "How arrays work in memory and the patterns that solve most array questions in O(n) (prefix sums, Kadane's algorithm, two pointers and sliding windows), with C++ code.",
        "author": "Bitwise School",
        "minutes": 6
      },
      {
        "slug": "dsa-binary-search",
        "title": "Binary Search and Binary Search on the Answer",
        "description": "Classic binary search, lower and upper bound, first and last occurrence, searching a rotated array, the C++ STL helpers and binary search on the answer for optimisation problems, with diagrams and C++ code.",
        "author": "Bitwise School",
        "minutes": 5
      },
      {
        "slug": "dsa-sorting",
        "title": "Sorting Algorithms Explained",
        "description": "Bubble, selection, insertion, merge, quick and counting sort with diagrams, C++ code, a complexity and stability table, and how to use std::sort with custom comparators.",
        "author": "Bitwise School",
        "minutes": 6
      },
      {
        "slug": "dsa-cpp-stl",
        "title": "C++ STL for DSA: Containers, Algorithms and Lambdas",
        "description": "The C++ STL you need for coding interviews: vector, deque, stack, queue, priority_queue, set, map and unordered_map, the key algorithms, lambdas and comparators, operation costs and common pitfalls.",
        "author": "Bitwise School",
        "minutes": 6
      }
    ]
  },
  {
    "id": "dsa-structures",
    "title": "DSA: Data structures",
    "description": "Linked lists, stacks, queues, hashing and heaps, with the patterns built on them.",
    "notes": [
      {
        "slug": "dsa-linked-list",
        "title": "Linked Lists",
        "description": "Singly, doubly and circular linked lists with diagrams: insert, delete, the dummy node trick, reversing a list, fast and slow pointers, cycle detection, merging and removing the nth node from the end, in C++.",
        "author": "Bitwise School",
        "minutes": 6
      },
      {
        "slug": "dsa-stack-queue",
        "title": "Stacks and Queues (plus Monotonic Stack)",
        "description": "Stacks (LIFO) and queues (FIFO) with diagrams, balanced parentheses, a circular queue, deque and sliding window maximum, the monotonic stack for next greater element, a queue from two stacks and a min stack, in C++.",
        "author": "Bitwise School",
        "minutes": 6
      },
      {
        "slug": "dsa-hashing",
        "title": "Hashing and Hash Tables",
        "description": "How hash tables give O(1) average lookups, hash functions, collisions with chaining and linear probing, load factor, map vs unordered_map, and the hashing patterns behind Two Sum, anagrams and consecutive sequences, in C++.",
        "author": "Bitwise School",
        "minutes": 5
      },
      {
        "slug": "dsa-heaps",
        "title": "Heaps and Priority Queues",
        "description": "Binary heaps stored in arrays, sift up and sift down with diagrams, a max-heap class, building a heap in O(n), heap sort, priority_queue in C++ and the heap patterns for top k, running median and merging k sorted lists.",
        "author": "Bitwise School",
        "minutes": 6
      }
    ]
  },
  {
    "id": "dsa-trees-graphs",
    "title": "DSA: Trees and graphs",
    "description": "Binary trees, BSTs, BFS, DFS, topological sort, shortest paths and minimum spanning trees.",
    "notes": [
      {
        "slug": "dsa-binary-trees",
        "title": "Binary Trees and Traversals",
        "description": "Tree terminology, types of binary trees, preorder, inorder, postorder and level order traversal with diagrams, recursive and iterative code, Morris traversal in O(1) space, and how to think about tree problems in C++.",
        "author": "Bitwise School",
        "minutes": 6
      },
      {
        "slug": "dsa-tree-problems",
        "title": "Tree Height, Diameter, Views and LCA",
        "description": "The binary tree patterns asked in interviews, with diagrams and C++ code: height and depth, balanced check, diameter, path sums and maximum path sum, left, right, top and bottom views, lowest common ancestor, building a tree from traversals and serialisation.",
        "author": "Bitwise School",
        "minutes": 7
      },
      {
        "slug": "dsa-bst",
        "title": "Binary Search Trees",
        "description": "The BST property, search, insert and delete with diagrams, validating a BST, kth smallest, LCA in a BST, building a balanced BST from a sorted array, floor and range sum, and why balanced trees such as AVL and red-black trees matter, in C++.",
        "author": "Bitwise School",
        "minutes": 6
      },
      {
        "slug": "dsa-graphs",
        "title": "Graphs: Representation, BFS, DFS and Topological Sort",
        "description": "Graph basics, adjacency lists and matrices, BFS and DFS with diagrams, connected components, grids as graphs, cycle detection in undirected and directed graphs, bipartite check and topological sort with Kahn's algorithm, in C++.",
        "author": "Bitwise School",
        "minutes": 7
      },
      {
        "slug": "dsa-shortest-paths-mst",
        "title": "Shortest Paths and Minimum Spanning Trees",
        "description": "Dijkstra with a priority queue, 0-1 BFS, Bellman-Ford and negative cycles, Floyd-Warshall, choosing the right shortest path algorithm, union-find (DSU), and Kruskal's and Prim's algorithms for minimum spanning trees, with diagrams and C++ code.",
        "author": "Bitwise School",
        "minutes": 7
      }
    ]
  },
  {
    "id": "dsa-paradigms",
    "title": "DSA: Problem-solving paradigms",
    "description": "Greedy algorithms, dynamic programming and backtracking: the ideas behind the hardest interview questions.",
    "notes": [
      {
        "slug": "dsa-greedy",
        "title": "Greedy Algorithms",
        "description": "When a greedy choice works and how to prove it with the exchange argument, with diagrams and C++ code for activity selection, merging intervals, minimum platforms, fractional knapsack, job sequencing, jump game and gas station, plus when greedy fails.",
        "author": "Bitwise School",
        "minutes": 6
      },
      {
        "slug": "dsa-dynamic-programming",
        "title": "Dynamic Programming",
        "description": "How to recognise and build DP solutions: memoisation and tabulation, states and transitions, with diagrams and C++ code for climbing stairs, house robber, coin change, LIS, grid paths, LCS, edit distance, 0/1 knapsack, subset sum and matrix chain multiplication.",
        "author": "Bitwise School",
        "minutes": 9
      },
      {
        "slug": "dsa-backtracking",
        "title": "Backtracking",
        "description": "The choose, explore, un-choose template for generating subsets, permutations and combinations, handling duplicates, pruning, N-Queens and word search, with decision-tree diagrams and C++ code.",
        "author": "Bitwise School",
        "minutes": 6
      }
    ]
  },
  {
    "id": "javascript",
    "title": "JavaScript",
    "description": "Core JavaScript topic by topic, from variables to the event loop, with diagrams, polyfills, machine coding problems and the top 100 interview questions.",
    "notes": [
      {
        "slug": "javascript-interview-questions",
        "title": "Top 100 JavaScript Interview Questions (with Answers)",
        "description": "The 15 must-prepare topics for product companies, then 100 hard JavaScript interview questions with short answers, verified outputs and links to detailed notes. Event loop, closures, this, prototypes, promises, polyfills, memory, modules, the DOM, coding problems and V8 internals.",
        "author": "Vikas Patel",
        "minutes": 18,
        "recommended": true
      },
      {
        "slug": "javascript-basics",
        "title": "JavaScript Basics: Variables, Types and Coercion",
        "description": "var, let and const, the eight data types, typeof, operators including ?? and ?., truthy and falsy values, == vs === and the tricky coercion outputs asked in interviews, loops and control flow.",
        "author": "Vikas Patel",
        "minutes": 5
      },
      {
        "slug": "javascript-execution-context",
        "title": "How JavaScript Runs: Execution Context, Hoisting and Scope",
        "description": "Execution contexts and their memory and execution phases, the call stack, hoisting of var, let, const and functions, the temporal dead zone, lexical environments, the scope chain and shadowing, with output questions.",
        "author": "Vikas Patel",
        "minutes": 5
      },
      {
        "slug": "javascript-functions-closures",
        "title": "Functions and Closures in JavaScript",
        "description": "Function declarations, expressions and arrow functions compared, parameters, callbacks and higher-order functions, IIFEs, closures with diagrams, private state, the loop pitfall, memory leaks, currying, infinite currying and memoisation.",
        "author": "Vikas Patel",
        "minutes": 4
      },
      {
        "slug": "javascript-objects-prototypes",
        "title": "Objects, Prototypes and Classes in JavaScript",
        "description": "Objects and destructuring, primitives vs objects, wrapper classes and autoboxing, the prototype chain with diagrams, Object.create, constructor functions, prototype vs __proto__, instanceof, classes, inheritance, private fields, static members and OOP in JavaScript.",
        "author": "Vikas Patel",
        "minutes": 6
      },
      {
        "slug": "javascript-this",
        "title": "The this Keyword: Bindings, call, apply and bind",
        "description": "How JavaScript decides what this refers to, with a decision diagram. Default, implicit, explicit and new binding, arrow functions, lost this in callbacks, call vs apply vs bind, polyfills for all three, and the classic output questions.",
        "author": "Vikas Patel",
        "minutes": 5
      },
      {
        "slug": "javascript-async",
        "title": "Async JavaScript: Promises, async/await and the Event Loop",
        "description": "Callbacks and callback hell, promise states with diagrams, creating and consuming promises, chaining, Promise.all, allSettled, race and any compared and implemented, async/await with error handling, the event loop with microtasks and macrotasks, and output questions.",
        "author": "Vikas Patel",
        "minutes": 8
      },
      {
        "slug": "javascript-dom-events",
        "title": "DOM, Events and Browser APIs",
        "description": "Selecting and changing the DOM, DOM vs BOM vs virtual DOM, event propagation with capture, target and bubble phases, stopPropagation vs preventDefault, target vs currentTarget, event delegation, debouncing and throttling with diagrams, storage, fetch, rendering 100,000 items and Web Workers.",
        "author": "Vikas Patel",
        "minutes": 8
      },
      {
        "slug": "shallow-vs-deep-copy",
        "title": "Shallow Copy vs Deep Copy in JavaScript",
        "description": "Copy by value vs copy by reference, shallow copies with spread, Object.assign and slice, deep copies with structuredClone, where JSON.parse(JSON.stringify()) fails, writing your own deep clone, and freeze vs seal vs preventExtensions.",
        "author": "Vikas Patel",
        "minutes": 5
      },
      {
        "slug": "javascript-machine-coding",
        "title": "JavaScript Machine Coding Round: Polyfills and Utilities",
        "description": "The problems asked in JavaScript machine coding rounds, solved and explained. Polyfills for map, filter, reduce and flat, debounce with leading, cancel and flush, once, memoize, curry, pipe and compose, deepEqual, flatten, groupBy, retry, timeouts, concurrency limits, a custom Promise, EventEmitter, LRU cache, rate limiter and UI problems.",
        "author": "Vikas Patel",
        "minutes": 13
      }
    ]
  },
  {
    "id": "backend",
    "title": "Backend: Node, Express, MongoDB and PostgreSQL",
    "description": "Build and explain a Node.js backend: Express APIs, server-side rendering, MongoDB and PostgreSQL, and secure authentication.",
    "notes": [
      {
        "slug": "nodejs-fundamentals",
        "title": "Node.js Fundamentals: Runtime, Modules, npm, Files and Streams",
        "description": "What Node.js is and how it runs JavaScript with V8 and libuv, blocking vs non-blocking code, LTS versions, npm and package.json, CommonJS vs ES modules, fs and path, a raw HTTP server, events, streams, environment variables and the Node event loop.",
        "author": "Vikas Patel",
        "minutes": 8
      },
      {
        "slug": "express-routing-middleware",
        "title": "Express.js: Routing, Middleware, REST APIs and MVC",
        "description": "Build REST APIs with Express 5. Routes and route parameters, req.params, req.query and req.body, status codes, REST design, routers, middleware with diagrams, body parsing, error handling in Express 5, validation, security middleware, MVC folder structure and monolith vs microservices.",
        "author": "Vikas Patel",
        "minutes": 10
      },
      {
        "slug": "server-side-rendering-ejs",
        "title": "Server-Side Rendering with EJS, and SSR vs CSR",
        "description": "Server-side vs client-side rendering with a timeline diagram, when to use each, hydration and hybrid rendering in Next.js. Then EJS with Express, every EJS tag, loops and conditions, partials and layouts, forms, render vs redirect, the Post/Redirect/Get pattern and XSS-safe output.",
        "author": "Vikas Patel",
        "minutes": 5
      },
      {
        "slug": "mongodb",
        "title": "MongoDB: Documents, CRUD, Queries, Indexes and Data Modelling",
        "description": "How MongoDB stores data as documents with a diagram, SQL vs NoSQL, setting up Atlas or a local server, mongosh commands, CRUD, query and update operators, sorting and pagination, indexes and explain, the aggregation pipeline, embedding vs referencing, and using MongoDB from Node.js.",
        "author": "Vikas Patel",
        "minutes": 7
      },
      {
        "slug": "mongoose",
        "title": "Mongoose: Schemas, Models, Validation and Relationships",
        "description": "Using MongoDB from Express with Mongoose. Connecting, schemas and types, validation, models and CRUD, update pitfalls, populate for relationships, hooks, methods, statics and virtuals, timestamps, indexes, lean queries, pagination, transactions and a complete API example.",
        "author": "Vikas Patel",
        "minutes": 7
      },
      {
        "slug": "postgresql-nodejs",
        "title": "PostgreSQL with Node.js: Tables, Joins, Queries and Transactions",
        "description": "Why PostgreSQL, setting it up, psql, data types and constraints, primary and foreign keys with a join diagram, INNER and LEFT JOIN, GROUP BY, indexes, JSONB, using pg from Node with a pool, parameterised queries and SQL injection, transactions, migrations, and Prisma or Drizzle.",
        "author": "Vikas Patel",
        "minutes": 8
      },
      {
        "slug": "authentication",
        "title": "Authentication in Node.js: Hashing, Cookies, Sessions, JWT and Passport",
        "description": "Authentication vs authorisation, password hashing with salt and bcrypt, cookies and their security flags, session-based login and token-based login with JWT (with sequence diagrams), access and refresh tokens, sessions vs JWT, Passport.js local and Google login, role-based access and a security checklist.",
        "author": "Vikas Patel",
        "minutes": 10
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

// Old lecture-wise notes, merged into topic-wise ones. Keeps shared links working.
export const noteAliases: Record<string, string> = {
  'javascript-revision': 'javascript-basics',
  'oop-in-javascript': 'javascript-objects-prototypes',
  'promises-prototypes-this': 'javascript-objects-prototypes',
  'javascript-interview-notes': 'javascript-machine-coding',
  'node-express-basics': 'nodejs-fundamentals',
  'express-middleware': 'express-routing-middleware',
  'mvc-architecture': 'express-routing-middleware',
  'ejs-templating': 'server-side-rendering-ejs',
  'ssr-vs-csr': 'server-side-rendering-ejs',
  'cookies-and-sessions': 'authentication',
  'authentication-jwt': 'authentication',
  'passport-authentication': 'authentication',
};

export const allNotes = noteCategories.flatMap((category) => category.notes.map((note) => ({ ...note, category })));

export const getNote = (slug: string | undefined) => allNotes.find((note) => note.slug === slug);
