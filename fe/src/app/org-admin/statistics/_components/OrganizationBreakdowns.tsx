"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type {
  StatusBreakdown,
  VisibilityBreakdown,
  PremiumBreakdown,
} from "@/types/statistics";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface OrganizationBreakdownsProps {
  memberStatusBreakdown: StatusBreakdown[];
  documentStatusBreakdown: StatusBreakdown[];
  documentVisibilityBreakdown: VisibilityBreakdown[];
  premiumBreakdown: PremiumBreakdown;
}

export function OrganizationBreakdowns({
  memberStatusBreakdown,
  documentStatusBreakdown,
  documentVisibilityBreakdown,
  premiumBreakdown,
}: OrganizationBreakdownsProps) {
  // Member Status Breakdown
  const memberStatusOptions: ApexOptions = {
    chart: {
      type: "donut" as const,
      height: 300,
    },
    labels: memberStatusBreakdown.map((b) => b.status),
    title: {
      text: "Member Status",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: any) {
        if (!opts?.w?.globals) return "0%";
        const total = opts.w.globals.seriesTotals.reduce(
          (a: number, b: number) => a + b,
          0,
        );
        const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
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

  const memberStatusSeries = memberStatusBreakdown.map((b) => b.count);

  // Document Status Breakdown
  const documentStatusOptions: ApexOptions = {
    chart: {
      type: "donut" as const,
      height: 300,
    },
    labels: documentStatusBreakdown.map((b) => b.status),
    title: {
      text: "Document Status",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: any) {
        if (!opts?.w?.globals) return "0%";
        const total = opts.w.globals.seriesTotals.reduce(
          (a: number, b: number) => a + b,
          0,
        );
        const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
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

  const documentStatusSeries = documentStatusBreakdown.map((b) => b.count);

  // Document Visibility Breakdown
  const visibilityOptions: ApexOptions = {
    chart: {
      type: "donut" as const,
      height: 300,
    },
    labels: documentVisibilityBreakdown.map((b) => b.visibility),
    title: {
      text: "Document Visibility",
      style: { fontSize: "16px", fontWeight: 600 },
    },
    colors: ["#3b82f6", "#8b5cf6", "#6366f1"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: any) {
        if (!opts?.w?.globals) return "0%";
        const total = opts.w.globals.seriesTotals.reduce(
          (a: number, b: number) => a + b,
          0,
        );
        const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
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

  const visibilitySeries = documentVisibilityBreakdown.map((b) => b.count);

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
    colors: ["#f59e0b", "#10b981"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: any) {
        if (!opts?.w?.globals) return "0%";
        const total = opts.w.globals.seriesTotals.reduce(
          (a: number, b: number) => a + b,
          0,
        );
        const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
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

  const premiumSeries = [premiumBreakdown.premiumCount, premiumBreakdown.freeCount];

  return (
    <div className="space-y-6">
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
        <Chart
          options={premiumOptions}
          series={premiumSeries}
          type="donut"
          height={300}
        />
      </div>
    </div>
  );
}

