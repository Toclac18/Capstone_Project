"use client";

import { ArrowRight, Users, Star, Clock } from "lucide-react";

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
          className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-800"
          onClick={() => handleCardClick(card)}
        >
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative h-48 w-full flex-shrink-0 md:h-64 md:w-80">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Badges */}
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {card.isPopular && (
                  <span className="rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                {card.isNew && (
                  <span className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    New
                  </span>
                )}
              </div>

              {/* Category */}
              <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm dark:bg-gray-800/90 dark:text-gray-300">
                {card.category}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <h3 className="mb-3 text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {card.title}
              </h3>

              <p className="mb-4 line-clamp-3 text-gray-600 dark:text-gray-300">
                {card.description}
              </p>

              {/* Stats */}
              <div className="mb-4 flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{card.stats.students.toLocaleString()} students</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{card.stats.rating}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{card.stats.duration}</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center font-medium text-blue-600 transition-all duration-300 group-hover:gap-3 dark:text-blue-400">
                  <span>Learn More</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
