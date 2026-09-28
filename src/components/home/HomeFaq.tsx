import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import SectionHeading from './SectionHeading';
import { Reveal } from '../motion';

const FAQS = [
  {
    q: 'Do I need prior programming experience?',
    a: "No. Beginner courses start from the absolute basics. For advanced courses we'll tell you what to learn first so you can keep up.",
  },
  {
    q: 'Are the classes live or recorded?',
    a: 'Both. Classes are live so you can ask questions, and you get the recording of every session to revise later.',
  },
  {
    q: 'Do you guarantee a job?',
    a: 'No, and be careful of anyone who does. We give placement support: resume reviews, interview preparation, mock interviews and referrals where we can.',
  },
  {
    q: 'What is your refund policy?',
    a: 'We offer a 7-day money-back guarantee: request a refund within 7 days of enrolling, as long as you have completed less than 25% of the course.',
  },
];

const HomeFaq = () => (
  <section className="bg-slate-50/70 py-24 sm:py-28">
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="FAQs" title="Questions students ask us" />

      <Reveal className="mt-12">
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((faq) => (
            <AccordionItem
              key={faq.q}
              value={faq.q}
              className="rounded-2xl border border-slate-200 bg-white px-6 shadow-sm data-[state=open]:border-brand-200"
            >
              <AccordionTrigger className="py-5 text-left text-base font-semibold text-ink hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-slate-600">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>

      <Reveal className="mt-8 text-center">
        <Link to="/faqs" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
          See all FAQs <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </div>
  </section>
);

export default HomeFaq;
