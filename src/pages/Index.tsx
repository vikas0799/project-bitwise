
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import HomeHero from '../components/HomeHero';
import ProgramHighlights from '../components/ProgramHighlights';
import CourseCard from '../components/CourseCard';

import Footer from '../components/Footer';

const Index = () => {
  const featuredCourses = [
    {
      id: 'cpp',
      title: 'C++ Programming Masterclass',
      description: 'Master C++ from basics to advanced concepts with hands-on projects and practice sessions.',
      image: '/computer-programming.jpg',
      duration: '8 weeks',
      students: 1250,
      level: 'All Levels' as const,
      price: 5000
    },
    {
      id: 'java',
      title: 'Java Full Course',
      description: 'Comprehensive Java course covering core concepts, OOP, data structures, and web development.',
      image: '/computer-programming.jpg',
      duration: '10 weeks',
      students: 1840,
      level: 'Beginner' as const,
      price: 5000
    },
    {
      id: 'dsa',
      title: 'Data Structures & Algorithms',
      description: 'In-depth learning of DSA concepts with problem-solving techniques for coding interviews.',
      image: '/data-structures.jpg',
      duration: '12 weeks',
      students: 2150,
      level: 'Intermediate' as const,
      price: 5000
    }
  ];



  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <HomeHero />
        
        {/* Program Highlights */}
        <ProgramHighlights />
        
        {/* Featured Courses */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Featured Courses
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Start your coding journey with our most popular courses
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link 
                to="/courses" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#0052CC] hover:bg-[#0747A6]"
              >
                Explore All Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="bg-[#0052CC] py-12 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <p className="text-4xl font-extrabold">4500+</p>
                <p className="text-lg mt-2">Students Trained</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold">96%</p>
                <p className="text-lg mt-2">Placement Rate</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold">120+</p>
                <p className="text-lg mt-2">Hiring Partners</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold">₹12 LPA</p>
                <p className="text-lg mt-2">Avg. Starting Salary</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Why Choose Us */}
        <section className="py-16 bg-[#f4f5f7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  Why Choose Bitwise School of Technology?
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                  At Bitwise School of Technology, we focus on creating job-ready developers through hands-on 
                  learning, real-world projects, and personalized mentorship.
                </p>
                
                <div className="mt-8">
                  {[
                    'Industry-experienced faculty with 8+ years average experience',
                    'Live project-based learning with real-world applications',
                    'Small batch sizes ensuring personal attention to each student',
                    'Dedicated placement team with connections to top companies',
                    'State-of-the-art infrastructure and coding platforms',
                    'Flexible schedule options including weekends and evenings'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start mt-6 first:mt-0">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-[#0052CC]" />
                      </div>
                      <p className="ml-3 text-lg text-gray-500">{item}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-10">
                  <Link 
                    to="/about" 
                    className="text-[#0052CC] font-medium hover:text-[#0747A6] flex items-center"
                  >
                    Learn more about Bitwise School of Technology
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </Link>
                </div>
              </div>
              
              <div className="mt-12 lg:mt-0">
                <div className="aspect-w-3 aspect-h-2 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/students-coding.jpg"
                    alt="Students learning programming"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="aspect-w-3 aspect-h-2 rounded-lg overflow-hidden shadow-md">
                    <img
                      src="/lovable-uploads/48e540e5-6a25-44e4-b3f7-80f3bfc2777a.png"
                      alt="Instructor teaching a class"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-w-3 aspect-h-2 rounded-lg overflow-hidden shadow-md">
                    <img
                      src="/lovable-uploads/7293c494-769c-421b-9028-d8ccb0bdd80a.png"
                      alt="Student coding on a laptop"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        

        
        {/* CTA Section */}
        <section className="bg-[#0052CC] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Ready to start your coding journey?
            </h2>
            <p className="mt-4 text-xl max-w-2xl mx-auto">
              Join Delhi's premier coding institute and transform your career
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-[#0052CC] bg-white hover:bg-gray-50"
              >
                Schedule a Free Demo
              </Link>
              <Link 
                to="/courses" 
                className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-[#0747A6]"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
