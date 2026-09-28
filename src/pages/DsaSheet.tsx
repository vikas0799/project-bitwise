import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ExternalLink, RotateCcw, Search, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Reveal } from '../components/motion';
import { dsaTopics, problemUrl, topicNotes, totalProblems, type Difficulty } from '../data/dsaSheet';

const STORAGE_KEY = 'bitwise-dsa-progress-v1';

interface Progress {
  solved: string[];
  starred: string[];
}

// Progress lives only in this browser; reading or writing can fail in private mode.
const readProgress = (): Progress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { solved: parsed.solved ?? [], starred: parsed.starred ?? [] };
    }
  } catch {
    // ignore
  }
  return { solved: [], starred: [] };
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Hard: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const FILTERS: ('All' | Difficulty)[] = ['All', 'Easy', 'Medium', 'Hard'];

const ProgressBar = ({ value, total, className = '' }: { value: number; total: number; className?: string }) => (
  <div className={`h-2 overflow-hidden rounded-full bg-slate-100 ${className}`}>
    <div
      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
      style={{ width: `${total ? (value / total) * 100 : 0}%` }}
    />
  </div>
);

const DsaSheet = () => {
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<'All' | Difficulty>('All');
  const [hideSolved, setHideSolved] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set([dsaTopics[0].id]));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // storage unavailable; progress stays for this visit only
    }
  }, [progress]);

  const solved = useMemo(() => new Set(progress.solved), [progress.solved]);
  const starred = useMemo(() => new Set(progress.starred), [progress.starred]);

  const toggle = (key: 'solved' | 'starred', slug: string) =>
    setProgress((prev) => {
      const list = new Set(prev[key]);
      if (list.has(slug)) list.delete(slug);
      else list.add(slug);
      return { ...prev, [key]: [...list] };
    });

  const filtering = query.trim() !== '' || difficulty !== 'All' || hideSolved || starredOnly;

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dsaTopics.map((topic) => ({
      ...topic,
      visible: topic.problems.filter(
        (p) =>
          (difficulty === 'All' || p.difficulty === difficulty) &&
          (!hideSolved || !solved.has(p.slug)) &&
          (!starredOnly || starred.has(p.slug)) &&
          (!q || p.title.toLowerCase().includes(q) || topic.name.toLowerCase().includes(q))
      ),
    }));
  }, [query, difficulty, hideSolved, starredOnly, solved, starred]);

  const counts = (d: Difficulty) => {
    const all = dsaTopics.flatMap((t) => t.problems).filter((p) => p.difficulty === d);
    return { total: all.length, done: all.filter((p) => solved.has(p.slug)).length };
  };

  const reset = () => {
    if (window.confirm('Reset all your DSA sheet progress on this device?')) {
      setProgress({ solved: [], starred: [] });
    }
  };

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const nextOpen = new Set(prev);
      if (nextOpen.has(id)) nextOpen.delete(id);
      else nextOpen.add(id);
      return nextOpen;
    });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO
        title={`DSA sheet: ${totalProblems} problems by topic | Bitwise School`}
        description="A free, topic-wise DSA sheet of LeetCode problems for placement interviews, with progress tracking."
      />
      <Navbar />

      <main className="flex-grow">
        <PageHeader
          eyebrow="Free DSA sheet"
          title={`${totalProblems} problems. Every pattern you need.`}
          subtitle="Our own topic-wise selection of free LeetCode problems, from arrays to dynamic programming. Tick them off as you solve; your progress is saved on this device."
        />

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-ink/5 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Your progress</p>
                  <p className="text-3xl font-extrabold text-ink">
                    {solved.size} <span className="text-lg font-semibold text-slate-400">/ {totalProblems} solved</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-ink"
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
              </div>
              <ProgressBar value={solved.size} total={totalProblems} className="mt-4 h-3" />
              <div className="mt-6 grid grid-cols-3 gap-4">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => {
                  const c = counts(d);
                  return (
                    <div key={d}>
                      <p className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink">{d}</span>
                        <span className="text-slate-500">
                          {c.done}/{c.total}
                        </span>
                      </p>
                      <ProgressBar value={c.done} total={c.total} className="mt-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative w-full lg:max-w-xs">
              <span className="sr-only">Search problems</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search problems or topics"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDifficulty(f)}
                  aria-pressed={difficulty === f}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    difficulty === f ? 'bg-ink text-white' : 'border border-slate-200 text-slate-600 hover:text-ink'
                  }`}
                >
                  {f}
                </button>
              ))}
              <label className="ml-2 inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={hideSolved} onChange={(e) => setHideSolved(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Hide solved
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={starredOnly} onChange={(e) => setStarredOnly(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Starred only
              </label>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {topics.map((topic, index) => {
              if (filtering && topic.visible.length === 0) return null;
              const done = topic.problems.filter((p) => solved.has(p.slug)).length;
              const isOpen = filtering || open.has(topic.id);
              return (
                <section key={topic.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleOpen(topic.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink">{topic.name}</span>
                      <ProgressBar value={done} total={topic.problems.length} className="mt-2 max-w-xs" />
                    </span>
                    <span className="shrink-0 text-sm font-medium text-slate-500">
                      {done}/{topic.problems.length}
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100">
                      <p className="bg-slate-50/70 px-5 py-3 text-sm text-slate-600 sm:px-6">
                        <span className="font-semibold text-ink">Tip: </span>
                        {topic.tip}
                        {topicNotes[topic.id] && (
                          <Link
                            to={`/notes/${topicNotes[topic.id]}`}
                            className="ml-2 inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
                          >
                            <BookOpen className="h-4 w-4" /> Read the notes
                          </Link>
                        )}
                      </p>
                      <ul className="divide-y divide-slate-100">
                        {topic.visible.map((problem) => {
                          const isSolved = solved.has(problem.slug);
                          const isStarred = starred.has(problem.slug);
                          return (
                            <li key={problem.slug} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                              <input
                                type="checkbox"
                                checked={isSolved}
                                onChange={() => toggle('solved', problem.slug)}
                                aria-label={`Mark ${problem.title} as solved`}
                                className="h-5 w-5 shrink-0 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                              <a
                                href={problemUrl(problem.slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group inline-flex min-w-0 flex-1 items-center gap-1.5 font-medium transition-colors ${
                                  isSolved ? 'text-slate-400 line-through' : 'text-ink hover:text-brand-700'
                                }`}
                              >
                                <span className="truncate">{problem.title}</span>
                                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                              </a>
                              <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 sm:inline ${DIFFICULTY_STYLES[problem.difficulty]}`}>
                                {problem.difficulty}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggle('starred', problem.slug)}
                                aria-pressed={isStarred}
                                aria-label={isStarred ? `Remove ${problem.title} from revision` : `Star ${problem.title} for revision`}
                                className="shrink-0 rounded-lg p-1.5 hover:bg-slate-100"
                              >
                                <Star className={`h-4 w-4 ${isStarred ? 'fill-brand-500 text-brand-500' : 'text-slate-300'}`} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })}
            {filtering && topics.every((t) => t.visible.length === 0) && (
              <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-600">
                No problems match these filters.
              </p>
            )}
          </div>

          <p className="mt-10 text-sm text-slate-500">
            Problems link to LeetCode. Looking for more practice? Try{' '}
            <a
              href="https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-600 underline underline-offset-4"
            >
              Striver's A2Z DSA sheet
            </a>{' '}
            and the other sites in our{' '}
            <Link to="/links" className="font-medium text-brand-600 underline underline-offset-4">
              useful links
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DsaSheet;
