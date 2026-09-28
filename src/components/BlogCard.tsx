import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { coverFor, isPublished, type BlogPost } from '../data/blog';

const BlogCard = ({ post }: { post: BlogPost }) => {
  const cover = coverFor(post);
  const published = isPublished(post);

  const body = (
    <>
      <div
        className="relative flex h-40 items-center justify-center overflow-clip-safe"
        style={{ backgroundImage: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
      >
        <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-70" />
        <span aria-hidden className="relative font-mono text-4xl font-bold text-white/90 transition-transform duration-500 group-hover:scale-110">
          {cover.symbol}
        </span>
        {!published && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink">
            Coming soon
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{post.category}</p>
        <h3 className="mt-2 text-lg font-bold leading-snug text-ink">{post.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-5 text-sm">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <Clock className="h-4 w-4" /> {post.readTime}
          </span>
          {published && (
            <span className="inline-flex items-center gap-1 font-semibold text-brand-600">
              Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className =
    'group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300';

  return published ? (
    <Link to={`/blog/${post.id}`} className={`${className} hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10`}>
      {body}
    </Link>
  ) : (
    <div className={`${className} opacity-80`}>{body}</div>
  );
};

export default BlogCard;
