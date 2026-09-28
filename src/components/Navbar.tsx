import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight, ChevronDown, HelpCircle, Info, Mail, Menu, Sparkles, X } from 'lucide-react';
import Logo from './Logo';
import { openCourses, upcomingCourses, type Course } from '../data/courses';
import { resources } from '../data/resources';

type MenuId = 'courses' | 'resources' | 'about';

const ABOUT_LINKS = [
  { to: '/about', title: 'About us', description: 'Our story, team and mission', icon: Info },
  { to: '/faqs', title: 'FAQs', description: 'Courses, fees, refunds and timings', icon: HelpCircle },
  { to: '/contact', title: 'Contact', description: 'WhatsApp, email and free demo class', icon: Mail },
];

const RESOURCE_PATHS = ['/resources', '/notes', '/dsa-sheet', '/projects', '/links', '/blog'];
const ABOUT_PATHS = ['/about', '/faqs', '/contact'];

const linkClass = (active: boolean) =>
  `inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100/80 hover:text-ink'
  }`;

const CourseIcon = ({ course }: { course: Course }) => (
  <span
    aria-hidden
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold text-white"
    style={{ backgroundImage: `linear-gradient(135deg, ${course.cover.from}, ${course.cover.to})` }}
  >
    {course.cover.symbol}
  </span>
);

const CourseLink = ({ course }: { course: Course }) => (
  <Link to={`/courses/${course.id}`} className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
    <CourseIcon course={course} />
    <span className="min-w-0">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        {course.title}
        {course.status === 'waitlist' && (
          <span className="rounded-full bg-brand-100 px-1.5 py-px text-[10px] font-bold uppercase text-brand-800">New</span>
        )}
      </span>
      <span className="block text-xs text-slate-500">{course.tagline}</span>
    </span>
  </Link>
);

const IconLink = ({ to, title, description, icon: Icon }: { to: string; title: string; description: string; icon: typeof Info }) => (
  <Link to={to} className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
      <Icon className="h-[18px] w-[18px]" />
    </span>
    <span>
      <span className="block text-sm font-semibold text-ink">{title}</span>
      <span className="block text-xs text-slate-500">{description}</span>
    </span>
  </Link>
);

// Wide panels centre on the whole menu bar; small ones sit under their button.
const Panel = ({ className, children }: { className: string; children: ReactNode }) => (
  <div className={`absolute top-full z-50 pt-3 ${className}`}>
    <m.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-ink/10"
    >
      {children}
    </m.div>
  </div>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!openMenu) return;
    const onPointer = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  const toggle = (id: MenuId) => setOpenMenu((current) => (current === id ? null : id));
  const isIn = (paths: string[]) => paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const trigger = (id: MenuId, label: string, active: boolean) => (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-expanded={openMenu === id}
      aria-haspopup="true"
      className={`${linkClass(active)} gap-1`}
    >
      {label}
      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMenu === id ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-lg'
          : 'border-transparent bg-white/60 backdrop-blur-md'
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Bitwise School home" className="shrink-0">
          <Logo />
        </Link>

        <div ref={menuRef} className="relative hidden items-center gap-1 md:flex">
          <div>
            {trigger('courses', 'Courses', pathname.startsWith('/courses'))}
            <AnimatePresence>
              {openMenu === 'courses' && (
                <Panel className="left-1/2 w-[40rem] -translate-x-1/2">
                  <div className="rounded-xl bg-brand-50/70 p-2">
                    <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
                      <Sparkles className="h-3.5 w-3.5" /> New courses, launching soon
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {upcomingCourses.map((course) => (
                        <CourseLink key={course.id} course={course} />
                      ))}
                    </div>
                  </div>
                  <p className="px-2.5 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Enrolling now</p>
                  <div className="grid grid-cols-2 gap-1">
                    {openCourses.map((course) => (
                      <CourseLink key={course.id} course={course} />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="text-slate-600">Not sure where to start? We'll help you pick.</span>
                    <Link to="/courses" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
                      All courses <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Panel>
              )}
            </AnimatePresence>
          </div>

          <NavLink to="/opportunities" className={({ isActive }) => linkClass(isActive)}>
            Opportunities
            <span className="ml-1.5 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Free
            </span>
          </NavLink>

          <div>
            {trigger('resources', 'Resources', isIn(RESOURCE_PATHS))}
            <AnimatePresence>
              {openMenu === 'resources' && (
                <Panel className="left-1/2 w-[36rem] -translate-x-1/2">
                  <div className="grid grid-cols-2 gap-1">
                    {resources
                      .filter((r) => r.to !== '/opportunities')
                      .map((r) => (
                        <IconLink key={r.to} to={r.to} title={r.title} description={r.description} icon={r.icon} />
                      ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="text-slate-600">All free, no sign-up.</span>
                    <Link to="/resources" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
                      All resources <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Panel>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            {trigger('about', 'About', isIn(ABOUT_PATHS))}
            <AnimatePresence>
              {openMenu === 'about' && (
                <Panel className="right-0 w-72">
                  {ABOUT_LINKS.map((link) => (
                    <IconLink key={link.to} {...link} />
                  ))}
                </Panel>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Link
          to="/courses"
          className="group hidden items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 lg:inline-flex"
        >
          Explore courses
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <m.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white md:hidden"
          >
            <div className="space-y-6 px-4 py-5">
              <div>
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Learn</p>
                <div className="mt-1 space-y-0.5">
                  <NavLink to="/courses" end className={({ isActive }) => `${linkClass(isActive)} w-full text-base`}>
                    All courses
                  </NavLink>
                  {upcomingCourses.map((course) => (
                    <NavLink key={course.id} to={`/courses/${course.id}`} className={({ isActive }) => `${linkClass(isActive)} w-full text-base`}>
                      {course.title}
                      <span className="ml-2 rounded-full bg-brand-100 px-1.5 py-px text-[10px] font-bold uppercase text-brand-800">New</span>
                    </NavLink>
                  ))}
                  <NavLink to="/opportunities" className={({ isActive }) => `${linkClass(isActive)} w-full text-base`}>
                    Opportunities
                    <span className="ml-2 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Free</span>
                  </NavLink>
                </div>
              </div>
              <div>
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Resources</p>
                <div className="mt-1 space-y-0.5">
                  {resources
                    .filter((r) => r.to !== '/opportunities')
                    .map((r) => (
                      <NavLink key={r.to} to={r.to} className={({ isActive }) => `${linkClass(isActive)} w-full text-base`}>
                        {r.title}
                      </NavLink>
                    ))}
                </div>
              </div>
              <div>
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">About</p>
                <div className="mt-1 space-y-0.5">
                  {ABOUT_LINKS.map((link) => (
                    <NavLink key={link.to} to={link.to} className={({ isActive }) => `${linkClass(isActive)} w-full text-base`}>
                      {link.title}
                    </NavLink>
                  ))}
                </div>
              </div>
              <Link to="/courses" className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white">
                Explore courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
