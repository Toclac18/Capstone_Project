"use client";

import type { LoadState } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Users, TrendingUp, UserPlus } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface RoleBreakdown {
  role: string;
  total: number;
  active: number;
  inactive: number;
  pendingVerification: number;
}

export interface UserStatistics {
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    pendingVerificationUsers: number;
    totalReaders: number;
    totalReviewers: number;
    totalOrganizationAdmins: number;
    newUsersThisMonth: number;
    newUsersLastMonth: number;
    growthRate: number;
  };
  userGrowth: Array<{ date: string; count: number }>;
  activeUsersGrowth: Array<{ date: string; count: number }>;
  roleBreakdown: RoleBreakdown[];
  statusBreakdown: Array<{ status: string; count: number }>;
}

interface UserStatisticsTabProps {
  state: LoadState;
  statistics: UserStatistics | null;
  error: string | null;
}

export function UserStatisticsTab({ state, statistics, error }: UserStatisticsTabProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user statistics...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !statistics || !statistics.summary) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load user statistics"}
        </p>
      </div>
    );
  }

  const { 
    summary, 
    userGrowth = [], 
    activeUsersGrowth = [], 
    roleBreakdown = [], 
    statusBreakdown = [] 
  } = statistics;

  const summaryCards = [
    {
      title: "Total Users",
      value: summary.totalUsers ?? 0,
      icon: Users,
      color: "blue",
    },
    {
      title: "Active Users",
      value: summary.activeUsers ?? 0,
      icon: Users,
      color: "green",
    },
    {
      title: "New Users This Month",
      value: summary.newUsersThisMonth ?? 0,
      icon: UserPlus,
      color: "purple",
    },
    {
      title: "Growth Rate",
      value: `${(summary.growthRate ?? 0) >= 0 ? "+" : ""}${(summary.growthRate ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: (summary.growthRate ?? 0) >= 0 ? "green" : "red",
    },
  ];

  // Format dates and prepare categories with spacing
  const formatDateForChart = (date: string): string => {
    const parts = date.split("-");
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return date;
  };

  const getFormattedCategories = (dates: string[], maxLabels: number = 10) => {
    if (dates.length <= maxLabels) {
      return dates.map(formatDateForChart);
    }
    const step = Math.ceil(dates.length / maxLabels);
    return dates.map((date, index) => {
      if (index % step === 0 || index === dates.length - 1) {
        return formatDateForChart(date);
      }
      return "";
    });
  };

  // Prepare data for growth chart
  const growthChartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: getFormattedCategories(userGrowth.map((d) => d.date)),
      labels: {
        rotate: -45,
        style: {
          fontSize: "11px",
        },
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      title: {
        text: "Number of Users",
      },
    },
    legend: {
      position: "top",
    },
    colors: ["#3C50E0", "#10B981"],
    title: {
      text: "User Growth Trend",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  const growthChartSeries = [
    {
      name: "New Users",
      data: userGrowth.map((d) => d.count),
    },
    {
      name: "Active Users",
      data: activeUsersGrowth.map((d) => d.count),
    },
  ];

  // Role breakdown chart
  const roleChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: roleBreakdown.map((r) => r.role),
      labels: {
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Users",
      },
    },
    legend: {
      position: "top",
    },
    colors: ["#10B981", "#F59E0B", "#EF4444", "#6366F1"],
    title: {
      text: "Users by Role & Status",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const roleChartSeries = [
    {
      name: "Active",
      data: roleBreakdown.map((r) => r.active),
    },
    {
      name: "Inactive",
      data: roleBreakdown.map((r) => r.inactive),
    },
    {
      name: "Pending Verification",
      data: roleBreakdown.map((r) => r.pendingVerification),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
            purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
            red: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
          };

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
                    {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Growth Trend Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={growthChartOptions} series={growthChartSeries} type="line" height={400} />
      </div>

      {/* Users by Role & Status Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={roleChartOptions} series={roleChartSeries} type="bar" height={400} />
      </div>

      {/* Role Breakdown Table */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Role Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="p-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Role
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Inactive
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody>
              {roleBreakdown.map((role) => (
                <tr
                  key={role.role}
                  className="border-b border-stroke last:border-0 dark:border-dark-3"
                >
                  <td className="p-3 text-sm text-dark dark:text-white">{role.role}</td>
                  <td className="p-3 text-right text-sm font-semibold text-dark dark:text-white">
                    {role.total.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-sm text-emerald-600 dark:text-emerald-400">
                    {role.active.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-sm text-amber-600 dark:text-amber-400">
                    {role.inactive.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-sm text-indigo-600 dark:text-indigo-400">
                    {role.pendingVerification.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Readers</p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
            {(summary.totalReaders ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviewers</p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
            {(summary.totalReviewers ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Organization Admins
          </p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
            {(summary.totalOrganizationAdmins ?? 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
