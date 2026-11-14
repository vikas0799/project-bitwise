import { useEffect, useState } from 'react';
import type { Heading } from '../lib/markdown';

// Follows which heading is currently at the top of the screen.
const useActiveHeading = (headings: Heading[]) => {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return active;
};

// The "On this page" list beside a note or chapter, highlighting the section being read.
const OnThisPage = ({ headings }: { headings: Heading[] }) => {
  const activeId = useActiveHeading(headings);
  if (headings.length === 0) return null;

  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">On this page</p>
      <ul className="mt-3 space-y-1 border-l border-slate-200">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`-ml-px block border-l py-1 text-sm transition-colors ${heading.depth === 3 ? 'pl-6' : 'pl-3'} ${
                activeId === heading.id
                  ? 'border-brand-600 font-medium text-brand-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-ink'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnThisPage;
