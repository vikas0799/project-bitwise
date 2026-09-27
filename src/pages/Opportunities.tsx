import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Calendar, MapPin, Trophy, Clock, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { openSourcePrograms, upcomingEvents, researchPrograms } from '../data/programs';
import { TELEGRAM_CHANNEL_URL, CONTACT_EMAIL } from '../config/site';

interface Job {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  openToIndia: 'yes' | 'no' | 'unknown';
  fresher: boolean;
  postedAt: string | null;
  source: string;
}

interface Hackathon {
  id: string;
  title: string;
  organizer: string;
  url: string;
  location: string;
  dates: string;
  state: string;
  prize: string;
  themes: string[];
}

interface Contest {
  id: string;
  title: string;
  url: string;
  startsAt: string | null;
  durationHours: number;
  platform: string;
}

interface SourceInfo {
  name: string;
  url: string;
  kind: string;
  ok: boolean;
  count: number;
}

interface LiveData {
  generatedAt: string;
  sources: SourceInfo[];
  jobs: Job[];
  hackathons: Hackathon[];
  contests: Contest[];
}

const IST = 'Asia/Kolkata';
const formatDate = (value: string, withTime = false) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value));
const formatMonth = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: IST, month: 'short', year: 'numeric' }).format(new Date(value));

const SECTIONS = [
  { id: 'deadlines', label: 'Deadlines' },
  { id: 'open-source', label: 'Open source' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'hackathons', label: 'Hackathons' },
  { id: 'contests', label: 'Contests' },
  { id: 'research', label: 'Research' },
];

const JOBS_PAGE = 30;

const PrepareBox = ({ text, to, cta }: { text: string; to: string; cta: string }) => (
  <div className="mt-8 rounded-lg border border-[#0052CC]/20 bg-[#e6effc] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <p className="text-gray-800">
      <span className="font-semibold text-[#0052CC]">Prepare with Bitwise: </span>
      {text}
    </p>
    <Link to={to} className="shrink-0 inline-flex items-center px-4 py-2 rounded-md bg-[#0052CC] text-white font-medium hover:bg-[#0747A6]">
      {cta}
    </Link>
  </div>
);

const SectionHeader = ({ id, title, subtitle }: { id: string; title: string; subtitle: string }) => (
  <div id={id} className="scroll-mt-24 mb-6">
    <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{title}</h2>
    <p className="mt-2 text-gray-600">{subtitle}</p>
  </div>
);

