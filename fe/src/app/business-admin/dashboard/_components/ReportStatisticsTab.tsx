"use client";

import type { ReportHandlingStatistics, LoadState } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ReportStatisticsTabProps {
  state: LoadState;
  statistics: ReportHandlingStatistics | null;
  error: string | null;
}

export function ReportStatisticsTab({
  state,
  statistics,
  error,
}: ReportStatisticsTabProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !statistics) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-800 dark:text-red-200">
          {error || "Failed to load statistics"}
        </p>
      </div>
    );
  }

  // Summary Cards
  const summaryCards = [
    { title: "Total Reports", value: statistics.summary.totalReports },
    { title: "Pending Reports", value: statistics.summary.pendingReports },
    { title: "In Review", value: statistics.summary.inReviewReports },
    { title: "Resolved", value: statistics.summary.resolvedReports },
    { title: "Rejected", value: statistics.summary.rejectedReports },
    {
      title: "Avg Resolution Time",
      value: `${statistics.summary.averageResolutionTime.toFixed(1)} hours`,
    },
  ];

  // Reports Created Chart
  const reportsCreatedOptions: ApexOptions = {
    chart: {
      type: "line" as const,
      height: 350,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const },
    xaxis: {
      categories: statistics.reportsCreated.map((d) => d.date),
      labels: {
        rotate: -45,
        rotateAlways: true,
        showDuplicates: true,
        formatter: function (value: string) {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
        style: {
          fontSize: "11px",
        },
      },
      tickAmount: Math.min(12, statistics.reportsCreated.length),
    },
    title: {
      text: "Reports Created Over Time",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#ef4444"],
  };

  const reportsCreatedSeries = [
    {
      name: "Reports Created",
      data: statistics.reportsCreated.map((d) => d.count),
    },
  ];

  // Status Breakdown Chart
  const statusTotal = statistics.statusBreakdown.reduce((sum, b) => sum + b.count, 0);
  const statusOptions: ApexOptions = {
    chart: {
      type: "donut" as const,
      height: 300,
    },
    labels: statistics.statusBreakdown.map((b) => b.status),
    title: {
      text: "Report Status Breakdown",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#6b7280"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: any) {
        // For donut charts, val is already the percentage value
        // But we need to calculate from the actual data
        if (opts?.w?.globals?.series && opts?.seriesIndex !== undefined) {
          const value = opts.w.globals.series[opts.seriesIndex];
          const total = opts.w.globals.seriesTotals?.reduce((a: number, b: number) => a + b, 0) ?? statusTotal;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
          return `${percentage}%`;
        }
        // Fallback: use val if it's already a percentage, or calculate from index
        if (val !== undefined && !isNaN(val)) {
          return `${val.toFixed(1)}%`;
        }
        // Last resort: calculate from statistics data
        const index = opts?.seriesIndex ?? 0;
        const value = statistics.statusBreakdown[index]?.count ?? 0;
        const percentage = statusTotal > 0 ? ((value / statusTotal) * 100).toFixed(1) : "0";
        return `${percentage}%`;
      },
      style: {
        fontSize: "22px",
        fontWeight: 900,
        fontFamily: "Arial, sans-serif",
        colors: ["#000000"],
      },
      dropShadow: {
        enabled: true,
        color: "#ffffff",
        blur: 6,
        opacity: 1,
        top: 2,
        left: 2,
      },
    },
  };

  const statusSeries = statistics.statusBreakdown.map((b) => b.count);

  // Reason Breakdown Chart
  const reasonOptions: ApexOptions = {
    chart: {
      type: "bar" as const,
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    xaxis: {
      categories: statistics.reasonBreakdown.map((b) => b.reason.replace(/_/g, " ")),
    },
    title: {
      text: "Reports by Reason",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#3b82f6"],
  };

  const reasonSeries = [
    {
      name: "Count",
      data: statistics.reasonBreakdown.map((b) => b.count),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card, index) => (
          <div key={index} className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {card.title}
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart
            options={reportsCreatedOptions}
            series={reportsCreatedSeries}
            type="line"
            height={350}
          />
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart options={statusOptions} series={statusSeries} type="donut" height={300} />
        </div>
      </div>

      {/* Reason Breakdown Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={reasonOptions} series={reasonSeries} type="bar" height={350} />
      </div>

      {/* Resolution Time Breakdown */}
      {statistics.resolutionTimeBreakdown.length > 0 && (
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Resolution Time Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <th className="p-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Time Range
                  </th>
                  <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {statistics.resolutionTimeBreakdown.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-stroke dark:border-strokedark last:border-0"
                  >
                    <td className="p-3 text-sm text-gray-900 dark:text-white">{item.timeRange}</td>
                    <td className="p-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {item.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

