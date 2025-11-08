"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Users, BookOpen } from "lucide-react";

interface FeaturedCard {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  views: number;
  isPremium?: boolean;
  author: string;
}

interface FeaturedCarouselProps {
  cards: FeaturedCard[];
  onCardClick?: (card: FeaturedCard) => void;
}

export function FeaturedCarousel({ cards, onCardClick }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };
  // Auto-rotate every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const handlePrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleCardClick = (card: FeaturedCard, index: number) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
    onCardClick?.(card);
  };

  // Create extended array for infinite effect
  const extendedCards = [...cards, ...cards, ...cards];
  const startIndex = cards.length;

  return (
    <div className="relative w-full h-[28rem] overflow-hidden">      
      {/* Navigation Arrows */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110 hover:shadow-xl group"
        disabled={isTransitioning}
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110 hover:shadow-xl group"
        disabled={isTransitioning}
      >
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
      </button>

      {/* Carousel Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {extendedCards.map((card, index) => {
          const offset = index - (startIndex + currentIndex);
          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          return (
            <div
              key={`${card.id}-${index}`}
              className="absolute"
              style={{
                transform: `translateX(${offset * 380}px) scale(${isActive ? 1 : 0.7})`,
                opacity: isActive ? 1 : 0.3,
                zIndex: isActive ? 10 : 5 - Math.abs(offset),
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                className={`relative w-[26rem] h-[22rem] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-500 ${
                  isActive 
                    ? 'shadow-2xl ring-2 ring-blue-200 dark:ring-blue-800' 
                    : 'shadow-lg hover:shadow-xl'
                }`}
                onClick={() => handleCardClick(card, index % cards.length)}
              >
                {/* Card Image */}
                <div className="relative w-full h-full">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Premium Badge */}
                  {card.isPremium && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Premium
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    {card.category}
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h3 className="text-2xl font-bold mb-3 line-clamp-2">{card.title}</h3>
                    <p className="text-base text-gray-200 mb-4 line-clamp-2">{card.description}</p>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{card.rating}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-semibold">{card.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span className="font-semibold">{card.author}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
