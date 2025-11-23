"use client";

import { FeaturedCarousel } from "./_components/FeaturedCarousel";
import { SystemDescription } from "./_components/SystemDescription";
import { ContentCards } from "./_components/ContentCard";
import {
  mockFeaturedCards,
  mockContentCards,
} from "./_components/featured-carousel-mock";
import { useToast } from "@/components/ui/toast";

const Home = () => {
  const { showToast } = useToast();

  const handleFeaturedCardClick = (card: any) => {
    showToast({
      type: "info",
      title: "Featured Course",
      message: `You clicked on "${card.title}"`,
      duration: 3000,
    });
  };

  const handleContentCardClick = (card: any) => {
    showToast({
      type: "info",
      title: "Course Selected",
      message: `You selected "${card.title}"`,
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen rounded-2xl bg-gray-50 dark:bg-gray-900">
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
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
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
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl transition-all duration-500 hover:shadow-2xl">
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-bold">
              Ready to Start Learning?
            </h3>
            <p className="mb-6 text-lg opacity-90">
              Join thousands of students who are already advancing their careers
              with our courses
            </p>
            <button className="rounded-full bg-white px-8 py-3 font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-xl">
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
