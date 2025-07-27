import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const BlogDetail = () => {
  const { id } = useParams();

  // Mock blog post data - in a real app, this would come from an API
  const blogPost = {
    id: '1',
    title: 'Getting Started with C++ Programming',
    content: `
      <p>C++ is a powerful general-purpose programming language created by Bjarne Stroustrup as an extension of the C programming language. It offers a perfect blend of high-level and low-level programming features.</p>
      
      <h2>Why Learn C++?</h2>
      <p>C++ is widely used in software development, game development, system programming, and embedded systems. It's known for its performance, efficiency, and flexibility.</p>
      
      <h2>Basic Syntax</h2>
      <p>Here's a simple "Hello, World!" program in C++:</p>
      <pre><code>#include &lt;iostream&gt;
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}</code></pre>
      
      <h2>Key Features</h2>
      <ul>
        <li><strong>Object-Oriented Programming:</strong> C++ supports classes, inheritance, polymorphism, and encapsulation.</li>
        <li><strong>Memory Management:</strong> Direct control over memory allocation and deallocation.</li>
        <li><strong>Performance:</strong> Compiled language with high execution speed.</li>
        <li><strong>Portability:</strong> Code can be compiled on different platforms.</li>
      </ul>
      
      <h2>Getting Started</h2>
      <p>To start programming in C++, you'll need:</p>
      <ol>
        <li>A C++ compiler (like GCC, Clang, or Visual Studio)</li>
        <li>A text editor or IDE</li>
        <li>Basic understanding of programming concepts</li>
      </ol>
      
      <h2>Next Steps</h2>
      <p>Once you're comfortable with the basics, explore advanced topics like:</p>
      <ul>
        <li>Templates and generic programming</li>
        <li>STL (Standard Template Library)</li>
        <li>Exception handling</li>
        <li>File I/O operations</li>
      </ul>
      
      <p>Remember, practice is key to mastering any programming language. Start with simple programs and gradually work your way up to more complex projects.</p>
    `,
    author: 'Rahul Sharma',
    date: 'Dec 15, 2024',
    readTime: '5 min read',
    category: 'Programming',
    image: '/src/assets/computer-programming.jpg',
    excerpt: 'Learn the fundamentals of C++ programming language and start your journey as a software developer.'
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header */}
        <header className="bg-gradient-to-br from-[#f4f5f7] to-white text-gray-900 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              to="/blog" 
              className="inline-flex items-center text-[#0052CC] hover:text-[#0747A6] mb-6 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
            
            <div className="flex items-center mb-4">
              <span className="bg-[#0052CC] text-white text-sm font-semibold px-3 py-1 rounded-full">
                {blogPost.category}
              </span>
            </div>
            
            <h1 className="text-3xl font-extrabold sm:text-4xl mb-4 text-[#0052CC]">
              {blogPost.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              {blogPost.excerpt}
            </p>
            
            <div className="flex items-center text-gray-600 text-sm">
              <div className="flex items-center mr-6">
                <User className="h-4 w-4 mr-2" />
                <span>{blogPost.author}</span>
              </div>
              
              <div className="flex items-center mr-6">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{blogPost.date}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{blogPost.readTime}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Article Content */}
        <article className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {blogPost.image && (
              <div className="mb-8">
                <img 
                  src={blogPost.image} 
                  alt={blogPost.title} 
                  className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                />
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: blogPost.content }}
            />
            
            {/* Article Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#0052CC] rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">{blogPost.author}</p>
                    <p className="text-gray-600">Programming Instructor</p>
                  </div>
                </div>
                
                <Link 
                  to="/blog" 
                  className="inline-flex items-center px-4 py-2 border border-[#0052CC] text-[#0052CC] rounded-md hover:bg-[#0052CC] hover:text-white transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogDetail; 