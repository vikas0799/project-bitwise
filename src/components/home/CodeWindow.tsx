import { useEffect, useState, type ReactNode } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { Briefcase, CheckCircle2, Trophy } from 'lucide-react';
import { useOpportunityData } from '../../hooks/useOpportunityData';

type Kind = 'k' | 'v' | 'p' | 't' | 'f' | 's' | 'c';

const COLORS: Record<Kind, string> = {
  k: 'text-[#C792EA]', // keyword
  v: 'text-slate-100', // variable
  p: 'text-slate-400', // punctuation
  t: 'text-[#FFCB6B]', // type
  f: 'text-[#82AAFF]', // function
  s: 'text-[#C3E88D]', // string
  c: 'italic text-slate-500', // comment
};

const LINES: [string, Kind][][] = [
  [['const ', 'k'], ['you', 'v'], [' = ', 'p'], ['new ', 'k'], ['Developer', 't'], ['();', 'p']],
  [],
  [['await ', 'k'], ['you', 'v'], ['.', 'p'], ['learn', 'f'], ['([', 'p'], ['"DSA"', 's'], [', ', 'p'], ['"React"', 's'], [', ', 'p'], ['"Node"', 's'], ['])', 'p'], [';', 'p']],
  [['you', 'v'], ['.', 'p'], ['build', 'f'], ['(', 'p'], ['"projects that ship"', 's'], [');', 'p']],
  [['you', 'v'], ['.', 'p'], ['contribute', 'f'], ['(', 'p'], ['"open source"', 's'], [');', 'p']],
  [],
  [['const ', 'k'], ['offer', 'v'], [' = ', 'p'], ['await ', 'k'], ['you', 'v'], ['.', 'p'], ['apply', 'f'], ['(', 'p'], ['"internship"', 's'], [');', 'p']],
  [['// job-ready, bit by bit', 'c']],
];

const TEXT = LINES.map((line) => line.map(([t]) => t).join(''));
const TOTAL = TEXT.reduce((sum, line) => sum + line.length + 1, 0) - 1;

// Types the snippet out once, then leaves a blinking caret at the end.
const useTyping = (reduce: boolean | null) => {
  const [count, setCount] = useState(reduce ? TOTAL : 0);

  useEffect(() => {
    if (reduce) {
      setCount(TOTAL);
      return;
    }
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      let typed = 0;
      interval = setInterval(() => {
        typed += 1;
        setCount(typed);
        if (typed >= TOTAL) clearInterval(interval);
      }, 34);
    }, 900);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [reduce]);

  return count;
};

const FloatingChip = ({
  className,
  delay,
  icon,
  title,
  subtitle,
}: {
  className: string;
  delay: number;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) => (
  <m.div
    initial={{ opacity: 0, scale: 0.9, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className={`absolute z-20 hidden md:block ${className}`}
  >
    <m.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-xl shadow-ink/10 backdrop-blur"
    >
      {icon}
      <div>
        <p className="text-sm font-semibold leading-tight text-ink">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </m.div>
  </m.div>
);

const CodeWindow = () => {
  const reduce = useReducedMotion();
  const count = useTyping(reduce);
  const data = useOpportunityData();
  const done = count >= TOTAL;

  let offset = 0;

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-brand-500/30 via-indigo-500/20 to-cyan-400/30 blur-2xl" />

      <div aria-hidden className="relative overflow-clip-safe rounded-2xl border border-white/10 bg-[#0B1224] shadow-2xl shadow-ink/30 ring-1 ring-ink/5">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          <span className="ml-3 font-mono text-xs text-slate-400">journey.ts</span>
        </div>

        <div className="min-h-[15.5rem] px-4 py-5 font-mono text-[11.5px] leading-7 sm:px-5 sm:text-[13px]">
          {LINES.map((line, index) => {
            const lineStart = offset;
            const lineLength = TEXT[index].length;
            offset += lineLength + 1;
            const visible = Math.max(0, Math.min(lineLength, count - lineStart));
            const caretHere = count >= lineStart && count <= lineStart + lineLength;
            let used = 0;

            return (
              <div key={index} className="flex whitespace-pre">
                <span className="mr-4 hidden w-4 select-none text-right text-slate-600 sm:inline-block">{index + 1}</span>
                <span>
                  {line.map(([text, kind], tokenIndex) => {
                    const shown = Math.max(0, Math.min(text.length, visible - used));
                    used += text.length;
                    return shown > 0 ? (
                      <span key={tokenIndex} className={COLORS[kind]}>
                        {text.slice(0, shown)}
                      </span>
                    ) : null;
                  })}
                  {caretHere && <span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-brand-300 animate-caret" />}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-2.5 font-mono text-[11px] text-slate-400">
          <span>TypeScript</span>
          <m.span
            initial={false}
            animate={{ opacity: done ? 1 : 0.35 }}
            className="ml-auto inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className={`h-3.5 w-3.5 ${done ? 'text-emerald-400' : 'text-slate-500'}`} />
            {done ? 'compiled successfully' : 'compiling...'}
          </m.span>
        </div>
      </div>

      <FloatingChip
        className="-right-4 -top-9 lg:-right-8"
        delay={1.4}
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Trophy className="h-5 w-5" />
          </span>
        }
        title={data ? `${data.hackathons} hackathons open` : 'Hackathons open now'}
        subtitle="in our free portal"
      />
      <FloatingChip
        className="-bottom-10 -left-4 lg:-left-10"
        delay={1.7}
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Briefcase className="h-5 w-5" />
          </span>
        }
        title={data ? `${data.jobsOpenToIndia} remote jobs open to India` : 'Remote jobs open to India'}
        subtitle="updated every 3 days"
      />
    </div>
  );
};

export default CodeWindow;
