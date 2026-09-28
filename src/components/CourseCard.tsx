import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BarChart3, Sparkles } from 'lucide-react';
import CourseCover from './CourseCover';
import { formatPrice, type Course } from '../data/courses';

const CourseCard = ({ course }: { course: Course }) => (
  <Link
    to={`/courses/${course.id}`}
    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
  >
    <div className="relative">
      <CourseCover course={course} />
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
        Live + recorded
      </span>
      {course.status === 'waitlist' && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-700 shadow">
          <Sparkles className="h-3 w-3" /> New
        </span>
      )}
    </div>

    <div className="flex flex-1 flex-col p-5">
      <h3 className="text-lg font-bold leading-snug text-ink">{course.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{course.tagline}</p>

      <div className="mb-5 mt-4 flex items-center gap-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-slate-400" />
          {course.duration}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          {course.level}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
        <span className={course.price === null ? 'text-sm font-semibold text-brand-700' : 'text-lg font-bold text-ink'}>
          {formatPrice(course.price)}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
          {course.status === 'waitlist' ? 'Join waitlist' : 'View course'}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  </Link>
);

export default CourseCard;
