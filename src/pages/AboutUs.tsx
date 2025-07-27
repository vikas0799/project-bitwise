
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#f4f5f7] to-white text-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-[#0052CC]">
              About Bitwise School of Technology
            </h1>
            <p className="mt-4 text-xl max-w-2xl mx-auto text-gray-600">
              We're on a mission to transform coding education in India
            </p>
          </div>
        </section>
        
        {/* Our Story */}
        <section id="our-story" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
                  Our Story
                </h2>
                <p className="text-lg text-gray-500 mb-4">
                  Bitwise School of Technology was founded in 2019 by a group of passionate tech professionals who saw 
                  a gap between traditional education and industry requirements in the Indian software development landscape.
                </p>
                <p className="text-lg text-gray-500 mb-4">
                  Starting with just 20 students in a small office in Chandigarh, we've now grown to become one of North India's 
                  premier coding academies, having trained over 4,500 students who are now working with top companies nationwide.
                </p>
                <p className="text-lg text-gray-500">
                  Our approach combines rigorous technical training with practical, hands-on experience, ensuring that 
                  our students are not just job-ready but are prepared to excel in their careers from day one.
                </p>
              </div>
              
              <div className="mt-10 lg:mt-0">
                <div className="aspect-w-3 aspect-h-2 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/src/assets/students-coding.jpg"
                    alt="Students learning at Bitwise School of Technology"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Vision & Mission */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Vision & Mission
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-600">
                  To be the catalyst that transforms India into a global hub for software development talent,
                  by creating skilled, innovative, and industry-ready programmers who can compete on the world stage.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To bridge the gap between traditional education and industry requirements by providing
                  immersive, hands-on coding education that focuses on practical skills, problem-solving,
                  and real-world projects, making our students job-ready from day one.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Values */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Our Values
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                The principles that guide everything we do at Bitwise School of Technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto flex items-center justify-center rounded-full bg-[#0052CC] text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Innovation</h3>
                <p className="text-gray-500">
                  We embrace new technologies and teaching methods to provide cutting-edge education.
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 mx-auto flex items-center justify-center rounded-full bg-[#0052CC] text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Community</h3>
                <p className="text-gray-500">
                  We foster a supportive learning environment where students can grow together.
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 mx-auto flex items-center justify-center rounded-full bg-[#0052CC] text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Excellence</h3>
                <p className="text-gray-500">
                  We strive for the highest standards in everything we do, from teaching to student support.
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 mx-auto flex items-center justify-center rounded-full bg-[#0052CC] text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Practicality</h3>
                <p className="text-gray-500">
                  We focus on real-world skills that translate directly into career success.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Team & Mentors */}
        <section id="team" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Meet Our Team & Mentors
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Our expert instructors bring years of industry experience to the classroom
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bloom-hover bg-white rounded-lg shadow-md overflow-hidden text-center">
                <div className="p-6">
                  <img 
                    src="/lovable-uploads/700e27d7-0513-4bfa-8ac4-f7fd6087594c.png" 
                    alt="Amit Sharma" 
                    className="w-32 h-32 rounded-full mx-auto object-cover"
                  />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Amit Sharma</h3>
                  <p className="text-[#0052CC]">Founder & Lead Instructor</p>
                  <p className="mt-2 text-gray-500">
                    Ex-Google developer with 10+ years of experience in building scalable applications.
                  </p>
                </div>
              </div>
              
              <div className="bloom-hover bg-white rounded-lg shadow-md overflow-hidden text-center">
                <div className="p-6">
                  <img 
                    src="/lovable-uploads/6739bd63-bf19-4abd-bb23-0b613bbf7ac8.png" 
                    alt="Priya Verma" 
                    className="w-32 h-32 rounded-full mx-auto object-cover"
                  />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Priya Verma</h3>
                  <p className="text-[#0052CC]">Technical Director</p>
                  <p className="mt-2 text-gray-500">
                    Full-stack expert with experience at Amazon and Microsoft. Specializes in web development.
                  </p>
                </div>
              </div>
              
              <div className="bloom-hover bg-white rounded-lg shadow-md overflow-hidden text-center">
                <div className="p-6">
                  <img 
                    src="/lovable-uploads/7d120ee6-3614-4b75-9c35-716d54490d67.png" 
                    alt="Rahul Singh" 
                    className="w-32 h-32 rounded-full mx-auto object-cover"
                  />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Rahul Singh</h3>
                  <p className="text-[#0052CC]">DSA Instructor</p>
                  <p className="mt-2 text-gray-500">
                    Competitive programming coach with multiple wins in international coding competitions.
                  </p>
                </div>
              </div>
              
              <div className="bloom-hover bg-white rounded-lg shadow-md overflow-hidden text-center">
                <div className="p-6">
                  <img 
                    src="/lovable-uploads/93ab0638-8190-4ccf-897f-21fda7f4f5ad.png" 
                    alt="Neha Gupta" 
                    className="w-32 h-32 rounded-full mx-auto object-cover"
                  />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Neha Gupta</h3>
                  <p className="text-[#0052CC]">Placement Director</p>
                  <p className="mt-2 text-gray-500">
                    Former tech recruiter with extensive connections in the Indian tech industry.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-500">
                Our team also includes 15+ part-time instructors and mentors from top tech companies
              </p>
            </div>
          </div>
        </section>
        

        
        {/* CTA Section */}
        <section className="bg-[#0052CC] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Ready to bloom into a skilled developer?
            </h2>
            <p className="mt-4 text-xl max-w-2xl mx-auto">
              Join Bitwise School of Technology and transform your coding journey today
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="/courses" 
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-[#0052CC] bg-white hover:bg-gray-50"
              >
                Explore Courses
              </a>
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-[#0747A6]"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutUs;
