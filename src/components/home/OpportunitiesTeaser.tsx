import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { CountUp, Reveal } from '../motion';
import { useOpportunityData } from '../../hooks/useOpportunityData';
import { openSourcePrograms, researchPrograms, upcomingEvents } from '../../data/programs';

const IST = 'Asia/Kolkata';
const dayMonth = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: 'numeric', month: 'short' }).format(new Date(value));
const monthYear = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: IST, month: 'short', year: 'numeric' }).format(new Date(value));

const OpportunitiesTeaser = () => {
  const data = useOpportunityData();
  const today = new Date().toISOString().slice(0, 10);
  const next = upcomingEvents
    .filter((event) => (event.endDate || event.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const counts = [
    { value: data?.jobsOpenToIndia ?? null, label: 'remote jobs open to India' },
    { value: data?.hackathons ?? null, label: 'hackathons open now' },
    { value: openSourcePrograms.length, label: 'open-source programs' },
    { value: researchPrograms.length, label: 'research internships' },
  ];

  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">
            Free for every student
          </p>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Every opportunity, in one place
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            Open-source programs, remote jobs open to India, hackathons, coding contests and research internships abroad.
            Filtered for Indian students and refreshed every 3 days.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-6">
            {counts.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <dt className="sr-only">{item.label}</dt>
                <dd className="text-3xl font-extrabold text-ink">
                  {item.value === null ? <span className="text-slate-300">…</span> : <CountUp to={item.value} />}
                </dd>
                <dd className="mt-1 text-sm text-slate-600">{item.label}</dd>
              </div>
            ))}
          </dl>

          <Link
            to="/opportunities"
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-ink/20 transition hover:bg-brand-700"
          >
            Browse opportunities
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative">
            <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-200/50 via-brand-100/60 to-slate-100/60 blur-2xl" />
            <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-ink/10 sm:p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">Coming up next</h3>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                  </span>
                  {data ? `Updated ${dayMonth(data.generatedAt)}` : 'Updated every 3 days'}
                </span>
              </div>

              <ul className="mt-6 space-y-3">
                {next.map((event) => (
                  <li key={`${event.date}-${event.label}`}>
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                    >
                      <span className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-white py-2 text-center shadow-sm ring-1 ring-slate-200">
                        <CalendarDays className="h-4 w-4 text-brand-600" />
                        <span className="mt-1 text-xs font-bold text-ink">
                          {event.approx ? monthYear(event.date) : dayMonth(event.date)}
                        </span>
                      </span>
                      <span className="text-sm leading-relaxed text-slate-700">
                        {event.label}
                        {event.approx && <span className="ml-1 text-slate-400">(expected)</span>}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <Link
                to="/opportunities#deadlines"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                See all deadlines <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default OpportunitiesTeaser;
