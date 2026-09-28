import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Hero from '../components/home/Hero';
import TechMarquee from '../components/home/TechMarquee';
import StatsBand from '../components/home/StatsBand';
import Features from '../components/home/Features';
import FeaturedCourses from '../components/home/FeaturedCourses';
import LearningPath from '../components/home/LearningPath';
import OpportunitiesTeaser from '../components/home/OpportunitiesTeaser';
import Instructor from '../components/home/Instructor';
import HomeFaq from '../components/home/HomeFaq';
import FinalCta from '../components/home/FinalCta';
import AiCareers from '../components/home/AiCareers';
import FreeResources from '../components/home/FreeResources';

const Index = () => (
  <div className="flex min-h-screen flex-col bg-white">
    <SEO
      title="Bitwise School | Live coding courses in DSA, Full Stack, C++, Java and Python"
      description="Live and recorded coding courses in DSA, full stack web development, C++, Java and Python, plus a free portal of open-source programs, jobs and hackathons for Indian students."
    />
    <Navbar />

    <main className="flex-grow">
      <Hero />
      <TechMarquee />
      <AiCareers />
      <FeaturedCourses />
      <StatsBand />
      <Features />
      <FreeResources />
      <OpportunitiesTeaser />
      <LearningPath />
      <Instructor />
      <HomeFaq />
      <FinalCta />
    </main>

    <Footer />
  </div>
);

export default Index;
