
import { useState, useEffect, useMemo } from 'react';
import { SearchIcon, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import Footer from '../components/Footer';

const CoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');

  const allCourses = useMemo(() => [
    {
      id: 'cpp',
      title: 'C++ Programming Masterclass',
      description: 'Master C++ from basics to advanced concepts with hands-on projects and practice sessions.',
      image: '/src/assets/computer-programming.jpg',
      duration: '8 weeks',
      students: 1250,
      level: 'All Levels' as const,
      price: 12999,
      category: 'programming'
    },
    {
      id: 'java',
      title: 'Java Full Course',
      description: 'Comprehensive Java course covering core concepts, OOP, data structures, and web development.',
      image: '/src/assets/computer-programming.jpg',
      duration: '10 weeks',
      students: 1840,
      level: 'Beginner' as const,
      price: 14999,
      category: 'programming'
    },
    {
      id: 'dsa',
      title: 'Data Structures & Algorithms',
      description: 'In-depth learning of DSA concepts with problem-solving techniques for coding interviews.',
      image: '/src/assets/data-structures.jpg',
      duration: '12 weeks',
      students: 2150,
      level: 'Intermediate' as const,
      price: 16999,
      category: 'dsa'
    },
    {
      id: 'full-stack',
      title: 'Full-Stack Web Development',
      description: 'Become a complete web developer with MERN stack (MongoDB, Express, React, Node.js).',
      image: '/src/assets/fullstack-development.jpg',
      duration: '16 weeks',
      students: 1560,
      level: 'Intermediate' as const,
      price: 24999,
      category: 'web'
    },
    {
      id: 'python',
      title: 'Python for Beginners',
      description: 'Start your programming journey with Python, perfect for beginners and data science enthusiasts.',
      image: '/src/assets/python-coding.jpg',
      duration: '6 weeks',
      students: 2340,
      level: 'Beginner' as const,
      price: 9999,
      category: 'programming'
    },
    {
      id: 'react',
      title: 'React.js Bootcamp',
      description: 'Master modern frontend development with React.js, Redux, and related technologies.',
      image: '/src/assets/react-development.jpg',
      duration: '8 weeks',
      students: 1120,
      level: 'Intermediate' as const,
      price: 14999,
      category: 'web'
    }
  ], []);

  const [displayedCourses, setDisplayedCourses] = useState(allCourses);

  useEffect(() => {
    let filtered = [...allCourses];
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(course => course.category === filter);
    }
    
    // Apply search
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchLower) || 
        course.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // In a real app, you'd sort by date
        break;
      case 'popularity':
      default:
        filtered.sort((a, b) => b.students - a.students);
        break;
    }
    
    setDisplayedCourses(filtered);
  }, [searchTerm, filter, sortBy, allCourses]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header */}
        <header className="bg-gradient-to-br from-[#f4f5f7] to-white text-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-[#0052CC]">
              Explore Our Courses
            </h1>
            <p className="mt-4 text-xl max-w-2xl mx-auto text-gray-600">
              Find the perfect course to accelerate your coding journey
            </p>
            
            {/* Search Bar */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow focus:ring-[#0052CC] focus:border-[#0052CC] block w-full px-4 py-3 rounded-l-md border-gray-300 text-gray-900"
                  placeholder="Search for courses..."
                />
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-[#0052CC] hover:bg-[#0747A6]">
                  <SearchIcon className="h-5 w-5" />
                  <span className="ml-2">Search</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Course List */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-700">Filters:</span>
                <div className="ml-4">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="rounded-md border-gray-300 py-2 px-3 text-gray-700 focus:ring-[#0052CC] focus:border-[#0052CC]"
                  >
                    <option value="all">All Categories</option>
                    <option value="programming">Programming Languages</option>
                    <option value="web">Web Development</option>
                    <option value="dsa">Data Structures & Algorithms</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-700">Sort by:</span>
                <div className="ml-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-md border-gray-300 py-2 px-3 text-gray-700 focus:ring-[#0052CC] focus:border-[#0052CC]"
                  >
                    <option value="popularity">Most Popular</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {displayedCourses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
            
            {displayedCourses.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
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

export default CoursesPage;
