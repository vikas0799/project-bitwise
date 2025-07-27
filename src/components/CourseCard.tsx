
import { Link } from 'react-router-dom';
import { Clock, Users, Award } from 'lucide-react';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  students: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  price: number;
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  description,
  image,
  duration,
  students,
  level,
  price
}) => {
  // Fixed price to ₹5000 as requested
  const displayPrice = 5000;
  
  return (
    <Link to={`/courses/${id}`} className="bloom-hover block rounded-lg overflow-hidden shadow-lg bg-white">
      <div className="aspect-w-16 aspect-h-9 relative">
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        
        <div className="absolute top-3 right-3 bg-black text-white text-xs font-semibold px-2 py-1 rounded">
          {level}
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-xl mb-2 text-gray-900">{title}</h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{duration}</span>
          </div>
          
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{students.toLocaleString()} students</span>
          </div>
          
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1" />
            <span>{level}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-bold text-xl text-black">₹{displayPrice.toLocaleString()}</span>
          
          <button className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded font-medium">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
