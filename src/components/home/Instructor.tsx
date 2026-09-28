import { Link } from 'react-router-dom';
import { ArrowRight, Building2, GraduationCap, Laptop } from 'lucide-react';
import Avatar from '../Avatar';
import { Reveal } from '../motion';

const TEAM = ['Vikas Patel', 'Vishal Kumar', 'Rishabh Srivastav', 'Archana Gautam'];

const CREDENTIALS = [
  { icon: Laptop, text: '5+ years of industry experience, Ex-Infosys' },
  { icon: GraduationCap, text: 'Has taught at Chitkara University, LPU and Chandigarh University' },
  { icon: Building2, text: 'Full stack, Linux, DBMS, operating systems and computer networks' },
];

const Instructor = () => (
  <section className="py-24 sm:py-28">
    <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
      <Reveal className="lg:col-span-5">
        <div className="relative">
          <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-indigo-100/60 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-ink/10">
            <div className="relative h-28 bg-gradient-to-r from-brand-700 via-indigo-600 to-cyan-600">
              <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-60" />
            </div>
            <div className="px-7 pb-8">
              <Avatar name="Vikas Patel" size="lg" className="-mt-12 ring-4 ring-white" />
              <h3 className="mt-4 text-xl font-bold text-ink">Vikas Patel</h3>
              <p className="text-sm font-medium text-brand-600">Founder and lead instructor</p>
              <ul className="mt-6 space-y-3">
                {CREDENTIALS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="lg:col-span-7" delay={0.1}>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">Your instructor</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
          Taught by someone who has stood in both rooms: the classroom and the codebase
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          Vikas teaches in university classrooms and builds software. He saw the gap between what colleges teach and
          what the industry expects, and how little exposure most students get to open source, research and global
          opportunities. Bitwise exists to close that gap.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex -space-x-2">
            {TEAM.map((name, index) => (
              <Avatar key={name} name={name} size="sm" tone={index} className="ring-2 ring-white" />
            ))}
          </div>
          <p className="text-sm text-slate-600">
            With Vishal (DSA), Rishabh (AI) and Archana (operations).{' '}
            <Link to="/about#team" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
              Meet the team <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  </section>
);

export default Instructor;
