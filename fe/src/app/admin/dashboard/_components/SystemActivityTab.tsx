"use client";

import type { LoadState } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { SystemAdminDashboard } from "./types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SystemActivityTabProps {
  state: LoadState;
  statistics: SystemAdminDashboard | null;
  error: string | null;
}

export function SystemActivityTab({ state, statistics, error }: SystemActivityTabProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading system activity statistics...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !statistics || !statistics.systemActivity) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load system activity statistics"}
        </p>
      </div>
    );
  }

  const { systemActivity } = statistics;

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

  // Documents Uploaded Chart
  const docsDates = systemActivity?.documentsUploaded?.map((d) => d.date) || [];
  const docsCategories = getFormattedCategories(docsDates);
  const docsData = systemActivity?.documentsUploaded?.map((d) => d.count) || [];

  const docsOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: docsCategories,
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
        hideOverlappingLabels: true,
      },
    },
    yaxis: { 
      title: { text: "Documents" },
      min: 0,
      forceNiceScale: true,
      tickAmount: 5,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
      },
    },
    colors: ["#3b82f6"],
    title: {
      text: "Documents Uploaded Over Time",
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
          if (index >= 0 && index < docsDates.length) {
            return formatDateForTooltip(docsDates[index]);
          }
          return val.toString();
        },
      },
    },
  };

  const docsSeries = [{ name: "Documents Uploaded", data: docsData }];

  // Organizations Created Chart
  const orgsDates = systemActivity?.organizationsCreated?.map((d) => d.date) || [];
  const orgsCategories = getFormattedCategories(orgsDates);
  const orgsData = systemActivity?.organizationsCreated?.map((d) => d.count) || [];

  const orgsOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: orgsCategories,
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
        hideOverlappingLabels: true,
      },
    },
    yaxis: { 
      title: { text: "Organizations" },
      min: 0,
      forceNiceScale: true,
      tickAmount: 5,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
      },
    },
    colors: ["#10b981"],
    title: {
      text: "Organizations Created Over Time",
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
          if (index >= 0 && index < orgsDates.length) {
            return formatDateForTooltip(orgsDates[index]);
          }
          return val.toString();
        },
      },
    },
  };

  const orgsSeries = [{ name: "Organizations Created", data: orgsData }];

  return (
    <div className="space-y-6">
      {/* Documents Uploaded */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={docsOptions} series={docsSeries} type="bar" height={400} />
      </div>

      {/* Organizations Created */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={orgsOptions} series={orgsSeries} type="bar" height={400} />
      </div>
    </div>
  );
}

