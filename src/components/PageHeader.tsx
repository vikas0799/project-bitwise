import type { ReactNode } from 'react';
import { m } from 'framer-motion';

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

// Shared header for inner pages: soft brand gradient, faint grid, fade-in title.
const PageHeader = ({ eyebrow, title, subtitle, children }: PageHeaderProps) => (
  <header className="relative overflow-clip-safe border-b border-slate-200/70 bg-gradient-to-b from-brand-50/80 to-white">
    <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid mask-radial" />
    <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
    <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
      {eyebrow && (
        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600"
        >
          {eyebrow}
        </m.p>
      )}
      <m.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl"
      >
        {title}
      </m.h1>
      {subtitle && (
        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600"
        >
          {subtitle}
        </m.p>
      )}
      {children && (
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          {children}
        </m.div>
      )}
    </div>
  </header>
);

export default PageHeader;
