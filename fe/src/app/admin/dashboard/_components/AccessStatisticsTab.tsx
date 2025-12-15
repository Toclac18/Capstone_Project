"use client";

import type { LoadState, StatisticsQueryParams } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { LogIn } from "lucide-react";
import type { SystemAdminDashboard } from "./types";
import { useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AccessStatisticsTabProps {
  state: LoadState;
  statistics: SystemAdminDashboard | null;
  error: string | null;
  filters?: StatisticsQueryParams;
  onFilterChange?: (filters: StatisticsQueryParams) => void;
}

type TimeRange = "all" | "7days" | "1year";

export function AccessStatisticsTab({ state, statistics, error, onFilterChange }: AccessStatisticsTabProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1year");
  
  // Get login dates for chart - must be before early returns (Rules of Hooks)
  const loginSuccessDates = statistics?.accessStatistics?.loginSuccessTrend?.map((d) => d.date) || [];

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading access statistics...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !statistics || !statistics.accessStatistics) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load access statistics"}
        </p>
      </div>
    );
  }

  const { accessStatistics } = statistics;

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

  // Access Statistics Cards
  const accessCards = [
    {
      title: "Logins Today",
      value: accessStatistics?.totalLoginsToday ?? 0,
      icon: LogIn,
      color: "blue",
    },
    {
      title: "Logins This Week",
      value: accessStatistics?.totalLoginsThisWeek ?? 0,
      icon: LogIn,
      color: "green",
    },
    {
      title: "Logins This Month",
      value: accessStatistics?.totalLoginsThisMonth ?? 0,
      icon: LogIn,
      color: "purple",
    },
  ];

  const loginChartCategories = getFormattedCategories(loginSuccessDates);
  const loginChartData = accessStatistics?.loginSuccessTrend?.map((d) => d.count) || [];

  const loginChartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: loginChartCategories,
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
        hideOverlappingLabels: true,
      },
    },
    yaxis: { 
      title: { text: "Number of Logins" },
      min: 0,
      forceNiceScale: true,
      tickAmount: 5,
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      decimalsInFloat: 0,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      x: {
        formatter: function (val: number, opts: any) {
          const index = opts.dataPointIndex;
          if (index >= 0 && index < loginSuccessDates.length) {
            return formatDateForTooltip(loginSuccessDates[index]);
          }
          return val.toString();
        },
      },
    },
    legend: { position: "top" },
    colors: ["#3b82f6"],
    title: {
      text: "Number of logins by time",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const loginChartSeries = [
    { name: "Logins", data: loginChartData },
  ];

  // Failed Logins Chart
  const loginFailedDates = accessStatistics?.loginFailedTrend?.map((d) => d.date) || [];
  const loginFailedCategories = getFormattedCategories(loginFailedDates);
  const loginFailedData = accessStatistics?.loginFailedTrend?.map((d) => d.count) || [];

  const failedLoginsChartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: loginFailedCategories,
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
        hideOverlappingLabels: true,
      },
    },
    yaxis: { 
      title: { text: "Number of Failed Logins" },
      min: 0,
      forceNiceScale: true,
      tickAmount: 5,
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      decimalsInFloat: 0,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      x: {
        formatter: function (val: number, opts: any) {
          const index = opts.dataPointIndex;
          if (index >= 0 && index < loginFailedDates.length) {
            return formatDateForTooltip(loginFailedDates[index]);
          }
          return val.toString();
        },
      },
    },
    colors: ["#EF4444"],
    title: {
      text: "Failed Logins Over Time",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const failedLoginsChartSeries = [
    { name: "Failed Logins", data: loginFailedData },
  ];

  // Handle time range filter
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    if (onFilterChange) {
      const now = new Date();
      const newFilters: StatisticsQueryParams = {};
      
      if (range === "7days") {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        newFilters.startDate = startDate.toISOString().split("T")[0];
        newFilters.endDate = now.toISOString().split("T")[0];
      } else if (range === "1year") {
        const startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        newFilters.startDate = startDate.toISOString().split("T")[0];
        newFilters.endDate = now.toISOString().split("T")[0];
      }
      // "all" means no filters
      
      onFilterChange(newFilters);
    }
  };

  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    red: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="space-y-6">
      {/* Time Range Filter Buttons */}
      <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex gap-2">
          <button
            onClick={() => handleTimeRangeChange("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              timeRange === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTimeRangeChange("7days")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              timeRange === "7days"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => handleTimeRangeChange("1year")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              timeRange === "1year"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            1 year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accessCards.map((card) => {
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Number of Logins by Time Chart */}
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart options={loginChartOptions} series={loginChartSeries} type="line" height={400} />
        </div>

        {/* Failed Logins Chart */}
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          {loginFailedData.length > 0 ? (
            <Chart options={failedLoginsChartOptions} series={failedLoginsChartSeries} type="line" height={400} />
          ) : (
            <div className="flex h-[400px] items-center justify-center text-gray-500 dark:text-gray-400">
              <p>No failed login data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

