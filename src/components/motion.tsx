import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, m, useInView, useReducedMotion } from 'framer-motion';

// Shared scroll animations. <MotionConfig reducedMotion="user"> in App.tsx
// turns movement off for visitors who ask their OS for reduced motion.

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: '-80px' } as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export const Reveal = ({ children, className, delay = 0, y = 24 }: RevealProps) => (
  <m.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={VIEWPORT}
    transition={{ duration: 0.6, ease: EASE, delay }}
  >
    {children}
  </m.div>
);

export const Stagger = ({ children, className, gap = 0.08 }: { children: ReactNode; className?: string; gap?: number }) => (
  <m.div
    className={className}
    initial="hidden"
    whileInView="show"
    viewport={VIEWPORT}
    variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
  >
    {children}
  </m.div>
);

export const StaggerItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <m.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 24 },
      show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
    }}
  >
    {children}
  </m.div>
);

interface CountUpProps {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

// Counts from 0 to `to` the first time it scrolls into view.
export const CountUp = ({ to, prefix = '', suffix = '', duration = 1.6 }: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};
