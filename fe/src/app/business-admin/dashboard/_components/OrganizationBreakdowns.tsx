"use client";

import dynamic from "next/dynamic";
import type { OrganizationStatistics } from "@/types/statistics";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface OrganizationBreakdownsProps {
  statistics: OrganizationStatistics;
}

export function OrganizationBreakdowns({ statistics }: OrganizationBreakdownsProps) {
  // Member Status Breakdown
  const memberStatusOptions: ApexOptions = {
    chart: {
      type: "donut" as const,
      height: 300,
    },
    labels: statistics.memberStatusBreakdown.map((b) => b.status),
    title: {
      text: "Member Status",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#10B981", "#F59E0B", "#EF4444", "#6B7280"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return `${val.toFixed(1)}%`;
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

  const memberStatusSeries = statistics.memberStatusBreakdown.map((b) => b.count);

  // Document Status Breakdown
  const documentStatusOptions: ApexOptions = {
    chart: {
      type: "donut" as const,
      height: 300,
    },
    labels: statistics.documentStatusBreakdown.map((b) => b.status),
    title: {
      text: "Document Status",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#10B981", "#F59E0B", "#EF4444", "#6B7280"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return `${val.toFixed(1)}%`;
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

  const documentStatusSeries = statistics.documentStatusBreakdown.map((b) => b.count);

  // Document Visibility Breakdown
  const visibilityOptions: ApexOptions = {
    chart: {
      type: "donut" as const,
      height: 300,
    },
    labels: statistics.documentVisibilityBreakdown.map((b) => b.visibility),
    title: {
      text: "Document Visibility",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#3C50E0", "#8B5CF6", "#F59E0B"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return `${val.toFixed(1)}%`;
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

  const visibilitySeries = statistics.documentVisibilityBreakdown.map((b) => b.count);

  // Premium Breakdown
  const premiumOptions: ApexOptions = {
    chart: {
      type: "donut" as const,
      height: 300,
    },
    labels: ["Premium", "Free"],
    title: {
      text: "Premium vs Free Documents",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#F59E0B", "#10B981"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return `${val.toFixed(1)}%`;
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

  const premiumSeries = [
    statistics.premiumBreakdown.premiumCount,
    statistics.premiumBreakdown.freeCount,
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={memberStatusOptions}
          series={memberStatusSeries}
          type="donut"
          height={300}
        />
      </div>
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={documentStatusOptions}
          series={documentStatusSeries}
          type="donut"
          height={300}
        />
      </div>
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={visibilityOptions}
          series={visibilitySeries}
          type="donut"
          height={300}
        />
      </div>
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={premiumOptions} series={premiumSeries} type="donut" height={300} />
      </div>
    </div>
  );
}

