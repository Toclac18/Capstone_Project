"use client";

import type { LoadState } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { LogIn, Activity, AlertCircle } from "lucide-react";
import type { SystemAdminDashboard } from "./types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AccessStatisticsTabProps {
  state: LoadState;
  statistics: SystemAdminDashboard | null;
  error: string | null;
}

export function AccessStatisticsTab({ state, statistics, error }: AccessStatisticsTabProps) {
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
    {
      title: "Active Users (7 days)",
      value: accessStatistics?.activeUsersLast7Days ?? 0,
      icon: Activity,
      color: "orange",
    },
    {
      title: "Active Users (30 days)",
      value: accessStatistics?.activeUsersLast30Days ?? 0,
      icon: Activity,
      color: "green",
    },
    {
      title: "Failed Logins Today",
      value: accessStatistics?.failedLoginsToday ?? 0,
      icon: AlertCircle,
      color: "red",
    },
  ];

  // Successful Logins Chart
  const loginSuccessDates = accessStatistics?.loginSuccessTrend?.map((d) => d.date) || [];
  const loginSuccessCategories = getFormattedCategories(loginSuccessDates);
  const loginSuccessData = accessStatistics?.loginSuccessTrend?.map((d) => d.count) || [];

  const loginSuccessOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: loginSuccessCategories,
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
        hideOverlappingLabels: true,
      },
    },
    yaxis: { 
      title: { text: "Login Count" },
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
    colors: ["#10B981"],
    title: {
      text: "Successful Logins Over Time",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const loginSuccessSeries = [{ name: "Successful Logins", data: loginSuccessData }];

  // Failed Logins Chart
  const loginFailedDates = accessStatistics?.loginFailedTrend?.map((d) => d.date) || [];
  const loginFailedCategories = getFormattedCategories(loginFailedDates);
  const loginFailedData = accessStatistics?.loginFailedTrend?.map((d) => d.count) || [];

  const loginFailedOptions: ApexOptions = {
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
      title: { text: "Login Count" },
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
    legend: { position: "top" },
    colors: ["#EF4444"],
    title: {
      text: "Failed Logins Over Time",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const loginFailedSeries = [{ name: "Failed Logins", data: loginFailedData }];

  // Active Users Trend Chart
  const activeUsersDates = accessStatistics?.activeUsersTrend?.map((d) => d.date) || [];
  const activeUsersCategories = getFormattedCategories(activeUsersDates);
  const activeUsersData = accessStatistics?.activeUsersTrend?.map((d) => d.count) || [];

  const activeUsersOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 400,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    xaxis: {
      categories: activeUsersCategories,
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
        hideOverlappingLabels: true,
      },
    },
    yaxis: { 
      title: { text: "Active Users (Daily)" },
      min: 0,
      forceNiceScale: true,
      tickAmount: 5,
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      decimalsInFloat: 0,
    },
    tooltip: {
      y: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      x: {
        formatter: function (val: number, opts: any) {
          const index = opts.dataPointIndex;
          if (index >= 0 && index < activeUsersDates.length) {
            return formatDateForTooltip(activeUsersDates[index]);
          }
          return val.toString();
        },
      },
    },
    colors: ["#3C50E0"],
    title: {
      text: "Daily Active Users",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const activeUsersSeries = [{ name: "Daily Active Users", data: activeUsersData }];

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

      {/* Successful Logins Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={loginSuccessOptions} series={loginSuccessSeries} type="line" height={400} />
      </div>

      {/* Failed Logins Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={loginFailedOptions} series={loginFailedSeries} type="line" height={400} />
      </div>

      {/* Daily Active Users Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={activeUsersOptions} series={activeUsersSeries} type="area" height={400} />
      </div>
    </div>
  );
}

