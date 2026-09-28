import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import BlogCard from '../components/BlogCard';
import { Stagger, StaggerItem } from '../components/motion';
import { blogPosts, isPublished, type BlogCategory } from '../data/blog';

const CATEGORIES: ('all' | BlogCategory)[] = ['all', 'AI', 'Careers', 'Programming', 'DSA', 'Web Development', 'Data Science'];

const Blog = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogPosts
      .filter((post) => (category === 'all' || post.category === category) && (!q || `${post.title} ${post.excerpt}`.toLowerCase().includes(q)))
      .sort((a, b) => Number(isPublished(b)) - Number(isPublished(a)));
  }, [query, category]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO title="Blog | Bitwise School" description="Programming guides and tutorials from Bitwise School." />
      <Navbar />

      <main className="flex-grow">
        <PageHeader eyebrow="Blog" title="Guides for learning to code" subtitle="Career guides and practical tutorials on AI, programming, DSA and web development.">
          <label className="relative mx-auto block max-w-xl">
            <span className="sr-only">Search articles</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles"
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base text-ink shadow-lg shadow-ink/5 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
        </PageHeader>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter articles">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === item
                    ? 'bg-ink text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink'
                }`}
              >
                {item === 'all' ? 'All articles' : item}
              </button>
            ))}
          </div>

          {posts.length > 0 ? (
            <Stagger key={`${category}-${query}`} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <StaggerItem key={post.id} className="h-full">
                  <BlogCard post={post} />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 py-16 text-center">
              <p className="text-lg font-semibold text-ink">No articles found</p>
              <p className="mt-2 text-slate-600">Try a different search or category.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
