
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, Award, CheckCircle, Play, Calendar, FileText, MessageCircle, Book, Newspaper } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  
  // In a real app, you would fetch this data based on courseId
  const courseData = {
    id: courseId,
    title: courseId === 'cpp' ? 'C++ Programming Masterclass' :
           courseId === 'java' ? 'Java Full Course' :
           courseId === 'dsa' ? 'Data Structures & Algorithms' :
           courseId === 'full-stack' ? 'Full-Stack Web Development' :
           'Course Details',
    description: 'Comprehensive course covering all aspects of the subject with hands-on projects and practical exercises.',
    image: '/lovable-uploads/39605e90-8478-4fee-b1b9-cee41df66f10.png',
    duration: '10-12 weeks',
    lectures: 48,
    students: 1500,
    level: 'Intermediate',
    price: 14999,
    discount: 9999,
    instructor: {
      name: 'Amit Sharma',
      role: 'Senior Software Engineer',
      image: '/lovable-uploads/700e27d7-0513-4bfa-8ac4-f7fd6087594c.png',
      bio: 'Amit has 8+ years of industry experience working with top tech companies. He specializes in building scalable applications and teaching coding concepts.',
      students: 5000
    },
    highlights: [
      'Live interactive sessions with expert instructors',
      'Hands-on projects and real-world case studies',
      'Personalized feedback and code reviews',
      '24/7 doubt resolution support',
      'Industry-ready project portfolio',
      'Placement assistance and career guidance'
    ],
    curriculum: [
      {
        title: 'Introduction to Fundamentals',
        lessons: [
          'Setting up the development environment',
          'Syntax basics and data types',
          'Control structures and loops',
          'Functions and modules'
        ]
      },
      {
        title: 'Intermediate Concepts',
        lessons: [
          'Object-Oriented Programming',
          'Error handling and exceptions',
          'Working with libraries and packages',
          'File I/O operations'
        ]
      },
      {
        title: 'Advanced Topics',
        lessons: [
          'Memory management and optimization',
          'Multithreading and concurrency',
          'Design patterns and best practices',
          'Building real-world applications'
        ]
      }
    ],
    faqs: [
      {
        question: 'Is this course suitable for beginners?',
        answer: 'Yes, this course is designed to accommodate learners at various levels. We start with the basics and gradually move to advanced topics.'
      },
      {
        question: 'Will I get a certificate after completing the course?',
        answer: 'Yes, you will receive a completion certificate once you finish all the modules and assignments.'
      },
      {
        question: 'How is this course different from free online tutorials?',
        answer: 'Our course offers live interactive sessions, personalized mentorship, hands-on projects, and career guidance that you won\'t find in free tutorials.'
      },
      {
        question: 'What is the refund policy?',
        answer: 'We offer a 7-day money-back guarantee if you\'re not satisfied with the course.'
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Course Hero */}
        <section className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <h1 className="text-3xl font-extrabold sm:text-4xl mb-4">
                  {courseData.title}
                </h1>
                <p className="text-lg mb-6">
                  {courseData.description}
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{courseData.duration}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <span>{courseData.students.toLocaleString()} students</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    <span>{courseData.level}</span>
                  </div>
                </div>
                
                <div className="flex items-center mb-8">
                  <img 
                    src={courseData.instructor.image} 
                    alt={courseData.instructor.name} 
                    className="h-12 w-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-medium">Instructor: {courseData.instructor.name}</p>
                    <p className="text-sm opacity-80">{courseData.instructor.role}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 lg:mt-0">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden text-gray-900">
                  <div className="aspect-w-16 aspect-h-9">
                    <img 
                      src={courseData.image} 
                      alt={courseData.title} 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-purple-600">₹{courseData.discount.toLocaleString()}</span>
                        {courseData.discount < courseData.price && (
                          <span className="text-lg text-gray-400 line-through ml-2">₹{courseData.price.toLocaleString()}</span>
                        )}
                      </div>
                      
                      {courseData.discount < courseData.price && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                          {Math.round(100 - (courseData.discount / courseData.price) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    
                    <button className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium mb-4">
                      Enroll Now
                    </button>
                    
                    <p className="text-gray-500 text-sm text-center mb-4">
                      30-day money-back guarantee
                    </p>
                    
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-medium mb-2">This course includes:</h4>
                      <div className="flex items-center">
                        <Play className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">{courseData.lectures} on-demand video lectures</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">Assignments and quizzes</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">1:1 mentorship sessions</span>
                      </div>
                      <div className="flex items-center">
                        <Book className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">Downloadable resources</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">Lifetime access</span>
                      </div>
                      <div className="flex items-center">
                        <Newspaper className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">Certificate of completion</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Course Navigation Tabs */}
        <section className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto py-2">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-4 py-2 whitespace-nowrap font-medium ${activeTab === 'overview' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('curriculum')} 
                className={`px-4 py-2 whitespace-nowrap font-medium ${activeTab === 'curriculum' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Curriculum
              </button>
              <button 
                onClick={() => setActiveTab('instructor')} 
                className={`px-4 py-2 whitespace-nowrap font-medium ${activeTab === 'instructor' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Instructor
              </button>
              <button 
                onClick={() => setActiveTab('faqs')} 
                className={`px-4 py-2 whitespace-nowrap font-medium ${activeTab === 'faqs' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                FAQs
              </button>
            </div>
          </div>
        </section>
        
        {/* Course Content Based on Active Tab */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Course Overview
                </h2>
                
                <p className="text-gray-700 mb-8">
                  This comprehensive {courseData.title} course is designed to take you from beginner to advanced level.
                  You'll learn through hands-on projects, live coding sessions, and real-world applications. 
                  By the end of this course, you'll have the skills and confidence to build complex applications 
                  and tackle technical interviews in top companies.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Course Highlights
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {courseData.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Who This Course Is For
                </h3>
                
                <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-8">
                  <li>Students looking to build a career in software development</li>
                  <li>Working professionals wanting to upskill or switch careers</li>
                  <li>Coding enthusiasts wanting to deep dive into {courseData.title.split(' ')[0]}</li>
                  <li>Anyone preparing for technical interviews at top tech companies</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Prerequisites
                </h3>
                
                <p className="text-gray-700 mb-4">
                  Basic computer knowledge and familiarity with programming concepts is helpful but not mandatory.
                  Our course is structured to accommodate complete beginners as well.
                </p>
              </div>
            )}
            
            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Course Curriculum
                </h2>
                
                <div className="space-y-6">
                  {courseData.curriculum.map((module, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 py-4 px-6 font-medium flex justify-between items-center">
                        <h3 className="text-lg">{`Module ${index + 1}: ${module.title}`}</h3>
                        <span className="text-sm text-gray-500">{module.lessons.length} lessons</span>
                      </div>
                      <div className="divide-y">
                        {module.lessons.map((lesson, idx) => (
                          <div key={idx} className="py-3 px-6 flex items-center">
                            <Play className="h-4 w-4 text-gray-400 mr-3" />
                            <span className="text-gray-700">{lesson}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 bg-purple-50 rounded-lg p-6 border border-purple-100">
                  <h3 className="text-xl font-semibold text-purple-900 mb-4">
                    Final Project
                  </h3>
                  <p className="text-gray-700">
                    At the end of the course, you'll work on a capstone project to apply all the concepts 
                    you've learned. This project will be a valuable addition to your portfolio and demonstrate 
                    your skills to potential employers.
                  </p>
                </div>
              </div>
            )}
            
            {/* Instructor Tab */}
            {activeTab === 'instructor' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Meet Your Instructor
                </h2>
                
                <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                  <img 
                    src={courseData.instructor.image} 
                    alt={courseData.instructor.name} 
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  
                  <div>
                    <h3 className="text-xl font-semibold">{courseData.instructor.name}</h3>
                    <p className="text-gray-600 mb-4">{courseData.instructor.role}</p>
                    
                    <div className="flex gap-4 mb-4">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-400 mr-2" />
                        <span>{courseData.instructor.students.toLocaleString()} students</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <span>8+ years experience</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700">
                      {courseData.instructor.bio}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Why I'm Passionate About Teaching</h3>
                  <p className="text-gray-700">
                    "I believe that with the right guidance, anyone can become a successful programmer. 
                    My teaching approach focuses on practical skills, problem-solving, and building a strong 
                    foundation that will help you throughout your career. I'm committed to helping each student 
                    reach their full potential and achieve their goals in the tech industry."
                  </p>
                </div>
              </div>
            )}
            
            {/* FAQs Tab */}
            {activeTab === 'faqs' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Frequently Asked Questions
                </h2>
                
                <div className="space-y-6">
                  {courseData.faqs.map((faq, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 py-4 px-6 font-medium">
                        <h3 className="text-lg">{faq.question}</h3>
                      </div>
                      <div className="py-4 px-6">
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-600 mb-4">Still have questions?</p>
                  <Link 
                    to="/contact" 
                    className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Related Courses */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              You May Also Like
            </h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {['java', 'dsa', 'full-stack'].filter(id => id !== courseId).slice(0, 3).map(id => (
                <div key={id} className="bloom-hover rounded-lg overflow-hidden shadow-md bg-white">
                  <Link to={`/courses/${id}`} className="block">
                    <img 
                      src={`/lovable-uploads/${id === 'java' ? '3de85ddd-15e1-4216-9697-f91abb9a47ce.png' : id === 'dsa' ? '48ecf6e2-5a98-4a9d-af6f-ae2265cd4098.png' : '5463c9c5-0946-4280-a14b-17636ff69a98.png'}`} 
                      alt={id === 'java' ? 'Java Full Course' : id === 'dsa' ? 'Data Structures & Algorithms' : 'Full-Stack Web Development'} 
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">
                        {id === 'java' ? 'Java Full Course' : id === 'dsa' ? 'Data Structures & Algorithms' : 'Full-Stack Web Development'}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-600 font-medium">
                          ₹{id === 'java' ? '14,999' : id === 'dsa' ? '16,999' : '24,999'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {id === 'java' ? '10 weeks' : id === 'dsa' ? '12 weeks' : '16 weeks'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default CourseDetail;
