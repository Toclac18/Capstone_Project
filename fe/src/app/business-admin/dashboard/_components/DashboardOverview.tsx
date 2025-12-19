"use client";

import type { BusinessAdminDashboard, LoadState } from "@/types/statistics";
import { FileText, Users, Building2, AlertTriangle, Activity, TrendingUp } from "lucide-react";

interface DashboardOverviewProps {
  state: LoadState;
  dashboard: BusinessAdminDashboard | null;
  error: string | null;
}

export function DashboardOverview({ state, dashboard, error }: DashboardOverviewProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !dashboard) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-800 dark:text-red-200">
          {error || "Failed to load dashboard"}
        </p>
      </div>
    );
  }

  const { overview, quickStats } = dashboard;

  const overviewCards = [
    {
      title: "Total Documents",
      value: overview.totalDocuments.toLocaleString(),
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Users",
      value: overview.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Total Organizations",
      value: overview.totalOrganizations.toLocaleString(),
      icon: Building2,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Pending Reports",
      value: overview.pendingReports.toLocaleString(),
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Active Users",
      value: overview.activeUsers.toLocaleString(),
      icon: Activity,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      title: "Active Organizations",
      value: overview.activeOrganizations.toLocaleString(),
      icon: Building2,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    },
  ];

  const quickStatsCards = [
    {
      title: "Documents Today",
      value: quickStats.documentsToday,
      period: "Today",
    },
    {
      title: "Documents This Week",
      value: quickStats.documentsThisWeek,
      period: "This Week",
    },
    {
      title: "Documents This Month",
      value: quickStats.documentsThisMonth,
      period: "This Month",
    },
    {
      title: "Reports Today",
      value: quickStats.reportsToday,
      period: "Today",
    },
    {
      title: "Reports This Week",
      value: quickStats.reportsThisWeek,
      period: "This Week",
    },
    {
      title: "Reports This Month",
      value: quickStats.reportsThisMonth,
      period: "This Month",
    },
    {
      title: "New Users Today",
      value: quickStats.newUsersToday,
      period: "Today",
    },
    {
      title: "New Users This Week",
      value: quickStats.newUsersThisWeek,
      period: "This Week",
    },
    {
      title: "New Users This Month",
      value: quickStats.newUsersThisMonth,
      period: "This Month",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card ${card.bgColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
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

      {/* Quick Stats */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Statistics
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickStatsCards.map((stat, index) => (
            <div
              key={index}
              className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-800"
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{stat.period}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

