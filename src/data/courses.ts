// One catalog for every page that lists courses (home, /courses, /courses/:id).
// Syllabi are standard outlines; edit them to match what you teach.

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type CourseCategory = 'ai' | 'programming' | 'web' | 'dsa';

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
}

export const courses: Course[] = [
  {
    id: 'generative-ai',
    title: 'Generative AI Engineering',
    tagline: 'LLMs, RAG and AI agents, from prompt to production',
    description: 'Build real products on top of large language models: prompting, retrieval-augmented generation, tool calling, agents and evaluations, then ship them.',
    duration: 'Batch dates soon',
    level: 'Intermediate',
    price: null,
    status: 'waitlist',
    category: 'ai',
    prerequisites: 'Comfort with Python or JavaScript basics and APIs.',
    cover: { from: '#4C1D95', to: '#DB2777', symbol: 'GenAI' },
    outcomes: [
      'Build chat and search apps that answer from your own documents',
      'Use tool calling to let models take real actions',
      'Design, test and evaluate AI agents safely',
      'Deploy AI apps with sensible cost and latency',
    ],
    syllabus: [
      { title: 'LLM foundations', topics: ['How LLMs work: tokens, embeddings and context', 'Prompt engineering patterns', 'Working with LLM APIs', 'Structured outputs'] },
      { title: 'Retrieval-augmented generation', topics: ['Embeddings and vector databases', 'Chunking and retrieval strategies', 'RAG over your own documents', 'Citations and grounding'] },
      { title: 'Agents and tools', topics: ['Tool and function calling', 'Agent loops and orchestration', 'Model Context Protocol (MCP) basics', 'Guardrails and human-in-the-loop'] },
      { title: 'Ship it', topics: ['Deploying AI apps', 'Evaluations and monitoring', 'Cost, latency and caching', 'Capstone: an AI product for a real use case'] },
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
    cover: { from: '#134E4A', to: '#0D9488', symbol: 'ML' },
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
    cover: { from: '#0F172A', to: '#2563EB', symbol: 'FDE' },
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
    id: 'full-stack',
    title: 'Full Stack Web Development',
    tagline: 'MERN stack, from first page to deployed app',
    description: 'Become a complete web developer with the MERN stack (MongoDB, Express, React, Node.js). Build real projects and deploy them.',
    duration: '5 months',
    level: 'Intermediate',
    price: 20000,
    status: 'open',
    category: 'web',
    cover: { from: '#064E3B', to: '#059669', symbol: 'MERN' },
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
    cover: { from: '#4C1D95', to: '#7C3AED', symbol: 'O(n)' },
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
    cover: { from: '#0A2A66', to: '#0052CC', symbol: 'C++' },
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
    cover: { from: '#9A3412', to: '#EA580C', symbol: 'Java' },
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
    cover: { from: '#713F12', to: '#CA8A04', symbol: 'py' },
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
    cover: { from: '#083344', to: '#0891B2', symbol: '</>' },
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
