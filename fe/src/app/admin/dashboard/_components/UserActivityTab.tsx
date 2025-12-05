"use client";

import type { LoadState } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { UserPlus } from "lucide-react";
import type { SystemAdminDashboard } from "./types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UserActivityTabProps {
  state: LoadState;
  statistics: SystemAdminDashboard | null;
  error: string | null;
}

export function UserActivityTab({ state, statistics, error }: UserActivityTabProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user activity statistics...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !statistics || !statistics.userActivity) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load user activity statistics"}
        </p>
      </div>
    );
  }

  const { userActivity } = statistics;

  // Format dates for charts
  const formatDateForChart = (date: string): string => {
    const parts = date.split("-");
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return date;
  };

  const formatDateForTooltip = (date: string): string => {
    const parts = date.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${parseInt(day, 10)}, ${year}`;
    }
    return date;
  };

  const getFormattedCategories = (dates: string[], maxLabels: number = 10): string[] => {
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

  // User Activity Cards
  const userActivityCards = [
    {
      title: "New Users Today",
      value: userActivity?.newUsersToday ?? 0,
      icon: UserPlus,
      color: "blue",
    },
    {
      title: "New Users This Week",
      value: userActivity?.newUsersThisWeek ?? 0,
      icon: UserPlus,
      color: "green",
    },
    {
      title: "New Users This Month",
      value: userActivity?.newUsersThisMonth ?? 0,
      icon: UserPlus,
      color: "purple",
    },
    {
      title: "Total Readers",
      value: userActivity?.totalReaders ?? 0,
      icon: UserPlus,
      color: "orange",
    },
    {
      title: "Total Reviewers",
      value: userActivity?.totalReviewers ?? 0,
      icon: UserPlus,
      color: "blue",
    },
    {
      title: "Total Org Admins",
      value: userActivity?.totalOrganizationAdmins ?? 0,
      icon: UserPlus,
      color: "green",
    },
  ];

  // User Growth by Role Chart
  const roleGrowthData = userActivity?.userGrowthByRole || [];
  const roleGrowthSeries = roleGrowthData.map((roleData) => ({
    name: roleData.role,
    data: roleData.growth?.map((d) => d.count) || [],
  }));
  const roleGrowthDates = roleGrowthData[0]?.growth?.map((d) => d.date) || [];
  const roleGrowthCategories = getFormattedCategories(roleGrowthDates);

  const roleGrowthOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: roleGrowthCategories,
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
        hideOverlappingLabels: true,
      },
    },
    yaxis: { 
      title: { text: "User Count" },
      min: 0,
      forceNiceScale: true,
      tickAmount: 5,
    },
    legend: { position: "top" },
    title: {
      text: "User Growth by Role Over Time",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: function (val: number, opts: any) {
          const index = opts.dataPointIndex;
          if (roleGrowthDates.length > 0 && index >= 0 && index < roleGrowthDates.length) {
            return formatDateForTooltip(roleGrowthDates[index]);
          }
          return val.toString();
        },
      },
    },
  };

  // Format status name to friendly text
  const formatStatusName = (status: string): string => {
    const statusMap: Record<string, string> = {
      ACTIVE: "Active",
      INACTIVE: "Inactive",
      PENDING_EMAIL_VERIFY: "Pending Email Verify",
      PENDING_APPROVE: "Pending Approval",
      REJECTED: "Rejected",
      DELETED: "Deleted",
    };
    return statusMap[status] || status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // User Status Breakdown Chart
  const statusBreakdown = userActivity?.userStatusBreakdown || [];
  const formattedLabels = statusBreakdown.map((s) => formatStatusName(s.status));
  const statusPieOptions: ApexOptions = {
    chart: { type: "pie", height: 400 },
    labels: formattedLabels,
    legend: { position: "bottom" },
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: any) {
        return formattedLabels[opts.seriesIndex] + ": " + val.toFixed(1) + "%";
      },
      style: {
        fontSize: "15px",
        fontWeight: 800,
        fontFamily: "inherit",
        colors: ["#ffffff"],
      },
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: false,
          },
        },
      },
    },
    title: {
      text: "User Status Distribution",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };
  const statusPieSeries = statusBreakdown.map((s) => s.count);

  // New Users Registration Chart
  const newUsersDates = userActivity?.newUsersRegistration?.map((d) => d.date) || [];
  const newUsersCategories = getFormattedCategories(newUsersDates);
  const newUsersData = userActivity?.newUsersRegistration?.map((d) => d.count) || [];

  const newUsersOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: newUsersCategories,
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
        hideOverlappingLabels: true,
      },
    },
    yaxis: { 
      title: { text: "New Users" },
      min: 0,
      forceNiceScale: true,
      tickAmount: 5,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
      },
    },
    colors: ["#8b5cf6"],
    title: {
      text: "New Users Registration Over Time",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: function (val: number, opts: any) {
          const index = opts.dataPointIndex;
          if (index >= 0 && index < newUsersDates.length) {
            return formatDateForTooltip(newUsersDates[index]);
          }
          return val.toString();
        },
      },
    },
  };

  const newUsersSeries = [{ name: "New Users", data: newUsersData }];

  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    red: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userActivityCards.map((card) => {
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
                  <p className="mt-2 text-xl font-bold text-dark dark:text-white">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Growth by Role Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={roleGrowthOptions} series={roleGrowthSeries} type="line" height={400} />
      </div>

      {/* User Status Distribution and New Users Registration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart options={statusPieOptions} series={statusPieSeries} type="pie" height={400} />
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart options={newUsersOptions} series={newUsersSeries} type="bar" height={400} />
        </div>
      </div>
    </div>
  );
}

