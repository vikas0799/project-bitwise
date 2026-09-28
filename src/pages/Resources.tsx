import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import { Stagger, StaggerItem } from '../components/motion';
import { resources } from '../data/resources';

const Resources = () => (
  <div className="flex min-h-screen flex-col bg-white">
    <SEO
      title="Free resources for placement prep | Bitwise School"
      description="Free interview notes, a DSA sheet, project ideas, AI career guides, student perks and useful links for Indian students."
    />
    <Navbar />

    <main className="flex-grow">
      <PageHeader
        eyebrow="Free resources"
        title="Everything you need to get placement-ready"
        subtitle="Notes, practice, projects and career guides. Free for every student, no sign-up."
      />

      <Stagger className="mx-auto grid max-w-6xl gap-5 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {resources.map(({ to, title, description, icon: Icon }) => (
          <StaggerItem key={to} className="h-full">
            <Link
              to={to}
              className="spotlight group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg shadow-brand-600/25 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-6 text-lg font-bold text-ink">{title}</h2>
              <p className="mt-2 flex-1 leading-relaxed text-slate-600">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </main>

    <Footer />
  </div>
);

export default Resources;
