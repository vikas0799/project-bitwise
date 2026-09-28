import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Target } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Reveal, Stagger, StaggerItem } from '../components/motion';
import { projectIdeas, type ProjectLevel, type ProjectTrack } from '../data/projects';

const LEVELS: ('All' | ProjectLevel)[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const TRACKS: ('All' | ProjectTrack)[] = ['All', 'Web', 'Full stack', 'Systems', 'AI'];

const LEVEL_STYLES: Record<ProjectLevel, string> = {
  Beginner: 'bg-brand-50 text-brand-700 ring-brand-200',
  Intermediate: 'bg-brand-100 text-brand-800 ring-brand-300',
  Advanced: 'bg-ink text-white ring-ink',
};

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-ink text-white' : 'border border-slate-200 bg-white text-slate-600 hover:text-ink'
    }`}
  >
    {children}
  </button>
);

const Projects = () => {
  const [level, setLevel] = useState<'All' | ProjectLevel>('All');
  const [track, setTrack] = useState<'All' | ProjectTrack>('All');

  const visible = useMemo(
    () => projectIdeas.filter((p) => (level === 'All' || p.level === level) && (track === 'All' || p.track === track)),
    [level, track]
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO
        title="Project ideas for your resume | Bitwise School"
        description="Resume-worthy project ideas for students: web, full stack, systems and AI, with features, tech stack and stretch goals."
      />
      <Navbar />

      <main className="flex-grow">
        <PageHeader
          eyebrow="Project ideas"
          title="Build projects that get you interviews"
          subtitle="Recruiters skip to-do apps. These projects show real skills. Each comes with features to build, the stack to use and a stretch goal."
        />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by level">
              {LEVELS.map((l) => (
                <Pill key={l} active={level === l} onClick={() => setLevel(l)}>
                  {l === 'All' ? 'All levels' : l}
                </Pill>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by track">
              {TRACKS.map((t) => (
                <Pill key={t} active={track === t} onClick={() => setTrack(t)}>
                  {t === 'All' ? 'All tracks' : t}
                </Pill>
              ))}
            </div>
          </div>

          <Stagger key={`${level}-${track}`} className="mt-10 grid gap-6 lg:grid-cols-2">
            {visible.map((project) => (
              <StaggerItem key={project.id} className="h-full">
                <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-xl hover:shadow-ink/5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className={`rounded-full px-2.5 py-1 ring-1 ${LEVEL_STYLES[project.level]}`}>{project.level}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{project.track}</span>
                    {project.track === 'AI' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 ring-1 ring-slate-200">
                        <Sparkles className="h-3 w-3" /> Hot
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-ink">{project.title}</h2>
                  <p className="mt-2 leading-relaxed text-slate-600">{project.summary}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.stack.map((tech) => (
                      <span key={tech} className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <ul className="mt-5 space-y-2">
                    {project.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 rounded-2xl bg-brand-50/70 p-4 text-sm text-slate-700">
                    <p className="flex items-start gap-2">
                      <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span>
                        <span className="font-semibold text-ink">What it shows: </span>
                        {project.shows}
                      </span>
                    </p>
                    <p className="mt-2 pl-6">
                      <span className="font-semibold text-ink">Stretch goal: </span>
                      {project.stretch}
                    </p>
                  </div>

                  {project.guide && (
                    <Link
                      to={project.guide.to}
                      className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {project.guide.label} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal className="mt-16">
            <div className="rounded-3xl bg-ink p-8 text-center text-white sm:p-12">
              <h2 className="text-2xl font-extrabold sm:text-3xl">Build them with a mentor</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-300">
                Every Bitwise course ends in projects like these, reviewed by your instructor.
              </p>
              <Link
                to="/courses"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-ink transition hover:bg-slate-100"
              >
                Explore courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Projects;
