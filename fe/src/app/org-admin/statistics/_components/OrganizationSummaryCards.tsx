"use client";

import type { OrganizationSummaryStatistics } from "@/types/statistics";

interface OrganizationSummaryCardsProps {
  summary: OrganizationSummaryStatistics;
}

export function OrganizationSummaryCards({ summary }: OrganizationSummaryCardsProps) {
  const cards = [
    {
      title: "Total Members",
      value: summary.totalMembers.toLocaleString(),
      icon: "👥",
      color: "bg-blue-500",
    },
    {
      title: "Active Members",
      value: summary.activeMembers.toLocaleString(),
      icon: "✓",
      color: "bg-green-500",
    },
    {
      title: "Total Documents",
      value: summary.totalDocuments.toLocaleString(),
      icon: "📄",
      color: "bg-purple-500",
    },
    {
      title: "Total Views",
      value: summary.totalViews.toLocaleString(),
      icon: "👁️",
      color: "bg-orange-500",
    },
    {
      title: "Total Upvotes",
      value: summary.totalUpvotes.toLocaleString(),
      icon: "👍",
      color: "bg-green-500",
    },
    {
      title: "Total Comments",
      value: summary.totalComments.toLocaleString(),
      icon: "💬",
      color: "bg-blue-500",
    },
    {
      title: "Total Saves",
      value: summary.totalSaves.toLocaleString(),
      icon: "⭐",
      color: "bg-yellow-500",
    },
    {
      title: "Avg Views/Doc",
      value: summary.averageViewsPerDocument.toFixed(1),
      icon: "📊",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="mt-2 text-2xl font-bold text-black dark:text-white">
                {card.value}
              </p>
            </div>
            <div className={`rounded-full p-3 ${card.color} bg-opacity-10`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

