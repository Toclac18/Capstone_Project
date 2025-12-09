"use client";

import type { ReviewerSummaryStatistics } from "@/types/reviewer-statistics";
import { ClipboardCheck, CheckCircle, XCircle, Clock, AlertCircle, FileCheck } from "lucide-react";
import { compactFormat } from "@/utils/format-number";

interface SummaryCardsProps {
  summary: ReviewerSummaryStatistics;
  averageReviewTime: number;
}

export function SummaryCards({ summary, averageReviewTime }: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Review Requests",
      value: summary.totalReviewRequests,
      icon: ClipboardCheck,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Completed Reviews",
      value: summary.totalReviewsCompleted,
      icon: FileCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Approved",
      value: summary.totalReviewsApproved,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Rejected",
      value: summary.totalReviewsRejected,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Pending Requests",
      value: summary.pendingReviewRequests,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "In Progress",
      value: summary.acceptedReviewRequests,
      icon: ClipboardCheck,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Expired",
      value: summary.expiredReviewRequests,
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Avg Review Time",
      value: averageReviewTime.toFixed(1) + " days",
      icon: Clock,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`rounded-[10px] ${card.bgColor} p-6 shadow-1 dark:shadow-card`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
                  {typeof card.value === "string" ? card.value : compactFormat(card.value)}
                </p>
              </div>
              <div className={`${card.color} rounded-full p-3`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


