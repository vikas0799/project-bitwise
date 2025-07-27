
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Globe, Users } from 'lucide-react';

const HomeHero = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submitted:', email);
    setEmail('');
    alert('Thank you for your interest! We will be in touch soon.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f5f7] to-white flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <p className="text-lg font-medium text-[#0052CC]">
                Let's build bit by bit
              </p>
              
              <p className="text-base text-gray-600 sm:text-lg max-w-xl mx-auto">
                Unlock your coding potential with our immersive live classes, 
                hands-on projects, and industry-focused curriculum. Join Delhi's 
                premier coding institute today.
              </p>
              
              <form onSubmit={handleSubmit} className="max-w-lg w-full">
                <div className="sm:flex">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:ring-[#0052CC] focus:border-[#0052CC]"
                    />
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button
                      type="submit"
                      className="block w-full py-3 px-4 rounded-md shadow bg-[#0052CC] text-white font-medium hover:bg-[#0747A6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052CC]"
                    >
                      Get Course Info
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  We care about your data. Read our{' '}
                  <Link to="/legal/privacy" className="font-medium text-gray-700 hover:text-[#0052CC]">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>

              <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-lg">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0052CC] hover:bg-[#0747A6]"
                >
                  Explore Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-5 py-3 border border-[#0052CC] text-base font-medium rounded-md text-[#0052CC] bg-white hover:bg-gray-100"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="hidden lg:block lg:w-1/2 flex items-center justify-center">
          <div className="bg-gradient-to-r from-white to-[#e6effc] flex items-center justify-center p-8 w-full h-full">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-6">
                <h2 className="text-2xl font-bold text-[#0052CC]">
                  Bitwise School of Technology
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-[#f4f5f7] rounded-md">
                  <div className="bg-[#0052CC] rounded-full p-2">
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Live Coding Classes</h3>
                    <p className="text-sm text-gray-600">Interactive sessions with industry experts</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-[#f4f5f7] rounded-md">
                  <div className="bg-[#0052CC] rounded-full p-2">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Multiple Tech Stacks</h3>
                    <p className="text-sm text-gray-600">From C++ to Full Stack Development</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-[#f4f5f7] rounded-md">
                  <div className="bg-[#0052CC] rounded-full p-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">1:1 Mentorship</h3>
                    <p className="text-sm text-gray-600">Personalized guidance and mock interviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
