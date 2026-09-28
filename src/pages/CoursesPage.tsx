import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import CourseCard from '../components/CourseCard';
import { Stagger, StaggerItem } from '../components/motion';
import { courses, type CourseCategory } from '../data/courses';

const FILTERS: { value: CourseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All courses' },
  { value: 'ai', label: 'AI & ML (new)' },
  { value: 'web', label: 'Web development' },
  { value: 'dsa', label: 'DSA' },
  { value: 'programming', label: 'Programming languages' },
];

const CoursesPage = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CourseCategory | 'all'>('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter(
      (course) =>
        (filter === 'all' || course.category === filter) &&
        (!q || `${course.title} ${course.tagline} ${course.description}`.toLowerCase().includes(q))
    );
  }, [query, filter]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO
        title="Courses | Bitwise School"
        description="Live and recorded courses in full stack web development, DSA, C++, Java, Python and React, plus new Generative AI, Applied AI and Forward Deployed Engineer tracks."
      />
      <Navbar />

      <main className="flex-grow">
        <PageHeader
          eyebrow="Courses"
          title="Find the right course for your next step"
          subtitle="Live classes, recordings of every session, assignments and projects. New: Generative AI, Applied AI and Forward Deployed Engineer tracks."
        >
          <label className="relative mx-auto block max-w-xl">
            <span className="sr-only">Search courses</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses, e.g. React or DSA"
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base text-ink shadow-lg shadow-ink/5 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
        </PageHeader>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter courses">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter === item.value
                    ? 'bg-ink text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {visible.length > 0 ? (
            <Stagger key={`${filter}-${query}`} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((course) => (
                <StaggerItem key={course.id} className="h-full">
                  <CourseCard course={course} />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 py-16 text-center">
              <p className="text-lg font-semibold text-ink">No courses match "{query}"</p>
              <p className="mt-2 text-slate-600">Try a different search or clear the filter.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CoursesPage;
