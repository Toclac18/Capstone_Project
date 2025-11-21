"use client";

import { FeaturedCarousel } from "./_components/featured-carousel";
import { SystemDescription } from "./_components/system-description";
import { ContentCards } from "./_components/content-cards";
import { mockFeaturedCards, mockContentCards } from "./_components/mock-data";
import { useToast } from "@/components/ui/toast";

const Home = () => {
  const { showToast } = useToast();

  const handleFeaturedCardClick = (card: any) => {
    showToast({
      type: 'info',
      title: 'Featured Course',
      message: `You clicked on "${card.title}"`,
      duration: 3000
    });
  };

  const handleContentCardClick = (card: any) => {
    showToast({
      type: 'info',
      title: 'Course Selected',
      message: `You selected "${card.title}"`,
      duration: 3000
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 rounded-2xl">
      <div className="container mx-auto px-4 py-8">
        {/* System Description */}
        <SystemDescription />

        {/* Featured Carousel */}
        <div className="mb-12">
          {/* <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Courses
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Discover our most popular and trending courses
            </p>
          </div> */}
          
          <FeaturedCarousel 
            cards={mockFeaturedCards}
            onCardClick={handleFeaturedCardClick}
          />
        </div>

        {/* Content Cards */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Popular Learning Paths
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Comprehensive courses designed to advance your career
            </p>
          </div>
          
          <ContentCards 
            cards={mockContentCards}
            onCardClick={handleContentCardClick}
          />
        </div>

        {/* Additional Info Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Start Learning?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of students who are already advancing their careers with our courses
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;