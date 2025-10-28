"use client";

import { ArrowRight, Users, BookOpen, Award, TrendingUp, Star, Clock } from "lucide-react";

interface ContentCard {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  stats: {
    students: number;
    rating: number;
    duration: string;
  };
  isPopular?: boolean;
  isNew?: boolean;
}

interface ContentCardsProps {
  cards: ContentCard[];
  onCardClick?: (card: ContentCard) => void;
}

export function ContentCards({ cards, onCardClick }: ContentCardsProps) {
  const handleCardClick = (card: ContentCard) => {
    onCardClick?.(card);
  };

  return (
    <div className="space-y-6">
      {cards.map((card, index) => (
        <div
          key={card.id}
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer hover:-translate-y-2"
          onClick={() => handleCardClick(card)}
        >
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative w-full md:w-80 h-48 md:h-64 flex-shrink-0">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {card.isPopular && (
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Popular
                  </span>
                )}
                {card.isNew && (
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    New
                  </span>
                )}
              </div>

              {/* Category */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                {card.category}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {card.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {card.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{card.stats.students.toLocaleString()} students</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{card.stats.rating}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{card.stats.duration}</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:gap-3 transition-all duration-300">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Course #{index + 1}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
