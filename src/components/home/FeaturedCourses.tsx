import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CourseCard from '../CourseCard';
import SectionHeading from './SectionHeading';
import { Reveal, Stagger, StaggerItem } from '../motion';
import { courses, openCourses } from '../../data/courses';

const FeaturedCourses = () => (
  <section className="py-24 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          align="left"
          eyebrow="Courses"
          title="Pick a path and start building"
          subtitle="Each course runs for 5 months with live classes, recordings, assignments and projects."
        />
        <Reveal>
          <Link
            to="/courses"
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400"
          >
            View all {courses.length} courses
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>

      <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {openCourses.slice(0, 4).map((course) => (
          <StaggerItem key={course.id} className="h-full">
            <CourseCard course={course} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </section>
);

export default FeaturedCourses;
