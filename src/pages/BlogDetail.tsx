import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Avatar from '../components/Avatar';
import Markdown from '../components/Markdown';
import BlogCard from '../components/BlogCard';
import { blogPosts, coverFor, isPublished } from '../data/blog';
import { loadPost } from '../lib/content';
import { renderMarkdown } from '../lib/markdown';

const BlogDetail = () => {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    setSource(null);
    const loader = id ? loadPost(id) : undefined;
    if (!loader) return;
    let active = true;
    loader.then((text) => active && setSource(text));
    return () => {
      active = false;
    };
  }, [id]);

  const html = useMemo(() => (source ? renderMarkdown(source).html : null), [source]);

  if (!post || !isPublished(post)) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <main className="flex flex-grow flex-col items-center justify-center px-4 py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">{post ? 'Coming soon' : 'Not found'}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold text-ink sm:text-4xl">
            {post ? post.title : "We couldn't find that article"}
          </h1>
          <p className="mt-3 max-w-xl text-slate-600">
            {post ? "We're still writing this one. Check back soon." : 'It may have moved. Browse all articles instead.'}
          </p>
          <Link to="/blog" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
            <ArrowLeft className="h-5 w-5" /> Back to the blog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const cover = coverFor(post);
  const more = blogPosts.filter((p) => p.id !== post.id && isPublished(p)).slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO title={`${post.title} | Bitwise School`} description={post.excerpt} type="article" />
      <Navbar />

      <main className="flex-grow">
        <header className="relative overflow-clip-safe border-b border-slate-200/70 bg-gradient-to-b from-brand-50/80 to-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid mask-radial" />
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
          >
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
              <ArrowLeft className="h-4 w-4" /> Back to the blog
            </Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-brand-600">{post.category}</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{post.title}</h1>
            <p className="mt-5 text-xl leading-relaxed text-slate-600">{post.excerpt}</p>
            <div className="mt-8 flex items-center gap-4">
              <Avatar name="Bitwise School" size="sm" />
              <div className="text-sm">
                <p className="font-semibold text-ink">Bitwise School</p>
                <p className="inline-flex items-center gap-1 text-slate-500">
                  <Clock className="h-3.5 w-3.5" /> {post.readTime}
                </p>
              </div>
            </div>
          </m.div>
        </header>

        <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <div
            aria-hidden
            className="relative mb-12 flex h-56 items-center justify-center overflow-clip-safe rounded-3xl sm:h-72"
            style={{ backgroundImage: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
          >
            <div className="absolute inset-0 bg-grid-dark opacity-70" />
            <span className="relative font-mono text-6xl font-bold text-white/90">{cover.symbol}</span>
          </div>

          {html ? (
            <Markdown html={html} />
          ) : (
            <div className="space-y-4" aria-label="Loading article">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${92 - i * 7}%` }} />
              ))}
            </div>
          )}

          <div className="mt-16 rounded-3xl bg-ink p-8 text-center text-white">
            <p className="text-xl font-bold">Want to learn with a teacher?</p>
            <p className="mt-2 text-slate-300">Live classes, recordings of every session and real projects.</p>
            <Link
              to="/courses"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-ink transition hover:bg-slate-100"
            >
              Browse courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        {more.length > 0 && (
          <section className="border-t border-slate-200/70 bg-slate-50/70 py-16">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">Read next</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {more.map((p) => (
                  <BlogCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetail;
