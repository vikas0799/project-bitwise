import type { ReactNode } from 'react';
import { Reveal } from '../motion';

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
}

const SectionHeading = ({ eyebrow, title, subtitle, align = 'center' }: SectionHeadingProps) => (
  <Reveal className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
      {title}
    </h2>
    {subtitle && <p className="mt-4 text-lg leading-relaxed text-slate-600">{subtitle}</p>}
  </Reveal>
);

export default SectionHeading;
