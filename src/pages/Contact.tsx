
import { useState } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    course: 'Select a course',
    callback: false
  });
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // In a real app, you'd send this data to a server
    setFormSubmitted(true);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      course: 'Select a course',
      callback: false
    });
    
    // Show success for 5 seconds
    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#f4f5f7] to-white text-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-[#0052CC]">
              Contact Us
            </h1>
            <p className="mt-4 text-xl max-w-2xl mx-auto text-gray-600">
              Get in touch with our team for inquiries, support, or to schedule a free demo
            </p>
          </div>
        </section>
        
        {/* Contact Info & Form */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Send Us a Message
                </h2>
                
                {formSubmitted ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-2">Thank you for contacting us!</h3>
                    <p>We have received your message and will get back to you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0052CC] focus:ring-[#0052CC]"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0052CC] focus:ring-[#0052CC]"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0052CC] focus:ring-[#0052CC]"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                          Interested Course
                        </label>
                        <select
                          name="course"
                          id="course"
                          value={formData.course}
                          onChange={handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0052CC] focus:ring-[#0052CC]"
                        >
                          <option value="Select a course">Select a course</option>
                          <option value="C++ Programming">C++ Programming</option>
                          <option value="Java Full Course">Java Full Course</option>
                          <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                          <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                          <option value="Python for Beginners">Python for Beginners</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        id="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0052CC] focus:ring-[#0052CC]"
                      />
                    </div>
                    
                    <div className="mt-6">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        id="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0052CC] focus:ring-[#0052CC]"
                      />
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex items-start">
                        <input
                          id="callback"
                          name="callback"
                          type="checkbox"
                          checked={formData.callback}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 rounded border-gray-300 text-[#0052CC] focus:ring-[#0052CC] mt-1"
                        />
                        <label htmlFor="callback" className="ml-2 block text-sm text-gray-700">
                          Request a callback from our team
                        </label>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-md font-medium"
                      >
                        Submit
                      </button>
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        * Required fields
                      </p>
                    </div>
                  </form>
                )}
              </div>
              
              {/* Contact Info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>
                
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="p-6 space-y-6">
                    <div className="flex items-start">
                      <MapPin className="h-6 w-6 text-[#0052CC] mt-1" />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Address</h3>
                        <p className="text-gray-600">
                          66A New Ashok Nagar<br />
                          Delhi, India
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Phone className="h-6 w-6 text-[#0052CC] mt-1" />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Phone</h3>
                        <p className="text-gray-600">
                          +91 987 654 3210<br />
                          +91 123 456 7890
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail className="h-6 w-6 text-[#0052CC] mt-1" />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Email</h3>
                        <p className="text-gray-600">
                          bitwiseschool@gmail.com
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-6 w-6 text-[#0052CC] mt-1" />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Hours</h3>
                        <p className="text-gray-600">
                          Saturday - Sunday: 9:00 AM - 11:00 PM<br />
                          Monday - Friday: 5:00 PM - 11:00 PM
                        </p>
                      </div>
                    </div>
                  </div>
                  

                </div>
                

              </div>
            </div>
          </div>
        </section>
        
        {/* Book a Demo Section */}
        <section className="py-12 bg-[#0052CC] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl mb-6">
              Book a Free Demo Class
            </h2>
            <p className="text-xl max-w-2xl mx-auto mb-8">
              Experience our teaching methodology firsthand and explore how we can help you achieve your coding goals
            </p>
            <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-[#0052CC] bg-white hover:bg-gray-50">
              Schedule Your Free Demo
            </button>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Find quick answers to common questions
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  How can I enroll in a course?
                </h3>
                <p className="text-gray-600">
                  You can enroll through our website, by visiting our campus, or by contacting our admissions team directly via phone or email.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Do you offer online classes?
                </h3>
                <p className="text-gray-600">
                  Yes, all our courses are available both online and offline to provide flexibility for our students.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  What are the payment options?
                </h3>
                <p className="text-gray-600">
                  We accept credit/debit cards, net banking, UPI, and also offer EMI options through various partners.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Do you provide placement assistance?
                </h3>
                <p className="text-gray-600">
                  Yes, we have a dedicated placement team that works with 120+ hiring partners to help you secure your dream job.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <a 
                href="/faqs" 
                className="text-purple-600 font-medium hover:text-purple-700"
              >
                View all FAQs
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
