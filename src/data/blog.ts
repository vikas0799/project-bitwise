// Blog posts. A post is published when src/content/blog/<id>.md exists;
// posts without a file show as "coming soon" and are not linked.
import { hasPost } from '../lib/content';

export type BlogCategory = 'Careers' | 'AI' | 'Programming' | 'DSA' | 'Web Development' | 'Data Science';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  readTime: string;
  // Last time the facts in the post were checked (YYYY-MM-DD)
  updated: string;
  author?: string;
  cover?: { from: string; to: string; symbol: string };
}

// Old URLs that now live under a readable slug.
export const blogAliases: Record<string, string> = {
  '1': 'getting-started-with-cpp',
};

export const blogPosts: BlogPost[] = [
  {
    id: 'dsa-roadmap',
    title: 'How to learn DSA for placements: a 16-week roadmap',
    excerpt: 'What to study in which order, how many problems are enough, how to practise so patterns stick, and the mistakes that waste months.',
    category: 'DSA',
    readTime: '6 min read',
    updated: '2026-09-28',
    author: 'Bitwise School',
    cover: { from: '#4C1D95', to: '#7C3AED', symbol: 'O(n)' },
  },
  {
    id: 'ai-job-profiles',
    title: 'AI job profiles explained: Forward Deployed, GenAI and Applied AI engineers',
    excerpt: 'What each of the hottest AI roles actually does, the skills it needs, and a first project to start with.',
    category: 'AI',
    readTime: '5 min read',
    updated: '2026-09-28',
    author: 'Bitwise School',
    cover: { from: '#4C1D95', to: '#DB2777', symbol: 'AI' },
  },
  {
    id: 'first-web-app',
    title: 'Build and deploy your first web app with HTML, CSS and JavaScript',
    excerpt: 'A hands-on walkthrough: a working expense tracker with local storage, built step by step and put online for free.',
    category: 'Web Development',
    readTime: '7 min read',
    updated: '2026-09-28',
    author: 'Bitwise School',
    cover: { from: '#064E3B', to: '#059669', symbol: '</>' },
  },
  {
    id: 'react-fundamentals',
    title: 'React fundamentals for beginners: think in components',
    excerpt: 'Components, JSX, props, state, events, lists and effects, with one small app built along the way and how to start a React project in 2026.',
    category: 'Web Development',
    readTime: '6 min read',
    updated: '2026-09-28',
    author: 'Bitwise School',
    cover: { from: '#0C4A6E', to: '#0891B2', symbol: '⚛' },
  },
  {
    id: 'getting-started-with-cpp',
    title: 'Getting started with C++: setup, first programs and a 30-day plan',
    excerpt: 'Install a compiler, understand every line of your first program, learn the core syntax with examples, and follow a 30-day plan to DSA-ready C++.',
    category: 'Programming',
    readTime: '8 min read',
    updated: '2026-09-28',
    author: 'Bitwise School',
    cover: { from: '#0A2A66', to: '#0052CC', symbol: 'C++' },
  },
  {
    id: 'java-best-practices',
    title: 'Java best practices: write code your seniors will approve',
    excerpt: 'Naming, immutability, null handling, collections, exceptions, streams and modern Java features, each with a before-and-after example.',
    category: 'Programming',
    readTime: '7 min read',
    updated: '2026-09-28',
    author: 'Bitwise School',
    cover: { from: '#7C2D12', to: '#EA580C', symbol: 'Java' },
  },
  {
    id: 'python-data-science',
    title: 'Python for data science: NumPy, pandas and Matplotlib from zero',
    excerpt: 'Set up your tools, then analyse a real-style dataset end to end: load, clean, group, visualise and draw conclusions, with pandas 3 in mind.',
    category: 'Data Science',
    readTime: '6 min read',
    updated: '2026-09-28',
    author: 'Bitwise School',
    cover: { from: '#713F12', to: '#CA8A04', symbol: 'df' },
  },
  {
    id: 'student-perks',
    title: 'What your college email ID gets you: free tools every student should claim',
    excerpt: 'GitHub Student Pack, Notion, Azure credits, Figma, JetBrains and more, plus how to use them before you graduate.',
    category: 'Careers',
    readTime: '4 min read',
    updated: '2026-09-28',
    author: 'Bitwise School',
    cover: { from: '#0F766E', to: '#0891B2', symbol: '.edu' },
  },
];

export const isPublished = (post: BlogPost) => hasPost(post.id);

export const CATEGORY_COVERS: Record<BlogCategory, { from: string; to: string; symbol: string }> = {
  Careers: { from: '#0F766E', to: '#0891B2', symbol: '→' },
  AI: { from: '#4C1D95', to: '#DB2777', symbol: 'AI' },
  Programming: { from: '#0A2A66', to: '#0052CC', symbol: '{ }' },
  DSA: { from: '#4C1D95', to: '#7C3AED', symbol: 'O(n)' },
  'Web Development': { from: '#064E3B', to: '#059669', symbol: '</>' },
  'Data Science': { from: '#713F12', to: '#CA8A04', symbol: 'df' },
};

export const coverFor = (post: BlogPost) => post.cover ?? CATEGORY_COVERS[post.category];
