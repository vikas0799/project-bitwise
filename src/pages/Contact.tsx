import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Reveal } from '../components/motion';
import { courses } from '../data/courses';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_NUMBER, mailtoLink, whatsappLink } from '../config/site';

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
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    window.location.href = mailtoLink(formData.subject || 'Enquiry from bitwiseschool.com', [
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Phone: ${formData.phone}`,
      `Course: ${formData.course || 'Not selected'}`,
      `Callback requested: ${formData.callback ? 'Yes' : 'No'}`,
      '',
      formData.message,
    ]);
    setFormSubmitted(true);
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
              <p className="mt-1 text-slate-600">Your email app will open with the message filled in.</p>

              {formSubmitted && (
                <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold">Your email app should now be open.</span> Press Send there to reach us.
                    If nothing opened, email{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                      {CONTACT_EMAIL}
                    </a>{' '}
                    or message us on{' '}
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="underline">
                      WhatsApp
                    </a>
                    .
                  </p>
                </div>
              )}

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
                  <textarea name="message" required rows={5} value={formData.message} onChange={handleChange} className={`${inputClass} mt-1.5`} />
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
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 sm:col-span-2"
                >
                  <Send className="h-4 w-4" /> Send message
                </button>
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
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
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
