"use client";

import type { SummaryStatistics } from "@/types/statistics";
import { FileText, Eye, ThumbsUp, ThumbsDown, MessageSquare, Bookmark, ShoppingCart } from "lucide-react";
import { compactFormat } from "@/utils/format-number";

interface SummaryCardsProps {
  summary: SummaryStatistics;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Documents",
      value: summary.totalDocumentsUploaded,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Views",
      value: summary.totalViews,
      icon: Eye,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Upvotes",
      value: summary.totalUpvotes,
      icon: ThumbsUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Downvotes",
      value: summary.totalDownvotes,
      icon: ThumbsDown,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Comments",
      value: summary.totalComments,
      icon: MessageSquare,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Saves",
      value: summary.totalSaves,
      icon: Bookmark,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "Purchases",
      value: summary.totalPurchases,
      icon: ShoppingCart,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      title: "Avg Views/Doc",
      value: summary.averageViewsPerDocument.toFixed(1),
      icon: Eye,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
                  {typeof card.value === "number" ? compactFormat(card.value) : card.value}
                </p>
              </div>
              <div className={`rounded-full p-3 ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

