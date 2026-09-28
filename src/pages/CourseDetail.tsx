import { Link, useParams } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  ClipboardList,
  Code2,
  FolderGit2,
  MessageCircle,
  Wrench,
  ShieldCheck,
  Video,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Avatar from '../components/Avatar';
import CourseCard from '../components/CourseCard';
import CourseCover from '../components/CourseCover';
import { Reveal, Stagger, StaggerItem } from '../components/motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { courses, formatPrice, getCourse } from '../data/courses';
import { whatsappLink } from '../config/site';

const INCLUDES = [
  { icon: Video, text: 'Live classes + recording of every session' },
  { icon: ClipboardList, text: 'Assignments and quizzes' },
  { icon: MessageCircle, text: 'Weekly doubt-clearing sessions' },
  { icon: Code2, text: 'Projects with code review' },
  { icon: Briefcase, text: 'Placement support' },
  { icon: Award, text: 'Certificate of completion' },
];

const FAQS = [
  {
    q: 'Is this course suitable for beginners?',
    a: 'Yes. We start with the basics and move to advanced topics step by step. If a course needs a prerequisite, we will tell you before you enroll.',
  },
  {
    q: 'Will I get a certificate?',
    a: 'Yes, you receive a certificate of completion once you finish the modules and assignments.',
  },
  {
    q: 'How is this different from free tutorials?',
    a: 'You learn live with an instructor, get your doubts cleared every week, build reviewed projects and get career guidance.',
  },
  {
    q: 'What is the refund policy?',
    a: 'We offer a 7-day money-back guarantee: request a refund within 7 days of enrolling, as long as you have completed less than 25% of the course.',
  },
];

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const course = getCourse(courseId);

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <main className="flex flex-grow flex-col items-center justify-center px-4 py-24 text-center">
          <p className="font-mono text-sm font-semibold text-brand-600">404</p>
          <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">We couldn't find that course</h1>
          <p className="mt-3 text-slate-600">It may have been renamed. Browse all our courses instead.</p>
          <Link to="/courses" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
            View all courses <ArrowRight className="h-5 w-5" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const waitlist = course.status === 'waitlist';
  const enrollHref = whatsappLink(
    waitlist
      ? `Hi Bitwise School, please add me to the waitlist for ${course.title}.`
      : `Hi Bitwise School, I'd like to enroll in ${course.title}. Please share the next batch dates and fees.`
  );
  const related = courses.filter((c) => c.id !== course.id).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO title={`${course.title} | Bitwise School`} description={course.description} />
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-clip-safe bg-ink">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-60 mask-radial" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full blur-3xl"
            style={{ backgroundColor: `${course.cover.to}55` }}
          />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-600/25 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-20">
            <m.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-400">
                <Link to="/courses" className="hover:text-white">
                  Courses
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-slate-300">{course.title}</span>
              </nav>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{course.title}</h1>
              <p className="mt-3 text-lg font-medium text-brand-300">{course.tagline}</p>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{course.description}</p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                {[
                  { icon: Clock, text: course.duration },
                  { icon: BarChart3, text: course.level },
                  { icon: Video, text: 'Live + recorded' },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-slate-200 ring-1 ring-white/15">
                    <Icon className="h-4 w-4" /> {text}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-4">
                <Avatar name="Vikas Patel" size="md" className="ring-2 ring-white/20" />
                <div>
                  <p className="font-semibold text-white">Vikas Patel</p>
                  <p className="text-sm text-slate-400">Founder and lead instructor · Ex-Infosys</p>
                </div>
              </div>
            </m.div>

            <m.aside
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30">
                <CourseCover course={course} className="h-40" />
                <div className="p-6 sm:p-7">
                  <p className="text-sm text-slate-500">{waitlist ? 'First batch' : 'Course fee'}</p>
                  <p className={waitlist ? 'text-2xl font-extrabold text-brand-700' : 'text-3xl font-extrabold text-ink'}>
                    {formatPrice(course.price)}
                  </p>
                  {waitlist && (
                    <p className="mt-1 text-sm text-slate-500">Join the waitlist to hear first about dates, fees and early-bird seats.</p>
                  )}

                  <a
                    href={enrollHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
                  >
                    <MessageCircle className="h-5 w-5" /> {waitlist ? 'Join the waitlist on WhatsApp' : 'Enroll now on WhatsApp'}
                  </a>
                  <Link
                    to="/contact"
                    className="mt-3 flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-ink transition hover:bg-slate-50"
                  >
                    Ask a question
                  </Link>
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                    {waitlist ? 'Free to join, no payment needed' : '7-day money-back guarantee'}
                  </p>

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-sm font-semibold text-ink">This course includes</p>
                    <ul className="mt-4 space-y-3">
                      {INCLUDES.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
                          <Icon className="h-4 w-4 shrink-0 text-brand-600" /> {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </m.aside>
          </div>
        </section>

        {/* Details */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="space-y-16 lg:col-span-8">
              <Reveal>
                <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">What you'll be able to do</h2>
                <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
                  {course.outcomes.map((outcome) => (
                    <StaggerItem key={outcome}>
                      <div className="flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                        <span className="text-slate-700">{outcome}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </Reveal>

              <Reveal>
                <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Syllabus</h2>
                <p className="mt-2 text-slate-600">
                  {waitlist
                    ? `${course.syllabus.length} modules, ending in a capstone project you can put in your portfolio.`
                    : `${course.syllabus.length} modules over ${course.duration}, ending in a project you can put in your portfolio.`}
                </p>
                <Accordion type="multiple" defaultValue={['module-0']} className="mt-8 space-y-3">
                  {course.syllabus.map((module, index) => (
                    <AccordionItem
                      key={module.title}
                      value={`module-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white px-6 shadow-sm data-[state=open]:border-brand-200"
                    >
                      <AccordionTrigger className="py-5 text-left hover:no-underline">
                        <span className="flex items-center gap-4">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span>
                            <span className="block text-base font-semibold text-ink">{module.title}</span>
                            <span className="block text-sm font-normal text-slate-500">{module.topics.length} topics</span>
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="grid gap-2 pb-2 pl-[3.25rem] sm:grid-cols-2">
                          {module.topics.map((topic) => (
                            <li key={topic} className="flex items-center gap-2 text-sm text-slate-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {topic}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>

              {course.projects && (
                <Reveal>
                  <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Projects you'll build</h2>
                  <p className="mt-2 text-slate-600">Portfolio projects that show recruiters what you can ship.</p>
                  <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
                    {course.projects.map((project) => (
                      <StaggerItem key={project.title}>
                        <div className="flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                            <FolderGit2 className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block font-semibold text-ink">{project.title}</span>
                            <span className="mt-1 block text-sm leading-relaxed text-slate-600">{project.text}</span>
                          </span>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </Reveal>
              )}

              {course.tools && (
                <Reveal>
                  <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                    <Wrench className="h-6 w-6 text-brand-600" /> Tools you'll use
                  </h2>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {course.tools.map((tool) => (
                      <li key={tool} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm font-medium text-slate-700">
                        {tool}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              <Reveal>
                <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Who this course is for</h2>
                <ul className="mt-6 space-y-3 text-slate-700">
                  {[
                    'College students building a career in software development',
                    'Working professionals who want to upskill or switch careers',
                    'Anyone preparing for technical interviews',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /> {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-2xl bg-brand-50/70 p-5 text-slate-700">
                  <span className="font-semibold text-ink">Prerequisites: </span>
                  {course.prerequisites ??
                    "basic computer skills. Earlier programming experience helps but isn't required; we start from the basics."}
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-4">
              <Reveal className="lg:sticky lg:top-24">
                <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <h2 className="text-lg font-bold text-ink">Frequently asked</h2>
                  <Accordion type="single" collapsible className="mt-2">
                    {FAQS.map((faq) => (
                      <AccordionItem key={faq.q} value={faq.q} className="border-slate-100">
                        <AccordionTrigger className="text-left text-sm font-semibold text-ink hover:no-underline">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-slate-600">{faq.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  <a
                    href={enrollHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    <MessageCircle className="h-4 w-4" /> Talk to us on WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="border-t border-slate-200/70 bg-slate-50/70 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">You may also like</h2>
            </Reveal>
            <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <StaggerItem key={c.id} className="h-full">
                  <CourseCard course={c} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;
