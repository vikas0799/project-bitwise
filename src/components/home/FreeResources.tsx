import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { Reveal, Stagger, StaggerItem } from '../motion';
import { resources } from '../../data/resources';

// Everything except the portal and blog, which have their own spots on the page.
const ITEMS = resources.filter((r) => r.to !== '/opportunities' && r.to !== '/blog');

const FreeResources = () => (
  <section className="py-24 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          align="left"
          eyebrow="Free interview prep"
          title="Notes, a DSA sheet and project ideas. All free."
          subtitle="Revise JavaScript, backend, OS, CN, DBMS and system design, practise DSA and plan your next project, without signing up."
        />
        <Reveal>
          <Link
            to="/resources"
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400"
          >
            All resources
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>

      <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ to, title, description, icon: Icon }) => (
          <StaggerItem key={to} className="h-full">
            <Link
              to={to}
              className="group flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-bold text-ink">
                  {title}
                  <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-600">{description}</span>
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </section>
);

export default FreeResources;
