import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const NotFound = () => (
  <div className="flex min-h-screen flex-col bg-white">
    <SEO title="Page not found | Bitwise School" />
    <Navbar />
    <main className="relative flex flex-grow items-center justify-center overflow-clip-safe px-4 py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid mask-radial" />
      <div className="relative text-center">
        <p className="font-mono text-7xl font-bold text-gradient sm:text-8xl">404</p>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">This page doesn't exist</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-600">
          The link may be old or mistyped. These might be what you were looking for:
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
            Go to home <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/courses" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-semibold text-ink hover:bg-slate-50">
            Courses
          </Link>
          <Link to="/opportunities" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-semibold text-ink hover:bg-slate-50">
            Opportunities
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default NotFound;
