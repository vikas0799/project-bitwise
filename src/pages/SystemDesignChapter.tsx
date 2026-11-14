import { Link, NavLink, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight, Clock, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Markdown from '../components/Markdown';
import OnThisPage from '../components/OnThisPage';
import { SYSTEM_DESIGN_SOURCE, chapterPath, getChapter, systemDesignChapters } from '../data/systemDesign';
import { loadChapter } from '../lib/content';
import { useMarkdownDoc } from '../hooks/useMarkdownDoc';

const Sidebar = () => (
  <nav aria-label="System design chapters">
    <Link to="/system-design/" className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-brand-700">
      System design
    </Link>
    <ul className="mt-2 space-y-0.5">
      {systemDesignChapters.map((chapter) => (
        <li key={chapter.slug}>
          <NavLink
            to={chapterPath(chapter.slug)}
            className={({ isActive }) =>
              `flex gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
              }`
            }
          >
            <span className="font-mono text-slate-400">{chapter.number}</span>
            <span>{chapter.title}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

const SystemDesignChapter = () => {
  const { slug } = useParams<{ slug: string }>();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const chapter = getChapter(slug);
  const { rendered, failed } = useMarkdownDoc(chapter?.slug, loadChapter);

  // Keep one address per chapter: /system-design/<slug>/ with the trailing slash.
  if (!pathname.endsWith('/')) return <Navigate to={`${pathname}/${search}${hash}`} replace />;

  if (!chapter || failed) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <main className="flex flex-grow flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-3xl font-extrabold text-ink">We couldn't find that chapter</h1>
          <Link to="/system-design/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white">
            <ArrowLeft className="h-5 w-5" /> All chapters
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const index = systemDesignChapters.indexOf(chapter);
  const prev = index > 0 ? systemDesignChapters[index - 1] : null;
  const next = index < systemDesignChapters.length - 1 ? systemDesignChapters[index + 1] : null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO
        title={`${chapter.title} | System design chapter ${chapter.number} | Bitwise School`}
        description={chapter.description}
        type="article"
        canonicalPath={chapterPath(chapter.slug)}
      />
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-grow px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_13rem]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-10 pr-2">
              <Sidebar />
            </div>
          </aside>

          <main className="min-w-0">
            <label className="mb-6 block lg:hidden">
              <span className="sr-only">Jump to a chapter</span>
              <select
                value={chapter.slug}
                onChange={(event) => navigate(chapterPath(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm"
              >
                {systemDesignChapters.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.number}. {c.title}
                  </option>
                ))}
              </select>
            </label>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
              <Link to="/system-design/" className="hover:text-brand-700">
                System design
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span>Chapter {chapter.number}</span>
            </nav>

            <header className="mt-4 border-b border-slate-200 pb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{chapter.title}</h1>
              <p className="mt-3 text-lg leading-relaxed text-slate-600">{chapter.description}</p>
              <p className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <span>By Bitwise School</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {chapter.minutes} min read
                </span>
              </p>
            </header>

            <div className="mt-8">
              {rendered ? (
                <Markdown html={rendered.html} />
              ) : (
                <div className="space-y-4" aria-label="Loading chapter">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${90 - i * 8}%` }} />
                  ))}
                </div>
              )}
            </div>

            <p className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
              This chapter follows the topics of{' '}
              <a
                href={chapter.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand-600 underline decoration-brand-200 underline-offset-4 hover:decoration-brand-500"
              >
                Chapter {chapter.number} of {SYSTEM_DESIGN_SOURCE.name} <ExternalLink className="h-3.5 w-3.5" />
              </a>
              , rewritten in our own words with Node.js examples. Read the original for Go, Python and Java versions.
            </p>

            <div className="mt-10 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2">
              {prev ? (
                <Link to={chapterPath(prev.slug)} className="group rounded-2xl border border-slate-200 p-5 transition hover:border-brand-200 hover:bg-brand-50/40">
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                    <ArrowLeft className="h-4 w-4" /> Chapter {prev.number}
                  </span>
                  <span className="mt-1 block font-semibold text-ink">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  to={chapterPath(next.slug)}
                  className="group rounded-2xl border border-slate-200 p-5 text-right transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                    Chapter {next.number} <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="mt-1 block font-semibold text-ink">{next.title}</span>
                </Link>
              )}
            </div>

            <div className="mt-10 rounded-3xl bg-ink p-8 text-white">
              <p className="text-xl font-bold">Want to build real backends, with projects?</p>
              <p className="mt-2 text-slate-300">Join a batch and get your doubts cleared every week.</p>
              <Link
                to="/courses/full-stack"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-ink transition hover:bg-slate-100"
              >
                Full Stack Web Development course <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </main>

          <aside className="hidden xl:block">{rendered && <OnThisPage headings={rendered.headings} />}</aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SystemDesignChapter;
