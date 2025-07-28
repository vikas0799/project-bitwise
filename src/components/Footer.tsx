
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and About */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center mb-4">
              <span className="code-text text-xl font-bold text-white">Bitwise School of Technology</span>
            </Link>
            <p className="text-gray-300 mb-4 max-w-md">
              Transform your coding journey with Delhi's premier technology training institute. 
              Hands-on learning, expert mentorship, and job-ready skills to excel in the tech industry.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61578938786384" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://x.com/bitwiseschool" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
                <span className="sr-only">X (Twitter)</span>
              </a>
              <a href="https://www.instagram.com/bitwiseschooloftechnology/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://www.linkedin.com/in/bitwise-school-of-technology-5a5296377/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="https://www.youtube.com/@bitwiseschool" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Youtube size={20} />
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>
          
          {/* Courses */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Courses</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses/cpp" className="text-gray-300 hover:text-white">C++ Programming</Link>
              </li>
              <li>
                <Link to="/courses/java" className="text-gray-300 hover:text-white">Java Full Course</Link>
              </li>
              <li>
                <Link to="/courses/dsa" className="text-gray-300 hover:text-white">Data Structures & Algorithms</Link>
              </li>
              <li>
                <Link to="/courses/full-stack" className="text-gray-300 hover:text-white">Full-Stack Development</Link>
              </li>
              <li>
                <Link to="/courses" className="text-gray-300 hover:text-white">View All Courses</Link>
              </li>
            </ul>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">About Us</Link>
              </li>
              <li>
                <Link to="/success-stories" className="text-gray-300 hover:text-white">Success Stories</Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white">Blog</Link>
              </li>
              <li>
                <Link to="/faqs" className="text-gray-300 hover:text-white">FAQs</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white">Contact Us</Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <address className="not-italic text-gray-300">
              <p className="mb-2">66 A Block</p>
              <p className="mb-2">New Ashok Nagar</p>
              <p className="mb-2">Delhi, India</p>
            </address>
            <p className="flex items-center text-gray-300 mb-2">
              <Mail className="h-4 w-4 mr-2" />
              <a href="mailto:bitwiseschool@gmail.com" className="hover:text-white">bitwiseschool@gmail.com</a>
            </p>
            <p className="text-gray-300">
              <a href="tel:+919876543210" className="hover:text-white">+91 987 654 3210</a>
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Bitwise School of Technology. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/legal/privacy" className="text-gray-400 text-sm hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/legal/terms" className="text-gray-400 text-sm hover:text-white">
                Terms & Conditions
              </Link>
              <Link to="/sitemap" className="text-gray-400 text-sm hover:text-white">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