const Opportunities = () => {
  const [live, setLive] = useState<LiveData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [fresherOnly, setFresherOnly] = useState(false);
  const [hideRestricted, setHideRestricted] = useState(true);
  const [jobsShown, setJobsShown] = useState(JOBS_PAGE);

  useEffect(() => {
    fetch('/data/opportunities.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setLive)
      .catch(() => setLoadError(true));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const deadlines = useMemo(
    () =>
      upcomingEvents
        .filter((e) => (e.endDate || e.date) >= today)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [today]
  );

  const jobs = useMemo(() => {
    if (!live) return [];
    const q = query.trim().toLowerCase();
    return live.jobs.filter(
      (j) =>
        (!fresherOnly || j.fresher) &&
        (!hideRestricted || j.openToIndia !== 'no') &&
        (!q || `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q))
    );
  }, [live, query, fresherOnly, hideRestricted]);

  const jobSources = live?.sources.filter((s) => s.kind === 'jobs') ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Opportunities for Indian students | Bitwise School"
        description="Open-source programs (GSoC, LFX, Outreachy, C4GT), remote developer jobs open to India, hackathons, coding contests and research internships. Updated daily."
      />
      <Navbar />

      <main className="flex-grow">
        <header className="bg-gradient-to-br from-[#f4f5f7] to-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-[#0052CC]">Opportunities for Indian students</h1>
            <p className="mt-4 text-lg max-w-3xl mx-auto text-gray-600">
              Open-source programs, remote developer jobs, hackathons, contests and research internships in one place. Free, no sign-up.
            </p>
            {live && (
              <p className="mt-3 text-sm text-gray-500">Live listings updated {formatDate(live.generatedAt, true)} IST</p>
            )}
            <nav className="mt-8 flex flex-wrap justify-center gap-2">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#0052CC] hover:text-[#0052CC]">
                  {s.label}
                </a>
              ))}
            </nav>
            {TELEGRAM_CHANNEL_URL && (
              <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center px-5 py-3 rounded-md bg-[#0052CC] text-white font-medium hover:bg-[#0747A6]">
                Get weekly deadline alerts on Telegram
              </a>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Deadlines */}
          <section>
            <SectionHeader id="deadlines" title="Upcoming deadlines" subtitle="Dates marked “expected” are estimated from last year's cycle. Confirm on the official site." />
            <ol className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {deadlines.map((e) => (
                <li key={`${e.date}-${e.label}`} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-4">
                  <span className="w-44 shrink-0 font-semibold text-[#0052CC]">
                    {e.approx
                      ? `Expected ~${formatMonth(e.date)}`
                      : e.endDate
                        ? `${formatDate(e.date)} – ${formatDate(e.endDate)}`
                        : formatDate(e.date)}
                  </span>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-[#0052CC] inline-flex items-center gap-1">
                    {e.label} <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </li>
              ))}
            </ol>
          </section>

          {/* Open source */}
          <section>
            <SectionHeader id="open-source" title="Open-source programs" subtitle="Mentored programs where you contribute to real projects. Most paid programs pick contributors who have already made a few pull requests." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openSourcePrograms.map((p) => (
                <article key={p.name} className="rounded-lg border border-gray-200 bg-white p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded ${p.paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {p.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{p.org}</p>
                  <dl className="mt-4 space-y-2 text-sm text-gray-700 flex-grow">
                    <div><dt className="inline font-medium">Stipend: </dt><dd className="inline">{p.stipend}</dd></div>
                    <div><dt className="inline font-medium">When: </dt><dd className="inline">{p.timeline}</dd></div>
                    <div><dt className="inline font-medium">Who: </dt><dd className="inline">{p.eligibility}</dd></div>
                  </dl>
                  {p.caveat && <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded p-2">{p.caveat}</p>}
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-[#0052CC] font-medium hover:underline">
                    Official site <ExternalLink className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
            <PrepareBox text="learn Git, go deep in one language, and ship real projects before GSoC and LFX applications open." to="/courses/full-stack" cta="Full-stack course" />
          </section>

          {/* Jobs */}
          <section>
            <SectionHeader id="jobs" title="Remote developer jobs" subtitle="Remote roles from public job boards. Most are for experienced developers; use the filters to find fresher roles open to candidates in India." />
            {loadError && <p className="text-red-700">Live listings could not be loaded. Please try again later.</p>}
            {!live && !loadError && <p className="text-gray-500">Loading live listings…</p>}
            {live && (
              <>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <label className="relative flex-grow max-w-md">
                    <span className="sr-only">Search jobs</span>
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setJobsShown(JOBS_PAGE); }}
                      placeholder="Search title, company or location"
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:ring-[#0052CC] focus:border-[#0052CC]"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-700">
                    <input type="checkbox" checked={hideRestricted} onChange={(e) => { setHideRestricted(e.target.checked); setJobsShown(JOBS_PAGE); }} className="rounded text-[#0052CC]" />
                    Hide jobs restricted to other countries
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-700">
                    <input type="checkbox" checked={fresherOnly} onChange={(e) => { setFresherOnly(e.target.checked); setJobsShown(JOBS_PAGE); }} className="rounded text-[#0052CC]" />
                    Fresher / intern only
                  </label>
                </div>
                <p className="text-sm text-gray-500 mb-3">{jobs.length} jobs</p>
                <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                  {jobs.slice(0, jobsShown).map((j) => (
                    <li key={j.id} className="p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-gray-900">
                          {j.title}
                          {j.fresher && <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800">Fresher-friendly</span>}
                        </p>
                        <p className="text-sm text-gray-600">
                          {j.company}
                          <span className="mx-2">·</span>
                          <MapPin className="inline h-4 w-4 -mt-0.5" /> {j.location || 'Location not stated'}
                          {j.openToIndia === 'unknown' && <span className="ml-1 text-gray-400">(check eligibility)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
                        {j.postedAt && <span>{formatDate(j.postedAt)}</span>}
                        <span>via {j.source}</span>
                        <a href={j.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#0052CC] text-white font-medium hover:bg-[#0747A6]">
                          Apply <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </li>
                  ))}
                  {jobs.length === 0 && <li className="p-4 text-gray-600">No jobs match these filters today. Try turning off "Fresher / intern only".</li>}
                </ul>
                {jobs.length > jobsShown && (
                  <button onClick={() => setJobsShown((n) => n + JOBS_PAGE)} className="mt-4 px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:border-[#0052CC] hover:text-[#0052CC]">
                    Show more jobs
                  </button>
                )}
                <p className="mt-4 text-sm text-gray-500">
                  Jobs from{' '}
                  {jobSources.map((s, i) => (
                    <span key={s.name}>
                      <a href={s.url} target="_blank" rel="noopener" className="underline hover:text-[#0052CC]">{s.name}</a>
                      {i < jobSources.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  . Every listing links to its original post.
                </p>
              </>
            )}
            <PrepareBox text="most remote teams hire developers who can show deployed full-stack projects." to="/courses/full-stack" cta="Full-stack course" />
          </section>

          {/* Hackathons */}
          <section>
            <SectionHeader id="hackathons" title="Hackathons" subtitle="Open and upcoming hackathons from Devpost. Most are online and open to students in India; check each event's rules." />
            {live && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {live.hackathons.slice(0, 24).map((h) => (
                  <article key={h.id} className="rounded-lg border border-gray-200 bg-white p-5 flex flex-col">
                    <h3 className="font-bold text-gray-900">{h.title}</h3>
                    {h.organizer && <p className="text-sm text-gray-500">{h.organizer}</p>}
                    <ul className="mt-3 space-y-1 text-sm text-gray-700 flex-grow">
                      {h.dates && <li><Calendar className="inline h-4 w-4 mr-1 -mt-0.5" />{h.dates}</li>}
                      <li><MapPin className="inline h-4 w-4 mr-1 -mt-0.5" />{h.location}</li>
                      {h.prize && h.prize !== '$0' && <li><Trophy className="inline h-4 w-4 mr-1 -mt-0.5" />{h.prize} in prizes</li>}
                    </ul>
                    {h.themes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {h.themes.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{t}</span>)}
                      </div>
                    )}
                    <a href={h.url} target="_blank" rel="noopener" className="mt-4 inline-flex items-center gap-1 text-[#0052CC] font-medium hover:underline">
                      {h.state === 'open' ? 'Join on Devpost' : 'View on Devpost'} <ExternalLink className="h-4 w-4" />
                    </a>
                  </article>
                ))}
              </div>
            )}
            <PrepareBox text="win hackathons by shipping a working demo fast. Our project-based courses train exactly that." to="/courses/react" cta="React course" />
          </section>

          {/* Contests */}
          <section>
            <SectionHeader id="contests" title="Coding contests" subtitle="Upcoming Codeforces rounds, times in IST. Regular contests are the best practice for coding interviews." />
            {live && (
              <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                {live.contests.map((c) => (
                  <li key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <span className="w-56 shrink-0 font-semibold text-[#0052CC]">{c.startsAt ? `${formatDate(c.startsAt, true)} IST` : 'Date to be announced'}</span>
                    <span className="flex-grow text-gray-800">{c.title}</span>
                    <span className="text-sm text-gray-500 inline-flex items-center gap-1"><Clock className="h-4 w-4" />{c.durationHours} h</span>
                    <a href={c.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[#0052CC] font-medium hover:underline">
                      Register <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                ))}
                {live.contests.length === 0 && <li className="p-4 text-gray-600">No upcoming rounds announced yet.</li>}
              </ul>
            )}
            <PrepareBox text="structured DSA practice turns contest scores into interview offers." to="/courses/dsa" cta="DSA course" />
          </section>

          {/* Research */}
          <section>
            <SectionHeader id="research" title="Research internships" subtitle="Funded summer research programs in India and abroad. Most open between October and January for the following summer." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {researchPrograms.map((r) => (
                <article key={r.name} className="rounded-lg border border-gray-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-gray-900">{r.name}</h3>
                    <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">{r.country}</span>
                  </div>
                  <p className="text-sm text-gray-500">{r.host}</p>
                  <p className="mt-3 text-sm text-gray-700"><span className="font-medium">Who: </span>{r.who}</p>
                  {r.note && <p className="mt-2 text-sm text-gray-600">{r.note}</p>}
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[#0052CC] font-medium hover:underline">
                    Official site <ExternalLink className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
            <PrepareBox text="strong DSA and CS fundamentals help both research applications and placement interviews." to="/courses/dsa" cta="DSA course" />
          </section>

          <p className="text-sm text-gray-500 border-t border-gray-200 pt-6">
            Dates, stipends and eligibility change every year. Always confirm on the official site before applying.
            Found something wrong or missing? Email <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Opportunities;
