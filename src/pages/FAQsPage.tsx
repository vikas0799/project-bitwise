import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Reveal } from '../components/motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { CONTACT_EMAIL, whatsappLink } from '../config/site';

const FAQ_CATEGORIES = [
  {
    id: 'general',
    title: 'General',
    questions: [
      {
        q: 'What is Bitwise School?',
        a: 'Bitwise School is a software training institute based in Delhi, India. We teach programming languages, data structures and algorithms, web development and more, with a focus on hands-on projects.',
      },
      {
        q: 'Do I need prior programming experience to join?',
        a: "No. Beginner courses start from the absolute basics. For advanced courses we'll tell you what to learn first so you can keep up.",
      },
      {
        q: 'How are your courses different from free online tutorials?',
        a: 'You get a structured path with live classes, weekly doubt-clearing sessions, reviewed projects and placement support, instead of learning alone.',
      },
    ],
  },
  {
    id: 'courses',
    title: 'Courses',
    questions: [
      {
        q: 'What courses do you offer?',
        a: 'Full Stack Web Development (MERN), Data Structures & Algorithms, C++, Java, Python and React. Each course page has its full syllabus.',
      },
      {
        q: 'How long are the courses?',
        a: 'Each course runs for about 5 months, with weekday evening and weekend batch options.',
      },
      {
        q: 'What does a typical week look like?',
        a: 'Live classes, coding practice, assignments and quizzes, plus a weekly doubt-clearing session. Every course ends with a project for your portfolio.',
      },
    ],
  },
  {
    id: 'admissions',
    title: 'Admissions and fees',
    questions: [
      {
        q: 'How do I enroll?',
        a: `Open the course you want and tap "Enroll now" to message us on WhatsApp, or write to ${CONTACT_EMAIL}. We'll share batch dates, fees and payment details.`,
      },
      {
        q: 'What payment options do you accept?',
        a: 'Ask us when you enroll and we will share the current payment options, including instalments where available.',
      },
      {
        q: 'Do you offer discounts?',
        a: 'Ask us about current offers for students and group enrolments.',
      },
      {
        q: 'What is the refund policy?',
        a: 'We offer a 7-day money-back guarantee: request a refund within 7 days of enrolling, as long as you have completed less than 25% of the course.',
      },
    ],
  },
  {
    id: 'placements',
    title: 'Placements and careers',
    questions: [
      {
        q: 'Do you provide placement assistance?',
        a: 'Yes. Placement support includes resume reviews, interview preparation, mock interviews, and sharing suitable openings and referrals where we can. We do not guarantee placement or a specific salary.',
      },
      {
        q: 'Which companies hire your students?',
        a: 'We will publish verified student outcomes here, with written consent from each student, as our batches complete. Until then, ask us for references from past students.',
      },
      {
        q: 'What salary can I expect after the course?',
        a: 'Salary depends on your skills, projects, prior experience and the hiring company, so we do not promise a number. We help you build the skills and portfolio that lead to better offers.',
      },
    ],
  },
  {
    id: 'classes',
    title: 'Classes and schedule',
    questions: [
      {
        q: 'Are the classes online?',
        a: 'Yes. Classes are held live online and every session is recorded. Ask us about offline batches.',
      },
      {
        q: 'What are the class timings?',
        a: 'We run weekday evening and weekend batches. Exact timings are shared when a batch is announced.',
      },
      {
        q: 'What if I miss a class?',
        a: 'Every live session is recorded, so you can catch up any time. You can also bring questions to the weekly doubt-clearing session.',
      },
    ],
  },
];

const FAQsPage = () => {
  const [active, setActive] = useState(FAQ_CATEGORIES[0].id);
  const category = FAQ_CATEGORIES.find((c) => c.id === active) ?? FAQ_CATEGORIES[0];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO title="FAQs | Bitwise School" description="Answers about Bitwise School courses, fees, refunds, placement support and class timings." />
      <Navbar />

      <main className="flex-grow">
        <PageHeader
          eyebrow="FAQs"
          title="Frequently asked questions"
          subtitle="Courses, admissions, refunds, placement support and class timings."
        />

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="FAQ categories">
            {FAQ_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active === c.id}
                onClick={() => setActive(c.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active === c.id
                    ? 'bg-ink text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>

          <Reveal key={category.id} className="mt-10" y={12}>
            <Accordion type="single" collapsible className="space-y-3">
              {category.questions.map((item) => (
                <AccordionItem
                  key={item.q}
                  value={item.q}
                  className="rounded-2xl border border-slate-200 bg-white px-6 shadow-sm data-[state=open]:border-brand-200"
                >
                  <AccordionTrigger className="py-5 text-left text-base font-semibold text-ink hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-base leading-relaxed text-slate-600">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>

          <Reveal className="mt-16">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 text-center">
              <h2 className="text-xl font-bold text-ink">Didn't find your answer?</h2>
              <p className="mt-2 text-slate-600">Message us and we'll get back to you soon.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href={whatsappLink('Hi Bitwise School, I have a question.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
                >
                  <MessageCircle className="h-5 w-5" /> WhatsApp us
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-slate-50"
                >
                  <Mail className="h-5 w-5" /> Email us
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-slate-50"
                >
                  Contact page
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQsPage;
