import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Clock, Copy, Mail, MapPin, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Reveal } from '../components/motion';
import { courses } from '../data/courses';
import {
  CONTACT_EMAIL,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
  gmailComposeLink,
  mailtoLink,
  whatsappLink,
} from '../config/site';

type Channel = 'whatsapp' | 'email';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  course: '',
  subject: '',
  message: '',
  callback: false,
};

const inputClass =
  'block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink shadow-sm placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100';

const Contact = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [sentVia, setSentVia] = useState<Channel | null>(null);
  const [copied, setCopied] = useState(false);
  // Set by whichever send button was clicked, just before the form submits.
  const channel = useRef<Channel>('whatsapp');

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const subject = formData.subject.trim() || 'Enquiry from bitwiseschool.com';
  const details = [
    `Name: ${formData.name.trim()}`,
    `Email: ${formData.email.trim()}`,
    ...(formData.phone.trim() ? [`Phone: ${formData.phone.trim()}`] : []),
    `Course: ${formData.course || 'Not selected'}`,
    ...(formData.callback ? ['Please call me back.'] : []),
  ];
  const emailLines = [formData.message.trim(), '', ...details];
  const whatsappText = [
    'Hi Bitwise School,',
    ...(formData.subject.trim() ? [`Subject: ${formData.subject.trim()}`] : []),
    '',
    formData.message.trim(),
    '',
    ...details,
  ].join('\n');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCopied(false);
    if (channel.current === 'whatsapp') {
      window.open(whatsappLink(whatsappText), '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = mailtoLink(subject, emailLines);
    }
    setSentVia(channel.current);
  };

  const copyMessage = async () => {
    const text = [`To: ${CONTACT_EMAIL}`, `Subject: ${subject}`, '', ...emailLines].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Some in-app browsers (Instagram, Facebook) block the Clipboard API.
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      setCopied(document.execCommand('copy'));
      area.remove();
    }
  };

  const CHANNELS = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: WHATSAPP_DISPLAY,
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
      note: 'Fastest way to reach us',
    },
    { icon: Mail, title: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, note: 'We reply within a day' },
    { icon: MapPin, title: 'Address', value: '66 A Block, New Ashok Nagar, Delhi, India' },
    { icon: Clock, title: 'Hours', value: 'Mon–Fri 5 PM–11 PM · Sat–Sun 9 AM–11 PM' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO title="Contact | Bitwise School" description="Talk to Bitwise School about courses, batches, fees or a free demo class." />
      <Navbar />

      <main className="flex-grow">
        <PageHeader
          eyebrow="Contact"
          title="Let's talk about your next step"
          subtitle="Questions about courses, batches, fees or a free demo class? Message us and we'll get back to you."
        />

        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Reveal className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-ink/5 sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">Send us a message</h2>
              <p className="mt-1 text-slate-600">Send it on WhatsApp or by email. We fill in the message for you.</p>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Full name *
                  <input name="name" required value={formData.name} onChange={handleChange} autoComplete="name" className={`${inputClass} mt-1.5`} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Email *
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} autoComplete="email" className={`${inputClass} mt-1.5`} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Phone
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" className={`${inputClass} mt-1.5`} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Course
                  <select name="course" value={formData.course} onChange={handleChange} className={`${inputClass} mt-1.5`}>
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.title}>
                        {course.title}
                      </option>
                    ))}
                    <option value="Not sure yet">Not sure yet</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Subject
                  <input name="subject" value={formData.subject} onChange={handleChange} className={`${inputClass} mt-1.5`} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Message *
                  <textarea
                    name="message"
                    required
                    rows={5}
                    maxLength={1500}
                    value={formData.message}
                    onChange={handleChange}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    name="callback"
                    checked={formData.callback}
                    onChange={(event) => setFormData((prev) => ({ ...prev, callback: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Please call me back
                </label>
                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                  <button
                    type="submit"
                    onClick={() => {
                      channel.current = 'whatsapp';
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
                  >
                    <MessageCircle className="h-5 w-5" /> Send on WhatsApp
                  </button>
                  <button
                    type="submit"
                    onClick={() => {
                      channel.current = 'email';
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-semibold text-white shadow-lg shadow-ink/20 transition hover:bg-ink-soft"
                  >
                    <Mail className="h-5 w-5" /> Send by email
                  </button>
                </div>

                {sentVia === 'whatsapp' && (
                  <div role="status" className="flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-ink sm:col-span-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold">WhatsApp is open with your message.</span> Press Send there and we'll
                      reply soon. Nothing opened?{' '}
                      <a href={whatsappLink(whatsappText)} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                        Open WhatsApp again
                      </a>
                      .
                    </p>
                  </div>
                )}

                {sentVia === 'email' && (
                  <div role="status" className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-ink sm:col-span-2">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold">Your email app should open with the message ready.</span> Press Send
                        there. If it didn't open, send it one of these ways:
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 sm:pl-8">
                      <a
                        href={gmailComposeLink(subject, emailLines)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300"
                      >
                        <Mail className="h-4 w-4 text-red-500" /> Send with Gmail
                      </a>
                      <a
                        href={whatsappLink(whatsappText)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300"
                      >
                        <MessageCircle className="h-4 w-4 text-brand-600" /> Send on WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={copyMessage}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300"
                      >
                        {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                        {copied ? 'Copied' : 'Copy message'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </Reveal>

          <div className="space-y-4 lg:col-span-5">
            {CHANNELS.map(({ icon: Icon, title, value, href, note }, index) => (
              <Reveal key={title} delay={index * 0.06}>
                <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{title}</p>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="text-slate-700 hover:text-brand-700"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-slate-700">{value}</p>
                    )}
                    {note && <p className="text-sm text-slate-500">{note}</p>}
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal delay={0.25}>
              <div className="relative overflow-clip-safe rounded-2xl bg-ink p-6 text-white">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
                <div className="relative">
                  <p className="text-lg font-bold">Book a free demo class</p>
                  <p className="mt-1 text-sm text-slate-300">See how we teach before you enroll.</p>
                  <a
                    href={whatsappLink("Hi Bitwise School, I'd like to book a free demo class.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-100"
                  >
                    <MessageCircle className="h-4 w-4" /> Book on WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <Link to="/faqs" className="inline-flex items-center gap-1 px-1 font-semibold text-brand-600 hover:text-brand-700">
                Read the FAQs <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
