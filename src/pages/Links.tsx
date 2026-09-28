import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Reveal } from '../components/motion';
import { linkGroups } from '../data/links';

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, '');

const Links = () => {
  const [query, setQuery] = useState('');
  const total = linkGroups.reduce((sum, group) => sum + group.links.length, 0);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return linkGroups;
    return linkGroups
      .map((group) => ({
        ...group,
        links: group.links.filter((link) => `${link.name} ${link.description} ${group.title}`.toLowerCase().includes(q)),
      }))
      .filter((group) => group.links.length > 0);
  }, [query]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO
        title="Useful links for students: DSA, jobs, hackathons, AI | Bitwise School"
        description="The best sites for DSA practice, web development, system design, AI learning, hackathons, jobs, open source and research."
      />
      <Navbar />

      <main className="flex-grow">
        <PageHeader
          eyebrow="Useful links"
          title="The best places to learn, practise and apply"
          subtitle={`${total} hand-picked sites for DSA, web development, AI, hackathons, jobs, open source and research.`}
        >
          <label className="relative mx-auto block max-w-xl">
            <span className="sr-only">Search links</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search, e.g. hackathons, React, remote jobs"
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base text-ink shadow-lg shadow-ink/5 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
        </PageHeader>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Reveal>
            <Link
              to="/opportunities"
              className="group flex flex-col gap-2 rounded-2xl border border-brand-200 bg-brand-50/60 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-slate-700">
                <span className="font-semibold text-ink">Looking for live openings?</span> Our free portal lists open-source
                programs, remote jobs, hackathons and research internships, updated every 3 days.
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-700">
                Open the portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>

          <nav aria-label="Link categories" className="mt-8 flex flex-wrap gap-2">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
              >
                {group.title}
              </a>
            ))}
          </nav>

          <div className="mt-10 space-y-14">
            {groups.map((group) => (
              <section key={group.id} id={group.id} className="scroll-mt-24">
                <h2 className="text-2xl font-extrabold tracking-tight text-ink">{group.title}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink">{link.name}</span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-600" />
                      </span>
                      <span className="mt-1 text-sm leading-relaxed text-slate-600">{link.description}</span>
                      <span className="mt-3 font-mono text-xs text-slate-400">{hostname(link.url)}</span>
                    </a>
                  ))}
                </div>
              </section>
            ))}
            {groups.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-600">No links match "{query}".</p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Links;
