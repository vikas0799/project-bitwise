
import { Code, Users, Video, Award, Headphones, Calendar, Laptop, GraduationCap } from 'lucide-react';

const ProgramHighlights = () => {
  const features = [
    {
      icon: Video,
      title: 'Live Classroom',
      description: 'Engage in real-time interactive sessions with industry experts in our virtual classrooms.'
    },
    {
      icon: Code,
      title: 'Live Coding Platform',
      description: 'Practice coding in real-time with instant feedback and guidance from our instructors.'
    },
    {
      icon: Laptop,
      title: 'Multiple Tech Stacks',
      description: 'Master various technologies including Java, C++, Python, MERN stack, and more.'
    },
    {
      icon: Calendar,
      title: 'Workshops & Hackathons',
      description: 'Participate in hands-on workshops and competitive hackathons to build your portfolio.'
    },
    {
      icon: Headphones,
      title: '1:1 Mentoring',
      description: 'Receive personalized guidance and career advice from experienced industry professionals.'
    },
    {
      icon: Users,
      title: 'Mock Interviews',
      description: 'Prepare for job interviews with realistic mock sessions and detailed feedback.'
    },
    {
      icon: Award,
      title: 'Coding Contests',
      description: 'Test your skills and win prizes in our regular competitive coding challenges.'
    },
    {
      icon: GraduationCap,
      title: 'Placement Assistance',
      description: 'Get help with resume building, interview preparation, and job placement.'
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Program Highlights
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            What makes Bitwise School of Technology the premier choice for aspiring developers in Delhi
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-[#0052CC] rounded-lg mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramHighlights;
