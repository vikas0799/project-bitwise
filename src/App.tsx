import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import Index from './pages/Index';
import { Toaster } from './components/ui/toaster';

// Home loads first; other pages are split into their own chunks.
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const FAQsPage = lazy(() => import('./pages/FAQsPage'));
const Contact = lazy(() => import('./pages/Contact'));
const Legal = lazy(() => import('./pages/Legal'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Resources = lazy(() => import('./pages/Resources'));
const NotesIndex = lazy(() => import('./pages/NotesIndex'));
const NoteDoc = lazy(() => import('./pages/NoteDoc'));
const DsaSheet = lazy(() => import('./pages/DsaSheet'));
const Projects = lazy(() => import('./pages/Projects'));
const Links = lazy(() => import('./pages/Links'));

// Start each new page at the top, or at #section when the link has a hash.
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // Lazily loaded pages may need a moment before the target exists.
    let tries = 0;
    const timer = setInterval(() => {
      const target = document.getElementById(hash.slice(1));
      if (target || ++tries > 20) {
        clearInterval(timer);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [pathname, hash]);

  return null;
}

function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Router>
          <ScrollToTop />
          <Suspense fallback={<div className="min-h-screen" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/notes" element={<NotesIndex />} />
              <Route path="/notes/:slug" element={<NoteDoc />} />
              <Route path="/dsa-sheet" element={<DsaSheet />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/links" element={<Links />} />
              <Route path="/faqs" element={<FAQsPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/legal/:pageType" element={<Legal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </Router>
      </MotionConfig>
    </LazyMotion>
  );
}

export default App;
