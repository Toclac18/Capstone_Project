"use client";

import { FileText, Users, Award } from "lucide-react";

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
      icon: <FileText className="h-5 w-5" />,
      label: "Study resources",
      value: "50k",
      badge: "1 new each minute",
      badgeColor: "bg-purple-500",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Organizations",
      value: "100+",
      badge: "In 10+ countries",
      badgeColor: "bg-green-500",
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Users",
      value: "6k",
      badge: "Every month",
      badgeColor: "bg-orange-500",
    },
  ],
}: SystemDescriptionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-12 dark:bg-gray-900">
      {/* Abstract background shapes */}
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-16 translate-x-16 transform rounded-full bg-lime-400 opacity-20"></div>
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 transform rounded-full bg-pink-500 opacity-20"></div>
      <div className="absolute bottom-0 right-0 h-40 w-40 translate-x-20 translate-y-20 transform rounded-full bg-pink-500 opacity-20"></div>
      <div className="absolute bottom-0 left-0 h-40 w-40 translate-x-20 translate-y-20 transform rounded-full bg-pink-500 opacity-20"></div>
      <div className="absolute left-0 top-0 h-20 w-20 translate-x-20 translate-y-20 transform rounded-full bg-pink-500 opacity-20"></div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Title */}
        <h1 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
          {title}
        </h1>

        {/* Description */}
        <p className="mx-auto mb-12 max-w-4xl text-lg text-gray-600 dark:text-gray-300">
          {description}
        </p>

        {/* Stats Grid */}
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              {/* Large number */}
              <div className="mb-4 text-5xl font-bold text-gray-900 dark:text-white md:text-6xl">
                {stat.value}
              </div>

              {/* Label with icon */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.icon}
                </div>
                <span className="text-lg text-gray-600 dark:text-gray-400">
                  {stat.label}
                </span>
              </div>

              {/* Badge */}
              {stat.badge && (
                <div
                  className={`inline-block rounded-full px-4 py-2 text-sm font-medium text-white ${stat.badgeColor}`}
                >
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
