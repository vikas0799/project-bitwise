import type { Course } from '../data/courses';

// Designed cover art for a course: brand gradient, faint grid, code symbol.
const CourseCover = ({ course, className = 'h-44' }: { course: Course; className?: string }) => (
  <div
    className={`relative overflow-clip-safe ${className}`}
    style={{ backgroundImage: `linear-gradient(135deg, ${course.cover.from}, ${course.cover.to})` }}
  >
    <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-70" />
    <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <span
      aria-hidden
      className="absolute inset-0 flex items-center justify-center font-mono text-5xl font-bold tracking-tight text-white/95 transition-transform duration-500 group-hover:scale-110"
    >
      {course.cover.symbol}
    </span>
  </div>
);

export default CourseCover;
