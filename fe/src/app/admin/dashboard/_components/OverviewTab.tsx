"use client";

import type { LoadState } from "@/types/statistics";
import { Users, Building2, FileText, BarChart3 } from "lucide-react";
import type { SystemAdminDashboard } from "./types";

interface OverviewTabProps {
  state: LoadState;
  statistics: SystemAdminDashboard | null;
  error: string | null;
}

export function OverviewTab({ state, statistics, error }: OverviewTabProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading overview...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !statistics || !statistics.overview) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load overview statistics"}
        </p>
      </div>
    );
  }

  const { overview } = statistics;

  const overviewCards = [
    {
      title: "Total Users",
      value: overview?.totalUsers ?? 0,
      icon: Users,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20",
      description: "Registered users in the system",
    },
    {
      title: "Total Organizations",
      value: overview?.totalOrganizations ?? 0,
      icon: Building2,
      color: "green",
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20",
      description: "Active organizations",
    },
    {
      title: "Total Documents",
      value: overview?.totalDocuments ?? 0,
      icon: FileText,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20",
      description: "Documents uploaded",
    },
  ];

  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-[10px] bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 shadow-1 dark:from-primary/20 dark:via-primary/10 dark:to-transparent">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/20 p-4 dark:bg-primary/30">
            <BarChart3 className="h-8 w-8 text-primary dark:text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-dark dark:text-white">System Overview</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Quick summary of your system&apos;s key metrics
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-[10px] bg-white p-6 shadow-1 transition-all duration-300 hover:shadow-2xl dark:bg-gray-dark dark:shadow-card dark:hover:shadow-2xl"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              
              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-dark dark:text-white">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
                <div className={`relative rounded-full bg-gradient-to-br ${card.bgGradient} p-4 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-7 w-7 ${colorClasses[card.color as keyof typeof colorClasses]}`} />
                </div>
              </div>

              {/* Decorative Element */}
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-5 blur-2xl`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

