import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Markdown from '../components/Markdown';
import { allNotes, getNote, noteAliases, noteCategories } from '../data/notes';
import { loadNote } from '../lib/content';
import { renderMarkdown, type Heading } from '../lib/markdown';

// Follows which heading is currently at the top of the screen.
const useActiveHeading = (headings: Heading[]) => {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return active;
};

const Sidebar = () => (
  <nav aria-label="Notes" className="space-y-8">
    {noteCategories.map((category) => (
      <div key={category.id}>
        <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">{category.title}</p>
        <ul className="mt-2 space-y-0.5">
          {category.notes.map((note) => (
            <li key={note.slug}>
              <NavLink
                to={`/notes/${note.slug}`}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                  }`
                }
              >
                {note.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </nav>
);

const NoteDoc = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const note = getNote(slug);
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSource(null);
    setFailed(false);
    if (!slug) return;
    const loader = loadNote(slug);
    if (!loader) {
      setFailed(true);
      return;
    }
    let active = true;
    loader.then(
      (text) => active && setSource(text),
      () => active && setFailed(true)
    );
    return () => {
      active = false;
    };
  }, [slug]);

  const rendered = useMemo(() => (source ? renderMarkdown(source) : null), [source]);
  const activeId = useActiveHeading(rendered?.headings ?? []);

  const index = allNotes.findIndex((n) => n.slug === slug);
  const prev = index > 0 ? allNotes[index - 1] : null;
  const next = index >= 0 && index < allNotes.length - 1 ? allNotes[index + 1] : null;

  if (slug && noteAliases[slug]) return <Navigate to={`/notes/${noteAliases[slug]}`} replace />;

  if (!note || failed) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <main className="flex flex-grow flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-3xl font-extrabold text-ink">We couldn't find that note</h1>
          <Link to="/notes" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white">
            <ArrowLeft className="h-5 w-5" /> All notes
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const courseLink =
    note.category.id === 'cs-fundamentals'
      ? { to: '/courses/dsa', label: 'Data Structures & Algorithms course' }
      : { to: '/courses/full-stack', label: 'Full Stack Web Development course' };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO title={`${note.title} | Interview notes | Bitwise School`} description={note.description} type="article" />
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
              <span className="sr-only">Jump to a note</span>
              <select
                value={note.slug}
                onChange={(event) => navigate(`/notes/${event.target.value}`)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm"
              >
                {noteCategories.map((category) => (
                  <optgroup key={category.id} label={category.title}>
                    {category.notes.map((n) => (
                      <option key={n.slug} value={n.slug}>
                        {n.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
              <Link to="/notes" className="hover:text-brand-700">
                Notes
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span>{note.category.title}</span>
            </nav>

            <header className="mt-4 border-b border-slate-200 pb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{note.title}</h1>
              <p className="mt-3 text-lg leading-relaxed text-slate-600">{note.description}</p>
              <p className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <span>By {note.author}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {note.minutes} min read
                </span>
              </p>
            </header>

            <div className="mt-8">
              {rendered ? (
                <Markdown html={rendered.html} />
              ) : (
                <div className="space-y-4" aria-label="Loading note">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${90 - i * 8}%` }} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-16 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2">
              {prev ? (
                <Link to={`/notes/${prev.slug}`} className="group rounded-2xl border border-slate-200 p-5 transition hover:border-brand-200 hover:bg-brand-50/40">
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </span>
                  <span className="mt-1 block font-semibold text-ink">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  to={`/notes/${next.slug}`}
                  className="group rounded-2xl border border-slate-200 p-5 text-right transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                    Next <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="mt-1 block font-semibold text-ink">{next.title}</span>
                </Link>
              )}
            </div>

            <div className="mt-10 rounded-3xl bg-ink p-8 text-white">
              <p className="text-xl font-bold">Want to learn this live, with projects?</p>
              <p className="mt-2 text-slate-300">Join a batch and get your doubts cleared every week.</p>
              <Link
                to={courseLink.to}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-ink transition hover:bg-slate-100"
              >
                {courseLink.label} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </main>

          <aside className="hidden xl:block">
            {rendered && rendered.headings.length > 0 && (
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">On this page</p>
                <ul className="mt-3 space-y-1 border-l border-slate-200">
                  {rendered.headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className={`-ml-px block border-l py-1 text-sm transition-colors ${heading.depth === 3 ? 'pl-6' : 'pl-3'} ${
                          activeId === heading.id
                            ? 'border-brand-600 font-medium text-brand-700'
                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-ink'
                        }`}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NoteDoc;
