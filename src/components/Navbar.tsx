
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    courses: false,
    about: false,
    blog: false
  });

  const toggleDropdown = (dropdown: keyof typeof dropdownOpen) => {
    setDropdownOpen({
      courses: false,
      about: false,
      blog: false,
      [dropdown]: !dropdownOpen[dropdown]
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setDropdownOpen({
          courses: false,
          about: false,
          blog: false
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-[#0052CC] animate-slide-in">
                Bitwise School of Technology
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            {/* Courses Dropdown */}
            <div className="relative dropdown-container">
              <button 
                onClick={() => toggleDropdown('courses')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 flex items-center transition-colors duration-200"
              >
                Courses <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${dropdownOpen.courses ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen.courses && (
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <Link to="/courses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">All Courses</Link>
                    <Link to="/courses/cpp" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">C++</Link>
                    <Link to="/courses/java" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">Java</Link>
                    <Link to="/courses/dsa" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">DSA</Link>
                    <Link to="/courses/full-stack" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">Full-Stack Dev</Link>
                  </div>
                </div>
              )}
            </div>


            {/* About Us */}
            <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 transition-colors duration-200">
              About Us
            </Link>



            {/* Blog Dropdown */}
            <div className="relative dropdown-container">
              <button 
                onClick={() => toggleDropdown('blog')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 flex items-center transition-colors duration-200"
              >
                Blog <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${dropdownOpen.blog ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen.blog && (
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <Link to="/blog" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">Blog Articles</Link>
                    <Link to="/blog/ebooks" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">Free E-books</Link>
                  </div>
                </div>
              )}
            </div>

            {/* FAQs */}
            <Link to="/faqs" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 transition-colors duration-200">
              FAQs
            </Link>

            {/* Contact */}
            <Link to="/contact" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 transition-colors duration-200">
              Contact Us
            </Link>
          </div>



          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#0052CC] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0052CC]"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Link
              to="/courses"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              Courses
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
                            <Link
                  to="/blog"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 transition-colors duration-150"
                  onClick={() => setIsOpen(false)}
                >
                  Blog
                </Link>
            <Link
              to="/faqs"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              FAQs
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#0052CC] hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
