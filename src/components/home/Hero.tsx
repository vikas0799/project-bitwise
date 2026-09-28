import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import CodeWindow from './CodeWindow';

const EASE = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const PERKS = ['Live + recorded classes', 'Weekend and evening batches', '7-day money-back guarantee'];

const Hero = () => (
  <section className="relative overflow-clip-safe">
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-grid mask-radial" />
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-200/50 blur-3xl animate-blob" />
      <div className="absolute -right-32 top-10 h-[30rem] w-[30rem] rounded-full bg-indigo-200/40 blur-3xl animate-blob [animation-delay:-7s]" />
      <div className="absolute -bottom-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-cyan-100/60 blur-3xl animate-blob [animation-delay:-14s]" />
    </div>

    <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-32 lg:pt-20">
      <m.div className="lg:col-span-7" variants={container} initial="hidden" animate="show">
        <m.div variants={item}>
          <a
            href="#ai-careers"
            className="group inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 py-1 pl-1 pr-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-violet-300"
          >
            <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-0.5 text-xs font-semibold text-white">New</span>
            Generative AI, Applied AI and FDE tracks
            <ArrowRight className="h-3.5 w-3.5 text-violet-600 transition-transform group-hover:translate-x-0.5" />
          </a>
        </m.div>

        <m.h1
          variants={item}
          className="mt-6 text-[2.6rem] font-extrabold leading-[1.06] tracking-tight text-ink sm:text-6xl lg:text-[4rem]"
        >
          Become a job-ready developer, <span className="text-gradient">bit by bit.</span>
        </m.h1>

        <m.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
          Live and recorded courses in DSA, full stack web development, C++, Java and Python, plus new AI tracks. Taught
          by a software engineer who has taught at Chitkara University, LPU and Chandigarh University.
        </m.p>

        <m.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/courses"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
          >
            Explore courses
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/opportunities"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3.5 text-base font-semibold text-ink shadow-sm backdrop-blur transition hover:border-slate-400 hover:bg-white"
          >
            Browse free opportunities
          </Link>
        </m.div>

        <m.ul variants={item} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {PERKS.map((perk) => (
            <li key={perk} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {perk}
            </li>
          ))}
        </m.ul>
      </m.div>

      <m.div
        className="relative lg:col-span-5"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
      >
        <CodeWindow />
      </m.div>
    </div>
  </section>
);

export default Hero;
