import { CountUp, Stagger, StaggerItem } from '../motion';
import { useOpportunityData } from '../../hooks/useOpportunityData';
import { courses } from '../../data/courses';

const StatsBand = () => {
  const data = useOpportunityData();
  const liveCount = data ? data.jobsOpenToIndia + data.hackathons + data.contests : null;

  const stats = [
    { value: 3, label: 'Universities taught at', note: 'Chitkara · LPU · Chandigarh University' },
    { value: courses.length, label: 'Career-focused courses', note: 'Including new AI tracks' },
    { value: liveCount, suffix: '+', label: 'Live opportunities today', note: 'Jobs, hackathons and contests' },
    { value: 7, suffix: '-day', label: 'Money-back guarantee', note: 'Request within 7 days of enrolling' },
  ];

  return (
    <section className="relative overflow-clip-safe bg-ink py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-60 mask-radial" />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />

      <Stagger className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-12 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <StaggerItem key={stat.label} className="px-2 text-center lg:border-l lg:border-white/10 lg:first:border-l-0">
            <p className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {stat.value === null ? (
                <span className="text-slate-500">…</span>
              ) : (
                <span className="text-gradient-light">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </span>
              )}
            </p>
            <p className="mt-3 text-sm font-semibold text-white sm:text-base">{stat.label}</p>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">{stat.note}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
};

export default StatsBand;
