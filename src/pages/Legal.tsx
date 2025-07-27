
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Legal = () => {
  const { pageType } = useParams<{ pageType: string }>();
  
  const isPrivacyPolicy = pageType === 'privacy';
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header */}
        <section className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              {isPrivacyPolicy ? 'Privacy Policy' : 'Terms & Conditions'}
            </h1>
            <p className="mt-4 text-xl max-w-2xl mx-auto">
              {isPrivacyPolicy 
                ? 'How we collect, use, and protect your personal information' 
                : 'Guidelines and rules for using Bitwise School of Technology services'}
            </p>
          </div>
        </section>
        
        {/* Content */}
        <section className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              {isPrivacyPolicy ? (
                <>
                  <p>Last Updated: June 1, 2023</p>
                  
                  <h2>1. Introduction</h2>
                  <p>
                    Bitwise School of Technology ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our platform, or enroll in our courses.
                  </p>
                  <p>
                    Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
                  </p>
                  
                  <h2>2. Information We Collect</h2>
                  <p>We may collect information about you in various ways, including:</p>
                  <h3>2.1 Personal Information</h3>
                  <p>
                    When you register for an account, enroll in courses, or contact us, we may collect personal information such as:
                  </p>
                  <ul>
                    <li>Name, email address, and contact details</li>
                    <li>Educational background and work experience</li>
                    <li>Payment information</li>
                    <li>Profile pictures and biographical information</li>
                    <li>Course preferences and learning goals</li>
                  </ul>
                  
                  <h3>2.2 Usage Information</h3>
                  <p>
                    We automatically collect certain information about your device and how you interact with our platform, including:
                  </p>
                  <ul>
                    <li>IP address and browser type</li>
                    <li>Pages viewed and time spent</li>
                    <li>Referring websites or applications</li>
                    <li>Course progress and completion data</li>
                    <li>Quiz and assignment results</li>
                  </ul>
                  
                  <h2>3. How We Use Your Information</h2>
                  <p>We may use the information we collect for various purposes, including:</p>
                  <ul>
                    <li>Providing and improving our educational services</li>
                    <li>Processing transactions and sending related information</li>
                    <li>Responding to inquiries and providing customer support</li>
                    <li>Sending administrative information, updates, and promotional materials</li>
                    <li>Personalizing your experience and delivering tailored content</li>
                    <li>Monitoring and analyzing usage patterns and trends</li>
                    <li>Protecting against unauthorized access and ensuring platform security</li>
                  </ul>
                  
                  <h2>4. Sharing Your Information</h2>
                  <p>
                    We may share your information with third parties in certain circumstances:
                  </p>
                  <ul>
                    <li>With service providers who perform services on our behalf</li>
                    <li>With educational partners for certification or accreditation purposes</li>
                    <li>With potential employers, with your consent, for placement assistance</li>
                    <li>To comply with legal obligations or protect rights</li>
                    <li>In connection with a business transfer or acquisition</li>
                  </ul>
                  
                  <h2>5. Your Choices</h2>
                  <p>
                    You have certain choices about how we use your information:
                  </p>
                  <ul>
                    <li>You can update or correct your account information</li>
                    <li>You can opt out of marketing communications</li>
                    <li>You can request access to or deletion of your personal data</li>
                    <li>You can disable cookies through your browser settings</li>
                  </ul>
                  
                  <h2>6. Security</h2>
                  <p>
                    We implement reasonable security measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                  </p>
                  
                  <h2>7. Children's Privacy</h2>
                  <p>
                    Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16.
                  </p>
                  
                  <h2>8. Changes to this Privacy Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                  </p>
                  
                  <h2>9. Contact Us</h2>
                  <p>
                    If you have questions or concerns about this Privacy Policy, please contact us at:
                  </p>
                  <p>
                     Email: privacy@bitwiseschool.com<br />
                    Address: 66 A Block, New Ashok Nagar, Delhi, India<br />
                    Phone: +91-987-654-3210
                  </p>
                </>
              ) : (
                <>
                  <p>Last Updated: June 1, 2023</p>
                  
                  <h2>1. Agreement to Terms</h2>
                  <p>
                    By accessing our website, enrolling in our courses, or using our platform, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our services.
                  </p>
                  
                  <h2>2. Course Enrollment and Payment</h2>
                  <h3>2.1 Eligibility</h3>
                  <p>
                    You must be at least 16 years old to enroll in our courses. If you are under 18, you represent that you have your parent or guardian's permission to use our services.
                  </p>
                  
                  <h3>2.2 Payment</h3>
                  <p>
                    By enrolling in a paid course, you agree to pay the specified fees. All payments are processed securely through our payment partners. Prices are inclusive of applicable taxes unless stated otherwise.
                  </p>
                  
                  <h3>2.3 Refund Policy</h3>
                  <p>
                    We offer a 7-day money-back guarantee for most courses. To be eligible for a refund, you must request it within 7 days of enrollment and have completed less than 25% of the course content. Refund requests should be sent to support@bitwiseschool.com.
                  </p>
                  
                  <h2>3. Account Creation and Security</h2>
                  <p>
                    When you create an account, you are responsible for:
                  </p>
                  <ul>
                    <li>Providing accurate and complete information</li>
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                  </ul>
                  
                  <h2>4. Intellectual Property</h2>
                  <h3>4.1 Our Content</h3>
                  <p>
                    All content provided through our platform, including course materials, videos, code examples, and assessments, is owned by Bitwise School of Technology or its licensors and is protected by copyright and other intellectual property laws.
                  </p>
                  
                  <h3>4.2 License to Use</h3>
                  <p>
                    We grant you a limited, non-exclusive, non-transferable license to access and use our content for personal, non-commercial educational purposes. You may not:
                  </p>
                  <ul>
                    <li>Reproduce, distribute, or publicly display the content</li>
                    <li>Modify or create derivative works</li>
                    <li>Use the content for commercial purposes</li>
                    <li>Remove any copyright or proprietary notices</li>
                  </ul>
                  
                  <h3>4.3 User Content</h3>
                  <p>
                    By submitting assignments, projects, or other content to our platform, you grant us a non-exclusive license to use, reproduce, and display such content for educational and operational purposes.
                  </p>
                  
                  <h2>5. Code of Conduct</h2>
                  <p>
                    When using our platform, you agree not to:
                  </p>
                  <ul>
                    <li>Engage in any unlawful or fraudulent activities</li>
                    <li>Impersonate any person or entity</li>
                    <li>Post discriminatory, harassing, or offensive content</li>
                    <li>Distribute malware or other harmful code</li>
                    <li>Interfere with the proper functioning of the platform</li>
                    <li>Attempt to access restricted areas or data</li>
                    <li>Share your account credentials with others</li>
                  </ul>
                  
                  <h2>6. Termination</h2>
                  <p>
                    We reserve the right to suspend or terminate your access to our services, without prior notice or liability, for any reason, including a breach of these Terms.
                  </p>
                  
                  <h2>7. Disclaimer of Warranties</h2>
                  <p>
                    Our services are provided "as is" without warranties of any kind, whether express or implied. We do not guarantee that our services will be uninterrupted, error-free, or that defects will be corrected.
                  </p>
                  
                  <h2>8. Limitation of Liability</h2>
                  <p>
                    In no event shall Bitwise School of Technology be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of our services.
                  </p>
                  
                  <h2>9. Governing Law</h2>
                  <p>
                    These Terms are governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.
                  </p>
                  
                  <h2>10. Changes to Terms</h2>
                  <p>
                    We may modify these Terms from time to time. By continuing to use our services after such modifications, you agree to be bound by the updated Terms.
                  </p>
                  
                  <h2>11. Contact Us</h2>
                  <p>
                    If you have questions about these Terms, please contact us at:
                  </p>
                  <p>
                     Email: legal@bitwiseschool.com<br />
                    Address: 66 A Block, New Ashok Nagar, Delhi, India<br />
                    Phone: +91-987-654-3210
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Legal;
