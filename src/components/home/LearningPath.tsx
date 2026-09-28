import { m } from 'framer-motion';
import { BookOpen, Code2, Globe2, Rocket, type LucideIcon } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { Stagger, StaggerItem } from '../motion';

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: BookOpen,
    title: 'Learn the fundamentals',
    text: 'Live classes in C++, Java or Python, plus data structures and algorithms.',
  },
  {
    icon: Code2,
    title: 'Build real projects',
    text: 'Full-stack apps you deploy and push to GitHub, reviewed by your instructor.',
  },
  {
    icon: Globe2,
    title: 'Get real-world exposure',
    text: 'Open source (GSoC, LFX), hackathons and contests, all listed in our free portal.',
  },
  {
    icon: Rocket,
    title: 'Prepare and apply',
    text: 'Mock interviews, resume reviews and referrals where we can.',
  },
];

const LearningPath = () => (
  <section className="relative overflow-clip-safe bg-slate-50/70 py-24 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="How it works"
        title="From your first line of code to your first offer"
        subtitle="A clear path, one step at a time. Most students work through it over a single course."
      />

      <div className="relative mt-16">
        {/* Connector line that draws itself on desktop */}
        <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-0.5 bg-slate-200 lg:block">
          <m.div
            className="h-full origin-left bg-gradient-to-r from-brand-700 via-brand-500 to-brand-400"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
          />
        </div>

        <Stagger className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8" gap={0.18}>
          {STEPS.map((step, index) => (
            <StaggerItem key={step.title} className="relative text-center">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-brand-600 shadow-lg shadow-brand-900/5">
                <step.icon className="h-6 w-6" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs leading-relaxed text-slate-600">{step.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  </section>
);

export default LearningPath;
