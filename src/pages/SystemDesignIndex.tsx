import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, ExternalLink, NotebookPen } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Reveal, Stagger, StaggerItem } from '../components/motion';
import { SYSTEM_DESIGN_SOURCE, chapterGroups, chapterPath, systemDesignChapters } from '../data/systemDesign';

const SystemDesignIndex = () => {
  const { pathname, search, hash } = useLocation();
  // Keep one address per page: /system-design/ with the trailing slash.
  if (!pathname.endsWith('/')) return <Navigate to={`${pathname}/${search}${hash}`} replace />;

  const first = systemDesignChapters[0];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO
        title="System design from first principles: free chapters | Bitwise School"
        description="Free system design and backend chapters for students: HTTP and CORS, routing, serialization and more, explained from first principles with diagrams and Node.js code."
        canonicalPath="/system-design/"
      />
      <Navbar />

      <main className="flex-grow">
        <PageHeader
          eyebrow="Free system design series"
          title="System design from first principles"
          subtitle="Understand how the backend really works, one chapter at a time. Every chapter has diagrams, Node.js code and interview questions."
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={chapterPath(first.slug)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              <BookOpen className="h-5 w-5" /> Start with chapter {first.number}
            </Link>
            <Link
              to="/notes/system-design"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-slate-50"
            >
              <NotebookPen className="h-5 w-5" /> Quick revision note
            </Link>
          </div>
        </PageHeader>

        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Chapters</h2>
            <p className="mt-2 text-slate-600">Read them in order. Each chapter builds on the ones before it.</p>
          </Reveal>

          <div className="mt-10 space-y-14">
            {chapterGroups.map((group) => (
              <section key={group.id} aria-labelledby={`part-${group.id}`}>
                <h3 id={`part-${group.id}`} className="text-sm font-bold uppercase tracking-wider text-brand-600">
                  {group.title}
                </h3>
                <p className="mt-1 text-slate-600">{group.description}</p>
                <Stagger className="mt-6 space-y-5">
                  {group.chapters.map((chapter) => (
                    <StaggerItem key={chapter.slug}>
                      <Link
                        to={chapterPath(chapter.slug)}
                        className="group flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5 sm:flex-row sm:p-7"
                      >
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-mono text-xl font-bold text-white shadow-lg shadow-brand-600/25">
                          {chapter.number}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold uppercase tracking-wider text-brand-600">Chapter {chapter.number}</span>
                          <span className="mt-1 block text-xl font-bold leading-snug text-ink">{chapter.title}</span>
                          <span className="mt-2 block leading-relaxed text-slate-600">{chapter.description}</span>
                          <span className="mt-4 flex flex-wrap gap-2">
                            {chapter.topics.map((topic) => (
                              <span key={topic} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {topic}
                              </span>
                            ))}
                          </span>
                          <span className="mt-5 flex items-center justify-between text-sm">
                            <span className="inline-flex items-center gap-1.5 text-slate-500">
                              <Clock className="h-4 w-4" /> {chapter.minutes} min read
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-brand-600">
                              Read chapter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                          </span>
                        </span>
                      </Link>
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            ))}
          </div>

          <p className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
            These chapters follow the topics of{' '}
            <a
              href={SYSTEM_DESIGN_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-brand-600 underline decoration-brand-200 underline-offset-4 hover:decoration-brand-500"
            >
              {SYSTEM_DESIGN_SOURCE.name} <ExternalLink className="h-3.5 w-3.5" />
            </a>
            , rewritten in our own words with Node.js examples. Read the original for Go, Python and Java versions.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SystemDesignIndex;
