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
