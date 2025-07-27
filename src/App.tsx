
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import CoursesPage from './pages/CoursesPage';
import CourseDetail from './pages/CourseDetail';

import AboutUs from './pages/AboutUs';

import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import FAQsPage from './pages/FAQsPage';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        
        <Route path="/about" element={<AboutUs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetail />} />

        <Route path="/faqs" element={<FAQsPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal/:pageType" element={<Legal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
