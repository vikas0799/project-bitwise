import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarClock, Compass, Hammer, Users, Video, type LucideIcon } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { Stagger, StaggerItem } from '../motion';

interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
}

const FEATURES: Feature[] = [
  {
    icon: Video,
    title: 'Live classes, recorded too',
    text: 'Learn live with your teacher, then rewatch any session whenever you need to revise.',
  },
  {
    icon: Hammer,
    title: 'Projects, not just theory',
    text: 'Every course ends in projects you can deploy, put on GitHub and talk about in interviews.',
  },
  {
    icon: Users,
    title: 'Small batches',
    text: 'Weekly doubt-clearing sessions and feedback on your code, not a crowd of thousands.',
  },
  {
    icon: Briefcase,
    title: 'Honest placement support',
    text: 'Resume reviews, mock interviews and referrals where we can. No fake guarantees.',
  },
  {
    icon: Compass,
    title: 'Free opportunities portal',
    text: 'GSoC, LFX, remote jobs, hackathons and research internships, updated every 3 days.',
    href: '/opportunities',
  },
  {
    icon: CalendarClock,
    title: 'Fits your timetable',
    text: 'Weekend and evening batches for college students and working professionals.',
  },
];

// Soft light that follows the cursor inside the card.
const trackPointer = (event: MouseEvent<HTMLDivElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`);
};

const Features = () => (
  <section className="relative bg-slate-50/70 py-24 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Why Bitwise"
        title="Built for students who want real skills, not just certificates"
        subtitle="The structure of a classroom, the practice of a job, and the exposure most colleges never give you."
      />

      <Stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <StaggerItem key={feature.title}>
            <div
              onMouseMove={trackPointer}
              className="spotlight group relative h-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-lg font-bold text-ink">{feature.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{feature.text}</p>
              {feature.href && (
                <Link
                  to={feature.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Browse opportunities <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </section>
);

export default Features;
