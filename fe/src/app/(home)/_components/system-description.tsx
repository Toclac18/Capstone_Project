"use client";

import { FileText, Users, Award, TrendingUp } from "lucide-react";

interface SystemDescriptionProps {
  title?: string;
  description?: string;
  stats?: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    badge?: string;
    badgeColor?: string;
  }>;
}

export function SystemDescription({ 
  title = "Over 1 billion students helped, and counting",
  description = "50K new study notes added every day, from the world's most active student communities",
  stats = [
    { 
      icon: <FileText className="w-5 h-5" />, 
      label: "Study resources", 
      value: "50k",
      badge: "1 new each minute",
      badgeColor: "bg-purple-500"
    },
    { 
      icon: <Users className="w-5 h-5" />, 
      label: "Organizations", 
      value: "100+",
      badge: "In 10+ countries",
      badgeColor: "bg-green-500"
    },
    { 
      icon: <Award className="w-5 h-5" />, 
      label: "Users", 
      value: "6k",
      badge: "Every month",
      badgeColor: "bg-orange-500"
    }
  ]
}: SystemDescriptionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 relative overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500 rounded-full opacity-20 transform translate-x-8 -translate-y-8"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-500 rounded-full opacity-20 transform translate-x-20 translate-y-20"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500 rounded-full opacity-20 transform translate-x-20 translate-y-20"></div>
      <div className="absolute top-0 left-0 w-20 h-20 bg-pink-500 rounded-full opacity-20 transform translate-x-20 translate-y-20"></div>
      
      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          {title}
        </h1>
        
        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto">
          {description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              {/* Large number */}
              <div className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                {stat.value}
              </div>
              
              {/* Label with icon */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.icon}
                </div>
                <span className="text-lg text-gray-600 dark:text-gray-400">
                  {stat.label}
                </span>
              </div>
              
              {/* Badge */}
              {stat.badge && (
                <div className={`inline-block px-4 py-2 rounded-full text-white text-sm font-medium ${stat.badgeColor}`}>
                  {stat.badge}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
