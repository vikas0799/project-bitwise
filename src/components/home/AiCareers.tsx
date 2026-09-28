import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, BrainCircuit, Handshake, MessageCircle, Sparkles, type LucideIcon } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '../motion';
import { whatsappLink } from '../../config/site';

interface Role {
  icon: LucideIcon;
  title: string;
  text: string;
  skills: string[];
  course: { to: string; label: string };
}

const ROLES: Role[] = [
  {
    icon: Sparkles,
    title: 'GenAI / AI Engineer',
    text: 'Builds products on top of large language models: chat over documents, AI search and smart features.',
    skills: ['LLM APIs', 'RAG', 'Vector DBs', 'Evals'],
    course: { to: '/courses/generative-ai', label: 'Generative AI Engineering' },
  },
  {
    icon: Handshake,
    title: 'Forward Deployed Engineer',
    text: 'Works directly with customers to ship software and AI solutions on their real data, end to end.',
    skills: ['Full stack', 'SQL', 'LLMs', 'Communication'],
    course: { to: '/courses/forward-deployed-engineer', label: 'Forward Deployed Engineer Track' },
  },
  {
    icon: BrainCircuit,
    title: 'Applied AI / ML Engineer',
    text: 'Trains, fine-tunes and deploys models that solve business problems, from fraud to forecasting.',
    skills: ['Python', 'PyTorch', 'scikit-learn', 'MLOps'],
    course: { to: '/courses/applied-ai', label: 'Applied AI & Machine Learning' },
  },
  {
    icon: Bot,
    title: 'AI Agent / Automation Engineer',
    text: 'Builds agents that call tools and automate multi-step workflows, with the right guardrails.',
    skills: ['Tool calling', 'MCP', 'APIs', 'Workflows'],
    course: { to: '/courses/generative-ai', label: 'Generative AI Engineering' },
  },
];

// Soft light that follows the cursor inside the card.
const trackPointer = (event: MouseEvent<HTMLDivElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`);
};

const AiCareers = () => (
  <section id="ai-careers" className="relative scroll-mt-16 overflow-clip-safe bg-[#0B0620] py-24 sm:py-28">
    <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-50 mask-radial" />
    <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl animate-blob" />
    <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-blob [animation-delay:-10s]" />

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-violet-200 ring-1 ring-white/15">
          <Sparkles className="h-4 w-4" /> New AI tracks
        </p>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          The hottest jobs in tech are <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">AI jobs</span>
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-slate-300">
          Companies are hiring engineers who can build with AI, not just use it. Our new tracks prepare you for these roles.
        </p>
      </Reveal>

      <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <StaggerItem key={role.title} className="h-full">
            <div
              onMouseMove={trackPointer}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.07]"
              style={{
                backgroundImage:
                  'radial-gradient(360px circle at var(--x, 50%) var(--y, -20%), rgba(167, 139, 250, 0.16), transparent 60%)',
              }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-900/40 transition-transform group-hover:scale-110">
                <role.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-white">{role.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">{role.text}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {role.skills.map((skill) => (
                  <span key={skill} className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-violet-100">
                    {skill}
                  </span>
                ))}
              </div>
              <Link
                to={role.course.to}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-200 transition-colors hover:text-white"
              >
                {role.course.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal className="mx-auto mt-12 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
        <a
          href={whatsappLink("Hi Bitwise School, please add me to the waitlist for your new AI courses.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110"
        >
          <MessageCircle className="h-5 w-5" /> Join the AI waitlist
        </a>
        <Link
          to="/blog/ai-job-profiles"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
        >
          Read: AI job profiles explained <ArrowRight className="h-5 w-5" />
        </Link>
      </Reveal>
    </div>
  </section>
);

export default AiCareers;
