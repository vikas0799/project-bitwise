import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Twitter, Youtube } from 'lucide-react';
import Logo from './Logo';
import { courses } from '../data/courses';
import { CONTACT_EMAIL, PARENT_COMPANY_URL, SOCIAL_LINKS, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../config/site';

const SOCIALS = [
  { href: SOCIAL_LINKS.linkedin, label: 'LinkedIn', Icon: Linkedin },
  { href: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: Instagram },
  { href: SOCIAL_LINKS.youtube, label: 'YouTube', Icon: Youtube },
  { href: SOCIAL_LINKS.x, label: 'X (Twitter)', Icon: Twitter },
  { href: SOCIAL_LINKS.facebook, label: 'Facebook', Icon: Facebook },
];

const EXPLORE = [
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/notes', label: 'Interview notes' },
  { to: '/dsa-sheet', label: 'DSA sheet' },
  { to: '/projects', label: 'Project ideas' },
  { to: '/links', label: 'Useful links' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About us' },
  { to: '/faqs', label: 'FAQs' },
  { to: '/contact', label: 'Contact' },
];

const Footer = () => (
  <footer className="relative overflow-clip-safe bg-ink text-slate-400">
    <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-50 mask-radial" />
    <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />

    <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link to="/" aria-label="Bitwise School home">
            <Logo light />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6">
            Live coding courses and a free opportunities portal for Indian students. Let's build, bit by bit.
          </p>
          <div className="mt-6 flex gap-2">
            {SOCIALS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
          <div>
            <h3 className="text-sm font-semibold text-white">Courses</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link to={`/courses/${course.id}`} className="transition-colors hover:text-white">
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {EXPLORE.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-sm font-semibold text-white">Get in touch</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                  <Mail className="h-4 w-4 shrink-0" /> {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> 66 A Block, New Ashok Nagar, Delhi, India
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Bitwise School. A{' '}
          <a href={PARENT_COMPANY_URL} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white">
            Bitwise Ventures Group
          </a>{' '}
          company.
        </p>
        <div className="flex gap-6">
          <Link to="/legal/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link to="/legal/terms" className="hover:text-white">
            Terms
          </Link>
          <a href="/sitemap.xml" className="hover:text-white">
            Sitemap
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
