import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';
import { Reveal } from '../motion';
import { gmailComposeLink, mailtoLink, whatsappLink } from '../../config/site';

const SUBJECT = 'Course info request';
const WHATSAPP_TEXT = "Hi Bitwise School, I'd like details about your courses and the next batch.";

const FinalCta = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const lines = [
    'Hi Bitwise School, please send me details of your courses and upcoming batches.',
    '',
    `My email: ${email.trim()}`,
  ];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    window.location.href = mailtoLink(SUBJECT, lines);
    setSent(true);
  };

  return (
    <section className="px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-clip-safe rounded-[2rem] bg-ink px-6 py-16 text-center shadow-2xl shadow-ink/30 sm:px-12 lg:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-60 mask-radial" />
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-brand-500/40 blur-3xl animate-blob" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl animate-blob [animation-delay:-9s]" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Ready to start <span className="text-gradient-light">building?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              Tell us which course you're interested in. We'll share batch dates, fees and a free demo slot.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={whatsappLink(WHATSAPP_TEXT)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
              >
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-ink transition hover:bg-slate-100"
              >
                Schedule a free demo
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <label htmlFor="cta-email" className="sr-only">
                Email address
              </label>
              <input
                id="cta-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                <Mail className="h-4 w-4" /> Email me details
              </button>
            </form>
            {sent ? (
              <p role="status" className="mt-3 text-sm text-slate-300">
                Email app didn't open?{' '}
                <a
                  href={gmailComposeLink(SUBJECT, lines)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white underline underline-offset-2"
                >
                  Send with Gmail
                </a>{' '}
                or{' '}
                <a
                  href={whatsappLink(WHATSAPP_TEXT)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white underline underline-offset-2"
                >
                  message us on WhatsApp
                </a>
                .
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-400">Opens your email app with the request filled in.</p>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default FinalCta;
