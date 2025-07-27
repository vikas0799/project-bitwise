
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FAQsPage = () => {
  const [openCategory, setOpenCategory] = useState<string | null>('general');
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  
  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
    setOpenQuestion(null);
  };
  
  const toggleQuestion = (id: number) => {
    setOpenQuestion(openQuestion === id ? null : id);
  };
  
  const faqCategories = [
    {
      id: 'general',
      title: 'General Questions',
      questions: [
        {
          id: 1,
          question: 'What is Bitwise School of Technology?',
          answer: 'Bitwise School of Technology is a premier software training institute based in Delhi, India. We offer comprehensive coding courses, focusing on programming languages, data structures & algorithms, web development, and more. Our mission is to transform students into job-ready developers through hands-on learning and industry-aligned curriculum.'
        },
        {
          id: 2,
          question: 'Do I need prior programming experience to join your courses?',
          answer: 'No, we have courses designed for all skill levels. Our beginner courses start from the absolute basics and gradually progress to more advanced concepts. For specialized or advanced courses, we may recommend prerequisites to ensure you can keep up with the material.'
        },
        {
          id: 3,
          question: 'How are Bitwise School of Technology courses different from free online tutorials?',
          answer: 'Unlike free tutorials, we offer a structured learning path with live interactive sessions, personalized mentorship, doubt resolution, hands-on projects, and placement assistance. Our curriculum is designed by industry experts to focus on practical skills that employers value, and we provide a supportive community of fellow learners.'
        }
      ]
    },
    {
      id: 'courses',
      title: 'Courses & Curriculum',
      questions: [
        {
          id: 4,
          question: 'What courses do you offer?',
          answer: 'We offer a wide range of courses including C++, Java, Data Structures & Algorithms (DSA), Full-Stack Web Development, Python, and more. Each course is designed with industry requirements in mind and includes both theoretical knowledge and practical implementation.'
        },
        {
          id: 5,
          question: 'How long are your courses?',
          answer: 'Course duration varies depending on the subject and depth. Typically, our courses range from 6 to 16 weeks. For example, our C++ Programming course is 8 weeks, while the Full-Stack Web Development program is 16 weeks. We also offer weekend and part-time options for working professionals.'
        },
        {
          id: 6,
          question: 'What is the course structure like?',
          answer: 'Our courses combine live lectures, practical coding sessions, assignments, quizzes, and projects. Each week typically includes 3-4 live sessions, coding practice on our platform, weekly assignments, and regular assessments. You\'ll also have access to 1:1 mentoring sessions and doubt-resolution support.'
        }
      ]
    },
    {
      id: 'admissions',
      title: 'Admissions & Fees',
      questions: [
        {
          id: 7,
          question: 'How can I enroll in a course?',
          answer: 'You can enroll by visiting our website and selecting your desired course. Click on "Enroll Now" and follow the registration process. Alternatively, you can visit our campus in Chandigarh or call our admissions team at +91-XXXXXXXXXX for assistance.'
        },
        {
          id: 8,
          question: 'What are the payment options available?',
          answer: 'We accept payments via credit/debit cards, net banking, UPI, and EMI options through various partners. We also offer installment plans for certain courses. For detailed payment information, please contact our admissions team.'
        },
        {
          id: 9,
          question: 'Do you offer any scholarships or discounts?',
          answer: 'Yes, we offer merit-based scholarships for exceptional candidates. We also run periodic discounts and early bird offers. Additionally, we have special discounts for students, women in tech, and group enrollments. Please check our website or contact us for current offers.'
        }
      ]
    },
    {
      id: 'placements',
      title: 'Placements & Career Support',
      questions: [
        {
          id: 10,
          question: 'Do you provide placement assistance?',
          answer: 'Yes, we have a dedicated placement team that works with 120+ hiring partners across India. Our placement assistance includes resume building, interview preparation, mock interviews, and connecting you with suitable job opportunities. We have a 96% placement record for students who complete our courses successfully.'
        },
        {
          id: 11,
          question: 'What companies hire from Bitwise School of Technology?',
          answer: 'Our students have been placed in companies like Microsoft, Google, Amazon, Infosys, TCS, Wipro, IBM, Accenture, and many startups and mid-sized tech companies. The range of roles includes software developers, web developers, data analysts, and more.'
        },
        {
          id: 12,
          question: 'What is the average salary package for graduates?',
          answer: 'The average salary package for our graduates is around 12 LPA (Lakhs Per Annum), with packages ranging from 6 LPA to 35 LPA depending on the student\'s performance, prior experience, and the hiring company. Our placement team works to help you secure the best possible opportunity based on your skills and career goals.'
        }
      ]
    },
    {
      id: 'logistics',
      title: 'Class Schedule & Logistics',
      questions: [
        {
          id: 13,
          question: 'Do you offer online classes?',
          answer: 'Yes, all our courses are available in both online and offline (in-campus) formats. Our online classes are conducted live through our interactive learning platform, providing the same quality of education as our in-person classes.'
        },
        {
          id: 14,
          question: 'What are the class timings?',
          answer: 'We offer flexible timing options including weekday batches (morning and evening) and weekend batches. Typical weekday sessions are 2 hours long and are scheduled between 9 AM to 9 PM. Weekend batches usually have longer sessions (3-4 hours) on Saturdays and Sundays.'
        },
        {
          id: 15,
          question: 'What happens if I miss a class?',
          answer: 'All live sessions are recorded and made available in your learning dashboard. You can watch the recordings at your convenience. Additionally, you can attend doubt-resolution sessions or request a 1:1 with a teaching assistant to catch up on missed content.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#f4f5f7] to-white text-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-[#0052CC]">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-xl max-w-2xl mx-auto text-gray-600">
              Find answers to common questions about our courses, admissions, and more
            </p>
          </div>
        </section>
        
        {/* Quick Links */}
        <section className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 overflow-x-auto">
              <div className="inline-flex space-x-4">
                {faqCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      openCategory === category.id
                        ? 'bg-purple-100 text-purple-800 font-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQs Content */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {faqCategories.map(category => (
              <div key={category.id} className={`mb-8 ${openCategory === category.id ? 'block' : 'hidden'}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {category.title}
                </h2>
                
                <div className="space-y-4">
                  {category.questions.map(item => (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleQuestion(item.id)}
                        className="w-full flex justify-between items-center bg-white px-6 py-4 text-left"
                      >
                        <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                        {openQuestion === item.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      
                      {openQuestion === item.id && (
                        <div className="bg-gray-50 px-6 py-4">
                          <p className="text-gray-600">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Didn't find your answer? */}
            <div className="mt-12 bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Didn't find an answer to your question?
              </h3>
              <p className="text-gray-600 mb-6">
                Contact our support team and we'll get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Contact Us
                </a>
                <a 
                  href="mailto:info@bitwiseschool.com" 
                  className="inline-flex items-center justify-center px-5 py-3 border border-purple-600 text-base font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
                >
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQsPage;
