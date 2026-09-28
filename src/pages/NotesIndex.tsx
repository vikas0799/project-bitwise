import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, ListChecks } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Reveal, Stagger, StaggerItem } from '../components/motion';
import { allNotes, noteCategories } from '../data/notes';
import { totalProblems } from '../data/dsaSheet';

const NotesIndex = () => (
  <div className="flex min-h-screen flex-col bg-white">
    <SEO
      title="Interview notes: JavaScript, Node.js, OS, CN, DBMS, System Design | Bitwise School"
      description="Free revision notes for placement interviews: JavaScript, Node.js and Express, MongoDB, operating systems, computer networks, DBMS and system design."
    />
    <Navbar />

    <main className="flex-grow">
      <PageHeader
        eyebrow="Free interview notes"
        title="Revise everything before your interview"
        subtitle={`${allNotes.length} free notes on JavaScript, backend development and CS fundamentals, written for placement interviews.`}
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to={`/notes/${noteCategories[0].notes[0].slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
          >
            <BookOpen className="h-5 w-5" /> Start reading
          </Link>
          <Link
            to="/dsa-sheet"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-slate-50"
          >
            <ListChecks className="h-5 w-5" /> DSA sheet ({totalProblems} problems)
          </Link>
        </div>
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">
        {noteCategories.map((category) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <Reveal className="max-w-2xl">
              <h2 id={`cat-${category.id}`} className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {category.title}
              </h2>
              <p className="mt-2 text-slate-600">{category.description}</p>
            </Reveal>
            <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {category.notes.map((note) => (
                <StaggerItem key={note.slug} className="h-full">
                  <Link
                    to={`/notes/${note.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
                  >
                    <h3 className="text-lg font-bold leading-snug text-ink">{note.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{note.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Clock className="h-4 w-4" /> {note.minutes} min read
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-600">
                        Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ))}
      </div>
    </main>

    <Footer />
  </div>
);

export default NotesIndex;
