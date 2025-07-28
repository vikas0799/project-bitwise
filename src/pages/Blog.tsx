import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import BlogCard from '../components/BlogCard';
import Footer from '../components/Footer';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogPosts = [
    {
      id: '1',
      title: 'Getting Started with C++ Programming',
      excerpt: 'Learn the fundamentals of C++ programming language and start your journey as a software developer. This comprehensive guide covers everything from basic syntax to object-oriented programming concepts.',
      author: 'Rahul Sharma',
      date: 'Dec 15, 2024',
      readTime: '5 min read',
      category: 'Programming',
      image: '/computer-programming.jpg'
    },
    {
      id: '2',
      title: 'Mastering Data Structures and Algorithms',
      excerpt: 'Understanding data structures and algorithms is crucial for any programmer. This article explores the most important concepts you need to know for technical interviews and real-world applications.',
      author: 'Priya Patel',
      date: 'Dec 12, 2024',
      readTime: '8 min read',
      category: 'DSA',
      image: '/data-structures.jpg'
    },
    {
      id: '3',
      title: 'Building Your First Web Application',
      excerpt: 'Step-by-step guide to creating your first web application using modern technologies. Learn about HTML, CSS, JavaScript, and how to deploy your project.',
      author: 'Amit Kumar',
      date: 'Dec 10, 2024',
      readTime: '6 min read',
      category: 'Web Development',
      image: '/fullstack-development.jpg'
    },
    {
      id: '4',
      title: 'Java Programming Best Practices',
      excerpt: 'Discover the best practices for writing clean, maintainable Java code. Learn about design patterns, code organization, and performance optimization techniques.',
      author: 'Neha Singh',
      date: 'Dec 8, 2024',
      readTime: '7 min read',
      category: 'Programming',
      image: '/computer-programming.jpg'
    },
    {
      id: '5',
      title: 'React.js Fundamentals for Beginners',
      excerpt: 'A beginner-friendly introduction to React.js. Learn about components, state management, and how to build interactive user interfaces.',
      author: 'Vikram Mehta',
      date: 'Dec 5, 2024',
      readTime: '6 min read',
      category: 'Web Development',
      image: '/react-development.jpg'
    },
    {
      id: '6',
      title: 'Python for Data Science',
      excerpt: 'Explore how Python is used in data science and machine learning. Learn about popular libraries like NumPy, Pandas, and Matplotlib.',
      author: 'Anjali Gupta',
      date: 'Dec 3, 2024',
      readTime: '9 min read',
      category: 'Data Science',
      image: '/python-coding.jpg'
    }
  ];

  const categories = ['all', 'Programming', 'DSA', 'Web Development', 'Data Science'];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header */}
        <header className="bg-gradient-to-br from-[#f4f5f7] to-white text-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-[#0052CC]">
              Blog
            </h1>
            <p className="mt-4 text-xl max-w-2xl mx-auto text-gray-600">
              Stay updated with the latest programming tips, tutorials, and industry insights
            </p>
            
            {/* Search Bar */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow focus:ring-[#0052CC] focus:border-[#0052CC] block w-full px-4 py-3 rounded-l-md border-gray-300 text-gray-900"
                  placeholder="Search articles..."
                />
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-[#0052CC] hover:bg-[#0747A6]">
                  <Search className="h-5 w-5" />
                  <span className="ml-2">Search</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Blog List */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filters */}
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-700">Filter by:</span>
                <div className="ml-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-md border-gray-300 py-2 px-3 text-gray-700 focus:ring-[#0052CC] focus:border-[#0052CC]"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="text-gray-600">
                {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
              </div>
            </div>
            
            {/* Blog Grid */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} {...post} />
              ))}
            </div>
            
            {filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-lg font-medium text-gray-900">No articles found</h3>
                <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Blog; 