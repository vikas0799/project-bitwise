// One catalog for every page that lists courses (home, /courses, /courses/:id).
// Syllabi are standard outlines; edit them to match what you teach.

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type CourseCategory = 'ai' | 'programming' | 'web' | 'dsa' | 'backend';

export interface Course {
  id: string;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  level: CourseLevel;
  // null while a course is on the waitlist and fees are not announced yet
  price: number | null;
  status: 'open' | 'waitlist';
  category: CourseCategory;
  prerequisites?: string;
  cover: { from: string; to: string; symbol: string };
  outcomes: string[];
  syllabus: { title: string; topics: string[] }[];
  // Optional extras shown on the course page
  tools?: string[];
  projects?: { title: string; text: string }[];
}

export const courses: Course[] = [
  {
    id: 'generative-ai',
    title: 'Generative AI Engineering: Complete Course',
    tagline: 'The full GenAI course: LLMs, RAG, agents, MCP and production AI',
    description:
      'Go from calling an LLM API to shipping production AI systems. Build chatbots, RAG over your own data, tool-using agents, voice agents and MCP servers, then learn to evaluate, secure, deploy and fine-tune them. Project-first, in Python.',
    duration: 'Batch dates soon',
    level: 'Intermediate',
    price: null,
    status: 'waitlist',
    category: 'ai',
    prerequisites: 'Python basics (variables, functions, loops) and a little comfort with APIs. Python for AI is revised in module 1.',
    cover: { from: '#0A1633', to: '#0052CC', symbol: 'GenAI' },
    outcomes: [
      'Build LLM apps with streaming, structured outputs and tool calling',
      'Ship RAG that answers from your own documents with citations',
      'Design multi-step and multi-agent workflows with LangGraph and MCP',
      'Add memory, voice and vision to AI assistants',
      'Evaluate, trace, secure and cost-optimise AI in production',
      'Know when to prompt, when to use RAG and when to fine-tune',
    ],
    syllabus: [
      {
        title: 'Python and LLM foundations',
        topics: [
          'Python for AI: typing, virtual environments and async basics',
          'Data models and validation with Pydantic',
          'How LLMs work: tokens, context windows and sampling',
          'OpenAI, Gemini and Claude APIs side by side',
          'Multi-turn chat and conversation history',
          'Prompt engineering: zero-shot, few-shot and chain of thought',
          'Structured outputs with JSON schema',
          'Context engineering: what to put in the prompt and why',
        ],
      },
      {
        title: 'Building LLM applications',
        topics: [
          'FastAPI backends for AI features',
          'Function calling and tool use',
          'Streaming responses to the browser (SSE)',
          'Retries, timeouts and model fallbacks',
          'Embeddings and semantic search',
          'Vector databases: pgvector, ChromaDB and Pinecone',
          'Summarisation, classification and routing utilities',
        ],
      },
      {
        title: 'Retrieval-augmented generation (RAG) in depth',
        topics: [
          'Document loading, parsing and chunking strategies',
          'Hybrid search (keyword + vector) and reranking',
          'Query rewriting and multi-query retrieval',
          'LangChain and LlamaIndex pipelines',
          'Grounded answers with citations',
          'When you do not need a vector DB: long context and structured search',
          'Scaling ingestion with background queues',
          'Evaluating RAG with RAGAS and failure analysis',
        ],
      },
      {
        title: 'AI agents and the Model Context Protocol',
        topics: [
          'The agent loop: plan, act, observe',
          'Designing good tools and sandboxed code execution',
          'Stateful workflows with LangGraph',
          'Multi-agent patterns: planner, worker and reviewer',
          'OpenAI Agents SDK and Claude Agent SDK',
          'Model Context Protocol (MCP): using and building servers',
          'Human-in-the-loop approvals and safe actions',
        ],
      },
      {
        title: 'Memory, vision and voice',
        topics: [
          'Short-term and long-term memory for assistants',
          'Knowledge graphs for memory with Neo4j',
          'Vision models and document understanding',
          'Voice agents: speech-to-text → LLM → text-to-speech',
          'Image generation basics',
        ],
      },
      {
        title: 'Production AI engineering',
        topics: [
          'Evals: golden datasets and LLM-as-judge',
          'Tracing and observability with Langfuse and LangSmith',
          'Guardrails, prompt injection and the OWASP Top 10 for LLMs',
          'Cost and latency: caching, batching and model routing',
          'Running open models locally with Ollama',
          'Deploying AI services with Docker to the cloud',
        ],
      },
      {
        title: 'Model internals and fine-tuning',
        topics: [
          'Neural networks and PyTorch training loops, briefly',
          'Transformers and attention, explained visually',
          'Tokenizers, embeddings and the KV cache',
          'Prompting vs RAG vs fine-tuning: choosing well',
          'LoRA and QLoRA fine-tuning of open models',
          'Hugging Face Hub and open-weight models',
        ],
      },
    ],
    tools: ['Python', 'FastAPI', 'Pydantic', 'OpenAI API', 'Claude API', 'Gemini API', 'LangChain', 'LlamaIndex', 'LangGraph', 'MCP', 'pgvector', 'ChromaDB', 'Pinecone', 'Hugging Face', 'Ollama', 'Langfuse', 'Docker'],
    projects: [
      { title: 'Chat with your documents', text: 'Upload PDFs and notes, ask questions and get answers with page-level citations.' },
      { title: 'AI customer support agent', text: 'Classifies tickets, answers from the help docs and hands over to a human when unsure.' },
      { title: 'Research assistant with web search', text: 'Searches the web, reads sources and writes a cited answer, streamed live.' },
      { title: 'Coding agent', text: 'Reads a repository, edits files and runs the tests in a sandbox until they pass.' },
      { title: 'Pull request reviewer', text: 'Reviews GitHub pull requests against your team’s style guide and posts inline comments.' },
      { title: 'Voice interview practice bot', text: 'Asks interview questions by voice and scores answers against a rubric.' },
    ],
  },
  {
    id: 'full-stack-ai',
    title: 'Full Stack Web Development with AI',
    tagline: 'TypeScript, React, Next.js and Node, with AI features built in',
    description:
      'A complete, modern full-stack course: web fundamentals, JavaScript and TypeScript, React and Next.js, Node.js backends with SQL and NoSQL databases, then AI features inside your apps, and DevOps to ship them. You finish with deployed, AI-powered projects.',
    duration: 'Batch dates soon',
    level: 'Beginner',
    price: null,
    status: 'waitlist',
    category: 'web',
    prerequisites: 'None. We start from how the web works; a laptop and a few hours a day are enough.',
    cover: { from: '#003584', to: '#4D86F5', symbol: 'Web+AI' },
    outcomes: [
      'Build responsive, accessible front ends with React, Next.js and Tailwind',
      'Design REST APIs with Node.js, PostgreSQL and MongoDB',
      'Add login, payments, file uploads and real-time features',
      'Put AI inside your apps: chat, RAG over app data and AI actions',
      'Test, containerise and deploy with CI/CD',
      'Graduate with a portfolio of deployed full-stack projects',
    ],
    syllabus: [
      {
        title: 'Web foundations and tools',
        topics: [
          'How the web works: HTTP, DNS and the browser',
          'HTML5 semantics and accessibility',
          'CSS: box model, Flexbox, Grid and responsive design',
          'The terminal, Git and GitHub',
          'Deploying your first site',
        ],
      },
      {
        title: 'JavaScript in depth',
        topics: [
          'Values, types, scope, closures and this',
          'Arrays and objects in practice',
          'The DOM, events and browser APIs',
          'Promises, async/await and fetch',
          'Modules and tooling: npm and Vite',
          'The event loop, explained',
        ],
      },
      {
        title: 'TypeScript and React',
        topics: [
          'TypeScript essentials for real projects',
          'Components, props, state and hooks',
          'Routing, forms and validation',
          'Data fetching and caching with TanStack Query',
          'State management with Context and Zustand',
          'Tailwind CSS and component libraries',
        ],
      },
      {
        title: 'Backend engineering with Node.js',
        topics: [
          'Node.js and Express, the right way',
          'REST API design and validation with Zod',
          'PostgreSQL, SQL and Prisma',
          'MongoDB and Mongoose',
          'Authentication: sessions, JWT and OAuth login',
          'File uploads, emails and background jobs',
          'Caching with Redis',
        ],
      },
      {
        title: 'Full stack with Next.js',
        topics: [
          'App Router, server components and server actions',
          'Rendering: SSR, SSG and ISR',
          'Payments with Razorpay and webhooks',
          'Real-time features with WebSockets',
          'Testing with Vitest and Playwright',
        ],
      },
      {
        title: 'AI integration',
        topics: [
          'Calling LLM APIs safely from your backend',
          'Streaming AI responses into the UI',
          'Chat with your app’s data using RAG',
          'Tool calling: letting AI take actions in your app',
          'Vercel AI SDK, rate limits and cost control',
          'Using AI coding assistants well (and knowing their limits)',
        ],
      },
      {
        title: 'DevOps and shipping',
        topics: [
          'Docker for web apps',
          'CI/CD with GitHub Actions',
          'Deploying to Vercel, Render and AWS',
          'Environment variables, logging and monitoring',
          'Web security basics: the OWASP Top 10',
          'Portfolio, resume and interview preparation',
        ],
      },
    ],
    tools: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'MongoDB', 'Redis', 'OpenAI API', 'Vercel AI SDK', 'Docker', 'GitHub Actions'],
    projects: [
      { title: 'Project management SaaS', text: 'Teams, roles, login and Razorpay subscriptions, built with Next.js and PostgreSQL.' },
      { title: 'Real-time chat app', text: 'Rooms, typing indicators and online status over WebSockets.' },
      { title: 'E-commerce store', text: 'Catalogue, cart, payments, orders and an admin dashboard.' },
      { title: 'AI resume reviewer', text: 'Upload a resume and get structured, job-specific feedback from an LLM.' },
      { title: 'AI assistant inside a dashboard', text: 'Ask questions about your app’s own data and let the assistant take safe actions.' },
    ],
  },
  {
    id: 'applied-ai',
    title: 'Applied AI & Machine Learning',
    tagline: 'Machine learning that solves real problems',
    description: 'Go from data to deployed models: Python for data, classical machine learning, deep learning with PyTorch, and fine-tuning pre-trained models.',
    duration: 'Batch dates soon',
    level: 'Intermediate',
    price: null,
    status: 'waitlist',
    category: 'ai',
    prerequisites: 'Python basics and school-level maths (the rest is taught in the course).',
    cover: { from: '#0F172A', to: '#1F66E5', symbol: 'ML' },
    outcomes: [
      'Clean and explore real datasets with Pandas',
      'Train and evaluate machine learning models',
      'Build deep learning models with PyTorch',
      'Fine-tune a pre-trained model and serve it as an API',
    ],
    syllabus: [
      { title: 'Python for data', topics: ['NumPy and Pandas', 'Data cleaning', 'Visualisation', 'Statistics you actually need'] },
      { title: 'Machine learning', topics: ['Regression and classification', 'Model evaluation', 'Feature engineering', 'scikit-learn pipelines'] },
      { title: 'Deep learning', topics: ['Neural network basics', 'PyTorch', 'CNNs for images', 'Transformers for text'] },
      { title: 'Applied projects', topics: ['Fine-tuning with Hugging Face', 'Serving a model as an API', 'MLOps basics', 'Capstone project'] },
    ],
  },
  {
    id: 'forward-deployed-engineer',
    title: 'Forward Deployed Engineer Track',
    tagline: 'Full stack + AI + solving problems with clients',
    description: 'Train for one of the hottest roles in tech: engineers who work with customers to ship software and AI solutions on real data, end to end.',
    duration: 'Batch dates soon',
    level: 'Advanced',
    price: null,
    status: 'waitlist',
    category: 'ai',
    prerequisites: 'Solid programming in one language; full-stack basics help.',
    cover: { from: '#0A2A66', to: '#1F66E5', symbol: 'FDE' },
    outcomes: [
      'Turn a vague client problem into a clear technical plan',
      'Build full-stack apps and integrations that use AI',
      'Work with messy real-world data and legacy systems',
      'Demo, explain trade-offs and support what you ship',
    ],
    syllabus: [
      { title: 'Full-stack foundations', topics: ['TypeScript and React', 'Node.js APIs', 'SQL and data modelling', 'Authentication and integrations'] },
      { title: 'AI integration', topics: ['LLM APIs and prompting', 'RAG over company data', 'Agents and automations', 'Evaluations'] },
      { title: 'Working with customers', topics: ['Scoping problems', 'Writing technical proposals', 'Demos and communication', 'Handling feedback and changing requirements'] },
      { title: 'Deploy and support', topics: ['Cloud deployment', 'Webhooks and third-party APIs', 'Debugging in production', 'Capstone: solve a real client problem end to end'] },
    ],
  },
  {
    id: 'system-design',
    title: 'System Design: HLD and LLD',
    tagline: 'Design systems that scale, and explain them in interviews',
    description:
      'Learn how real systems are built: the building blocks of scalable backends, distributed systems trade-offs, object-oriented low-level design, classic high-level design case studies and how to design AI systems, with mock interviews throughout.',
    duration: 'Batch dates soon',
    level: 'Advanced',
    price: null,
    status: 'waitlist',
    category: 'backend',
    prerequisites: 'Comfort in one programming language and basic backend knowledge (APIs and a database).',
    cover: { from: '#1E2A47', to: '#0043A8', symbol: 'HLD' },
    outcomes: [
      'Estimate scale and pick the right building blocks',
      'Reason about consistency, availability and partitioning',
      'Write clean object-oriented designs with SOLID and patterns',
      'Design well-known systems end to end and defend the trade-offs',
      'Design AI-heavy systems: LLM serving, RAG and vector search at scale',
      'Handle system design interview rounds with a clear framework',
    ],
    syllabus: [
      {
        title: 'Foundations',
        topics: [
          'Scalability, latency, throughput and availability',
          'Back-of-the-envelope estimation',
          'Networking for designers: DNS, TCP/UDP, HTTP and CDNs',
          'API styles: REST, gRPC, GraphQL and WebSockets',
        ],
      },
      {
        title: 'Building blocks',
        topics: [
          'Load balancers and reverse proxies',
          'Caching strategies, eviction and Redis',
          'SQL vs NoSQL, indexes and query patterns',
          'Replication, partitioning and sharding',
          'CAP theorem and consistency models',
          'Message queues, pub/sub and Kafka',
          'Rate limiting and consistent hashing',
          'Blob storage and search indexes',
        ],
      },
      {
        title: 'Distributed systems in practice',
        topics: [
          'Monoliths, microservices and when to split',
          'API gateways and service discovery',
          'Distributed transactions and the saga pattern',
          'Idempotency, retries and circuit breakers',
          'Observability: logs, metrics and traces',
        ],
      },
      {
        title: 'Low-level design',
        topics: [
          'OOP and the SOLID principles',
          'Design patterns: factory, builder, strategy, observer and more',
          'Class diagrams and modelling requirements',
          'Concurrency basics: threads, locks and race conditions',
          'LLD problems: parking lot, elevator, Splitwise and movie booking',
        ],
      },
      {
        title: 'High-level design case studies',
        topics: [
          'URL shortener',
          'Chat and messaging (WhatsApp)',
          'News feed (Instagram)',
          'Video streaming (YouTube)',
          'Ride hailing (Uber)',
          'Payments and notification systems',
        ],
      },
      {
        title: 'Designing AI systems',
        topics: [
          'Serving LLMs: batching, caching and streaming',
          'RAG architecture at scale',
          'Choosing and scaling a vector database',
          'Cost, latency and reliability for AI features',
        ],
      },
      {
        title: 'Interview practice',
        topics: [
          'A step-by-step framework for design interviews',
          'Writing a design document',
          'Mock HLD and LLD interviews with feedback',
        ],
      },
    ],
    tools: ['Redis', 'Kafka', 'PostgreSQL', 'Cassandra', 'Nginx', 'Docker', 'Excalidraw'],
    projects: [
      { title: 'URL shortener', text: 'A design document plus a working prototype with caching and analytics.' },
      { title: 'Distributed rate limiter', text: 'Token bucket and sliding window limiters backed by Redis.' },
      { title: 'LLD implementations', text: 'Parking lot and movie booking systems coded with clean OOP and patterns.' },
    ],
  },
  {
    id: 'spring-boot-ai',
    title: 'Java Backend with Spring Boot & Spring AI',
    tagline: 'Production Java backends, microservices and AI features',
    description:
      'Build production-grade backends in Java: modern Java, Spring Boot, JPA, security, caching, messaging and microservices, deployed on AWS, then add AI features such as chat, RAG and tool calling with Spring AI.',
    duration: 'Batch dates soon',
    level: 'Intermediate',
    price: null,
    status: 'waitlist',
    category: 'backend',
    prerequisites: 'Core Java (classes, collections, exceptions). Our Java Full Course covers this.',
    cover: { from: '#0043A8', to: '#8AB2FF', symbol: 'Spring' },
    outcomes: [
      'Build clean, tested REST APIs with Spring Boot',
      'Model data with PostgreSQL and Spring Data JPA',
      'Secure APIs with Spring Security, JWT and OAuth2',
      'Scale with Redis, Kafka and microservices',
      'Deploy Java services with Docker on AWS',
      'Add LLM chat, RAG and tool calling with Spring AI',
    ],
    syllabus: [
      {
        title: 'Modern Java for backend',
        topics: [
          'Java 21: records, streams, lambdas and Optional',
          'Collections and generics in practice',
          'Exceptions and logging',
          'Maven and Gradle',
          'Unit testing with JUnit and Mockito',
        ],
      },
      {
        title: 'Spring Boot core',
        topics: [
          'Inversion of control and dependency injection',
          'Auto-configuration and starters',
          'REST controllers, DTOs and validation',
          'Global exception handling',
          'Profiles and configuration',
        ],
      },
      {
        title: 'Data with JPA',
        topics: [
          'PostgreSQL and SQL essentials',
          'Spring Data JPA and Hibernate',
          'Relationships and the N+1 problem',
          'Transactions and isolation',
          'Database migrations with Flyway',
        ],
      },
      {
        title: 'Security',
        topics: ['Spring Security fundamentals', 'JWT authentication', 'OAuth2 login (Google, GitHub)', 'Role-based access control'],
      },
      {
        title: 'Production and microservices',
        topics: [
          'Caching with Redis',
          'Event-driven services with Kafka',
          'Microservices: API gateway and service discovery',
          'Resilience with Resilience4j',
          'Integration tests with Testcontainers',
          'Docker and deploying to AWS (EC2, RDS, S3)',
        ],
      },
      {
        title: 'AI with Spring AI',
        topics: [
          'Spring AI with OpenAI and local models (Ollama)',
          'Prompt templates and structured output',
          'RAG with pgvector',
          'Tool calling from Java',
          'Building an MCP server with Spring AI',
        ],
      },
    ],
    tools: ['Java 21', 'Spring Boot', 'Spring Data JPA', 'Spring Security', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'AWS', 'Spring AI', 'Ollama'],
    projects: [
      { title: 'E-commerce microservices', text: 'Products, orders and payments as separate services behind an API gateway.' },
      { title: 'URL shortener with analytics', text: 'High-read API with Redis caching and Kafka click events.' },
      { title: 'AI document Q&A service', text: 'Upload documents and ask questions, using Spring AI and pgvector.' },
    ],
  },
  {
    id: 'devops-cloud',
    title: 'DevOps & Cloud: Docker, Kubernetes and AWS',
    tagline: 'Linux, CI/CD, containers, Kubernetes, AWS and Terraform',
    description:
      'Learn to ship and run software the way teams do in production: Linux and networking, Git and CI/CD, Docker and Kubernetes, AWS, infrastructure as code with Terraform, and monitoring, ending with deploying an AI app.',
    duration: 'Batch dates soon',
    level: 'Intermediate',
    price: null,
    status: 'waitlist',
    category: 'backend',
    prerequisites: 'Basic programming and comfort using a computer; no Linux experience needed.',
    cover: { from: '#0A1633', to: '#0052CC', symbol: 'DevOps' },
    outcomes: [
      'Work confidently in Linux and write bash scripts',
      'Automate builds, tests and deployments with CI/CD',
      'Containerise apps with Docker and run them on Kubernetes',
      'Design and run cloud setups on AWS',
      'Provision infrastructure with Terraform',
      'Monitor services and respond to incidents',
    ],
    syllabus: [
      {
        title: 'Linux and networking',
        topics: [
          'The shell, files and permissions',
          'Processes, services and systemd',
          'Bash scripting',
          'Networking: IP, DNS, ports and SSH',
          'Nginx as a web server and reverse proxy',
        ],
      },
      {
        title: 'Git and CI/CD',
        topics: ['Git workflows for teams', 'GitHub Actions pipelines', 'Automated tests and linting in CI', 'Releases and rollbacks'],
      },
      {
        title: 'Containers',
        topics: ['Docker images and containers', 'Writing Dockerfiles and multi-stage builds', 'Docker Compose for multi-service apps', 'Container registries'],
      },
      {
        title: 'Kubernetes',
        topics: ['Pods, deployments and services', 'ConfigMaps and secrets', 'Ingress and TLS', 'Helm charts', 'Autoscaling and rolling updates'],
      },
      {
        title: 'Cloud with AWS',
        topics: ['IAM and account security', 'EC2, S3 and RDS', 'VPCs and networking', 'Load balancers and auto scaling', 'Serverless with Lambda', 'Keeping cloud costs low'],
      },
      {
        title: 'Infrastructure as code and observability',
        topics: [
          'Terraform basics and modules',
          'Metrics with Prometheus and Grafana',
          'Centralised logging',
          'Alerts and incident response',
          'Deploying an AI app: GPUs, model serving and MLOps basics',
        ],
      },
    ],
    tools: ['Linux', 'Bash', 'Git', 'GitHub Actions', 'Docker', 'Kubernetes', 'Helm', 'AWS', 'Terraform', 'Nginx', 'Prometheus', 'Grafana'],
    projects: [
      { title: 'CI/CD to AWS', text: 'Every push tests, builds and deploys a full-stack app to AWS automatically.' },
      { title: 'Kubernetes deployment', text: 'A multi-service app on Kubernetes with Helm, ingress, TLS and autoscaling.' },
      { title: 'Infrastructure with Terraform', text: 'Network, servers and database provisioned from code, with monitoring dashboards.' },
    ],
  },
  {
    id: 'full-stack',
    title: 'Full Stack Web Development',
    tagline: 'MERN stack, from first page to deployed app',
    description: 'Become a complete web developer with the MERN stack (MongoDB, Express, React, Node.js). Build real projects and deploy them.',
    duration: '5 months',
    level: 'Intermediate',
    price: 20000,
    status: 'open',
    category: 'web',
    cover: { from: '#003584', to: '#4D86F5', symbol: 'MERN' },
    outcomes: [
      'Build responsive websites with HTML, CSS and JavaScript',
      'Create React front ends that talk to your own APIs',
      'Design REST APIs with Node.js, Express and MongoDB',
      'Deploy a full-stack project you can show in interviews',
    ],
    syllabus: [
      { title: 'Web fundamentals', topics: ['HTML5 and semantic markup', 'CSS3, Flexbox and Grid', 'Responsive design', 'JavaScript (ES6+)', 'Git and GitHub'] },
      { title: 'Front end with React', topics: ['Components, props and state', 'Hooks', 'Routing', 'Forms and API calls', 'Tailwind CSS'] },
      { title: 'Back end with Node.js', topics: ['Express and REST APIs', 'Middleware', 'Authentication with JWT', 'MongoDB and Mongoose'] },
      { title: 'Ship it', topics: ['Full-stack capstone project', 'Deployment', 'Environment variables and security basics', 'Portfolio and interview prep'] },
    ],
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    tagline: 'Problem solving for coding interviews',
    description: 'In-depth DSA with problem-solving patterns for coding interviews and contests, taught in C++ or Java.',
    duration: '5 months',
    level: 'Intermediate',
    price: 20000,
    status: 'open',
    category: 'dsa',
    cover: { from: '#0F172A', to: '#1F66E5', symbol: 'O(n)' },
    outcomes: [
      'Analyse time and space complexity',
      'Recognise common problem-solving patterns',
      'Solve tree, graph and dynamic programming problems',
      'Explain your approach clearly in interviews',
    ],
    syllabus: [
      { title: 'Foundations', topics: ['Time and space complexity', 'Arrays and strings', 'Recursion and backtracking'] },
      { title: 'Core patterns', topics: ['Searching and sorting', 'Two pointers and sliding window', 'Hashing', 'Prefix sums'] },
      { title: 'Data structures', topics: ['Linked lists', 'Stacks and queues', 'Trees and BSTs', 'Heaps and priority queues'] },
      { title: 'Advanced problem solving', topics: ['Graphs: BFS, DFS, shortest paths', 'Greedy algorithms', 'Dynamic programming', 'Mock interviews'] },
    ],
  },
  {
    id: 'cpp',
    title: 'C++ Programming Masterclass',
    tagline: 'From basics to OOP and the STL',
    description: 'Master C++ from the basics to object-oriented programming and the STL, with hands-on practice sessions.',
    duration: '5 months',
    level: 'All Levels',
    price: 20000,
    status: 'open',
    category: 'programming',
    cover: { from: '#0A2A66', to: '#1F66E5', symbol: 'C++' },
    outcomes: [
      'Write clean C++ programs from scratch',
      'Use pointers, references and dynamic memory safely',
      'Apply object-oriented design in C++',
      'Use the STL confidently for problem solving',
    ],
    syllabus: [
      { title: 'C++ foundations', topics: ['Setup and first programs', 'Data types and operators', 'Conditions and loops', 'Input and output'] },
      { title: 'Functions and memory', topics: ['Functions and recursion', 'Arrays and strings', 'Pointers and references', 'Dynamic memory'] },
      { title: 'Object-oriented C++', topics: ['Classes and objects', 'Constructors and destructors', 'Inheritance and polymorphism', 'Templates'] },
      { title: 'STL and practice', topics: ['Vectors, maps and sets', 'Stacks and queues', 'STL algorithms', 'Practice problems and a mini project'] },
    ],
  },
  {
    id: 'java',
    title: 'Java Full Course',
    tagline: 'Core Java, OOP and back-end basics',
    description: 'Core Java, object-oriented programming, collections and your first steps into back-end development.',
    duration: '5 months',
    level: 'Beginner',
    price: 20000,
    status: 'open',
    category: 'programming',
    cover: { from: '#1E2A47', to: '#0043A8', symbol: 'Java' },
    outcomes: [
      'Write and debug Java programs confidently',
      'Model real problems with classes and interfaces',
      'Use the Collections framework effectively',
      'Connect Java to a database and build simple APIs',
    ],
    syllabus: [
      { title: 'Java basics', topics: ['JDK and IDE setup', 'Data types and operators', 'Control flow', 'Methods, arrays and strings'] },
      { title: 'Object-oriented Java', topics: ['Classes and objects', 'Inheritance', 'Interfaces and abstract classes', 'Exception handling'] },
      { title: 'Collections and more', topics: ['List, Set and Map', 'Generics', 'File I/O', 'Multithreading basics'] },
      { title: 'Java for the back end', topics: ['JDBC with MySQL', 'Introduction to Spring Boot', 'Building a REST API', 'Capstone project'] },
    ],
  },
  {
    id: 'python',
    title: 'Python for Beginners',
    tagline: 'Your first programming language',
    description: 'Start your programming journey with Python. Great for beginners and a first step towards data science.',
    duration: '5 months',
    level: 'Beginner',
    price: 20000,
    status: 'open',
    category: 'programming',
    cover: { from: '#0043A8', to: '#8AB2FF', symbol: 'py' },
    outcomes: [
      'Think like a programmer and break problems down',
      'Use Python data structures fluently',
      'Write scripts that automate everyday tasks',
      'Work with data using NumPy and Pandas',
    ],
    syllabus: [
      { title: 'Python basics', topics: ['Setup and first programs', 'Variables and types', 'Conditions and loops', 'Functions'] },
      { title: 'Data structures', topics: ['Lists and tuples', 'Dictionaries and sets', 'String handling', 'Comprehensions'] },
      { title: 'Going further', topics: ['Object-oriented Python', 'Modules and packages', 'File handling', 'Error handling'] },
      { title: 'Python in practice', topics: ['Working with APIs', 'NumPy and Pandas basics', 'Automation scripts', 'Mini projects'] },
    ],
  },
  {
    id: 'react',
    title: 'React.js Bootcamp',
    tagline: 'Modern front-end development',
    description: 'Master modern front-end development with React, hooks, routing and state management.',
    duration: '5 months',
    level: 'Intermediate',
    price: 20000,
    status: 'open',
    category: 'web',
    cover: { from: '#0A1633', to: '#0052CC', symbol: '</>' },
    outcomes: [
      'Build fast, component-based user interfaces',
      'Manage state with hooks, context and Redux Toolkit',
      'Integrate REST APIs cleanly',
      'Deploy production-ready React apps',
    ],
    syllabus: [
      { title: 'JavaScript for React', topics: ['ES6+ essentials', 'Modules', 'async/await and fetch', 'Array methods'] },
      { title: 'React core', topics: ['JSX and components', 'Props and state', 'Events and forms', 'useState and useEffect'] },
      { title: 'Real apps', topics: ['React Router', 'Context and Redux Toolkit', 'Custom hooks', 'API integration'] },
      { title: 'Production React', topics: ['Performance basics', 'Testing introduction', 'Tailwind CSS', 'Deployment and capstone'] },
    ],
  },
];

export const getCourse = (id: string | undefined) => courses.find((c) => c.id === id);

export const formatPrice = (price: number | null) => (price === null ? 'Launching soon' : `₹${price.toLocaleString('en-IN')}`);

export const openCourses = courses.filter((c) => c.status === 'open');
export const aiCourses = courses.filter((c) => c.category === 'ai');
// New courses taking waitlist sign-ups (AI tracks first)
export const upcomingCourses = courses.filter((c) => c.status === 'waitlist');
