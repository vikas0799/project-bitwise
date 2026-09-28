import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Lightbulb, Target, Users, Wrench, Award } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import { Reveal, Stagger, StaggerItem } from '../components/motion';
import { CONTACT_EMAIL } from '../config/site';

// Photos: put real headshots in /public/team and switch the Avatar for an <img>.
const TEAM = [
  {
    name: 'Vikas Patel',
    role: 'Founder and Full Stack Instructor',
    bio: '5+ years of industry experience, Ex-Infosys. Has taught full stack, Linux, DBMS, OS and CN at Chitkara, LPU and CU.',
  },
  { name: 'Vishal Kumar', role: 'DSA Instructor', bio: 'Ex-Pine Labs, 5 years total experience.' },
  { name: 'Rishabh Srivastav', role: 'AI Instructor', bio: '5 years of total experience, Ex-National Instruments (NI).' },
  { name: 'Archana Gautam', role: 'Operations Head', bio: 'Ensuring smooth operations and student success.' },
];

const VALUES = [
  { icon: Lightbulb, title: 'Innovation', text: 'We embrace new technologies and teaching methods to keep what we teach current.' },
  { icon: Users, title: 'Community', text: 'A supportive learning environment where students grow together.' },
  { icon: Award, title: 'Excellence', text: 'High standards in everything we do, from teaching to student support.' },
  { icon: Wrench, title: 'Practicality', text: 'Real-world skills that translate directly into careers.' },
];

const AboutUs = () => (
  <div className="flex min-h-screen flex-col bg-white">
    <SEO
      title="About | Bitwise School"
      description="Bitwise School is run by Vikas Patel, a software engineer who has taught at Chitkara University, LPU and Chandigarh University."
    />
    <Navbar />

    <main className="flex-grow">
      <PageHeader
        eyebrow="About us"
        title="Closing the gap between college and industry"
        subtitle="We teach the skills companies hire for, and give students the exposure most classrooms never do."
      />

      {/* Story */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">Our story</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Built from years in the classroom</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-600">
            <p>
              Bitwise School is run by Vikas Patel, a software engineer and university faculty member who has taught
              full stack web development, Linux, DBMS, operating systems and computer networks at Chitkara University,
              LPU and Chandigarh University.
            </p>
            <p>
              In those classrooms he saw a gap between what colleges teach and what the software industry expects, and
              how little exposure most students get to open source, research and global opportunities. Bitwise exists
              to close that gap.
            </p>
            <p>
              Our approach combines rigorous technical training with practical, hands-on projects, so students are
              ready to contribute from day one.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative">
            <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-200/60 via-indigo-100/60 to-cyan-100/60 blur-2xl" />
            <img
              src="/students-coding.jpg"
              alt="Students coding in a classroom"
              loading="lazy"
              className="relative aspect-[3/2] w-full rounded-3xl object-cover shadow-2xl shadow-ink/15"
            />
          </div>
        </Reveal>
      </section>

      {/* Vision and mission */}
      <section className="bg-slate-50/70 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Stagger className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Compass,
                title: 'Our vision',
                text: 'Make India a global hub for software talent by creating skilled, innovative, industry-ready programmers who can compete on the world stage.',
              },
              {
                icon: Target,
                title: 'Our mission',
                text: 'Bridge the gap between traditional education and industry needs with immersive, hands-on coding education focused on practical skills, problem solving and real projects.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <StaggerItem key={title}>
                <div className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg shadow-brand-600/25">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-ink">{title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-slate-600">{text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">Our values</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">What guides how we teach</h2>
        </Reveal>
        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <StaggerItem key={title}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Team */}
      <section id="team" className="scroll-mt-20 bg-slate-50/70 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">The team</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Meet our team and mentors</h2>
            <p className="mt-4 text-lg text-slate-600">Instructors who bring industry experience into the classroom.</p>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member, index) => (
              <StaggerItem key={member.name}>
                <div className="h-full rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <Avatar name={member.name} size="lg" tone={index} className="mx-auto" />
                  <h3 className="mt-5 text-lg font-bold text-ink">{member.name}</h3>
                  <p className="text-sm font-medium text-brand-600">{member.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{member.bio}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-10 text-center text-slate-600">
            Want to mentor with us? Write to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-600 hover:text-brand-700">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-clip-safe rounded-[2rem] bg-ink px-6 py-14 text-center sm:px-12">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-60 mask-radial" />
            <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Ready to start building?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Pick a course, or tell us your goal and we'll help you choose.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/courses"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-ink transition hover:bg-slate-100"
                >
                  Explore courses <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>

    <Footer />
  </div>
);

export default AboutUs;
