"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { OrganizationStatistics } from "@/types/statistics";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface OrganizationChartsProps {
  statistics: OrganizationStatistics;
}

export function OrganizationCharts({ statistics }: OrganizationChartsProps) {
  // Member Growth Chart
  const memberGrowthOptions: ApexOptions = {
    chart: {
      type: "area" as const,
      height: 350,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const },
    xaxis: {
      categories: statistics.memberGrowth.map((d) => d.date),
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
      tickAmount: Math.min(12, statistics.memberGrowth.length), // Show more ticks evenly
    },
    title: {
      text: "Member Growth",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#3b82f6"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      },
    },
  };

  const memberGrowthSeries = [
    {
      name: "New Members",
      data: statistics.memberGrowth.map((d) => d.count),
    },
  ];

  // Document Uploads Chart
  const documentUploadsOptions: ApexOptions = {
    chart: {
      type: "area" as const,
      height: 350,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const },
    xaxis: {
      categories: statistics.documentUploads.map((d) => d.date),
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
      tickAmount: Math.min(12, statistics.documentUploads.length), // Show more ticks evenly
    },
    title: {
      text: "Document Uploads",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#8b5cf6"],
    fill: {
      type: "gradient" as const,
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      },
    },
  };

  const documentUploadsSeries = [
    {
      name: "Uploads",
      data: statistics.documentUploads.map((d) => d.count),
    },
  ];

  // Activity Chart (Multi-line)
  const activityOptions: ApexOptions = {
    chart: {
      type: "line" as const,
      height: 350,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const, width: 2 },
    xaxis: {
      categories: statistics.documentViews.map((d) => d.date),
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
      tickAmount: Math.min(12, statistics.documentViews.length), // Show more ticks evenly
    },
    title: {
      text: "Organization Activity",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#f59e0b", "#10b981", "#3b82f6", "#ef4444"],
    legend: {
      position: "top" as const,
    },
  };

  const activitySeries = [
    {
      name: "Views",
      data: statistics.documentViews.map((d) => d.count),
    },
    {
      name: "Votes",
      data: statistics.votesReceived.map((d) => d.count),
    },
    {
      name: "Comments",
      data: statistics.commentsReceived.map((d) => d.count),
    },
    {
      name: "Saves",
      data: statistics.documentsSaved.map((d) => d.count),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={memberGrowthOptions}
          series={memberGrowthSeries}
          type="area"
          height={350}
        />
      </div>

      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={documentUploadsOptions}
          series={documentUploadsSeries}
          type="area"
          height={350}
        />
      </div>

      <div className="lg:col-span-2 rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={activityOptions}
          series={activitySeries}
          type="line"
          height={350}
        />
      </div>
    </div>
  );
}

