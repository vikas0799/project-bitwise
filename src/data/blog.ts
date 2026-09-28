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
  cover?: { from: string; to: string; symbol: string };
}

export const blogPosts: BlogPost[] = [
  {
    id: 'ai-job-profiles',
    title: 'AI job profiles explained: Forward Deployed, GenAI and Applied AI engineers',
    excerpt: 'What each of the hottest AI roles actually does, the skills it needs, and a first project to start with.',
    category: 'AI',
    readTime: '7 min read',
    cover: { from: '#4C1D95', to: '#DB2777', symbol: 'AI' },
  },
  {
    id: 'student-perks',
    title: 'What your college email ID gets you: free tools every student should claim',
    excerpt: 'GitHub Student Pack, Notion, Azure credits, Figma, JetBrains and more, plus how to use them before you graduate.',
    category: 'Careers',
    readTime: '6 min read',
    cover: { from: '#0F766E', to: '#0891B2', symbol: '.edu' },
  },
  {
    id: '1',
    title: 'Getting Started with C++ Programming',
    excerpt:
      'Learn the fundamentals of the C++ programming language and start your journey as a software developer, from basic syntax to what to learn next.',
    category: 'Programming',
    readTime: '5 min read',
  },
  {
    id: '2',
    title: 'Mastering Data Structures and Algorithms',
    excerpt: 'The data structures and algorithms concepts that matter most for technical interviews and real-world code.',
    category: 'DSA',
    readTime: '8 min read',
  },
  {
    id: '3',
    title: 'Building Your First Web Application',
    excerpt: 'A step-by-step guide to your first web app with HTML, CSS and JavaScript, and how to deploy it.',
    category: 'Web Development',
    readTime: '6 min read',
  },
  {
    id: '4',
    title: 'Java Programming Best Practices',
    excerpt: 'How to write clean, maintainable Java: design patterns, code organisation and performance basics.',
    category: 'Programming',
    readTime: '7 min read',
  },
  {
    id: '5',
    title: 'React.js Fundamentals for Beginners',
    excerpt: 'Components, state and building interactive user interfaces: a beginner-friendly introduction to React.',
    category: 'Web Development',
    readTime: '6 min read',
  },
  {
    id: '6',
    title: 'Python for Data Science',
    excerpt: 'How Python is used in data science, with a first look at NumPy, Pandas and Matplotlib.',
    category: 'Data Science',
    readTime: '9 min read',
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
