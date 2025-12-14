"use client";

import dynamic from "next/dynamic";
import type { OrganizationStatistics } from "@/types/statistics";
import type { ApexOptions } from "apexcharts";

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
    stroke: { curve: "smooth" as const, width: 2 },
    xaxis: {
      categories: statistics.memberGrowth.map((d) => d.date),
      labels: {
        rotateAlways: true,
        showDuplicates: true,
        formatter: (value: string) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
        style: { fontSize: "11px" },
      },
      tickAmount: Math.min(12, statistics.memberGrowth.length),
    },
    yaxis: { 
      title: { text: "New Members" },
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      forceNiceScale: true,
      decimalsInFloat: 0,
    },
    tooltip: {
      y: {
        formatter: (val: number) => Math.round(val).toString(),
      },
    },
    fill: { type: "gradient" as const, gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9 } },
    colors: ["#3C50E0"],
    title: { text: "Member Growth", style: { fontSize: "16px", fontWeight: 600 } },
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
      type: "line" as const,
      height: 350,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const, width: 2 },
    xaxis: {
      categories: statistics.documentUploads.map((d) => d.date),
      labels: {
        rotateAlways: true,
        showDuplicates: true,
        formatter: (value: string) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
        style: { fontSize: "11px" },
      },
      tickAmount: Math.min(12, statistics.documentUploads.length),
    },
    yaxis: { 
      title: { text: "Documents" },
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      forceNiceScale: true,
      decimalsInFloat: 0,
    },
    tooltip: {
      y: {
        formatter: (val: number) => Math.round(val).toString(),
      },
    },
    colors: ["#10B981"],
    title: { text: "Document Uploads", style: { fontSize: "16px", fontWeight: 600 } },
  };

  const documentUploadsSeries = [
    {
      name: "Documents",
      data: statistics.documentUploads.map((d) => d.count),
    },
  ];

  // Document Views Chart
  const documentViewsOptions: ApexOptions = {
    chart: {
      type: "area" as const,
      height: 350,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const, width: 2 },
    xaxis: {
      categories: statistics.documentViews.map((d) => d.date),
      labels: {
        rotateAlways: true,
        showDuplicates: true,
        formatter: (value: string) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
        style: { fontSize: "11px" },
      },
      tickAmount: Math.min(12, statistics.documentViews.length),
    },
    yaxis: { 
      title: { text: "Views" },
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      forceNiceScale: true,
      decimalsInFloat: 0,
    },
    tooltip: {
      y: {
        formatter: (val: number) => Math.round(val).toString(),
      },
    },
    fill: { type: "gradient" as const, gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9 } },
    colors: ["#F59E0B"],
    title: { text: "Document Views", style: { fontSize: "16px", fontWeight: 600 } },
  };

  const documentViewsSeries = [
    {
      name: "Views",
      data: statistics.documentViews.map((d) => d.count),
    },
  ];

  // Votes Received Chart
  const votesOptions: ApexOptions = {
    chart: {
      type: "line" as const,
      height: 350,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const, width: 2 },
    xaxis: {
      categories: statistics.votesReceived.map((d) => d.date),
      labels: {
        rotateAlways: true,
        showDuplicates: true,
        formatter: (value: string) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
        style: { fontSize: "11px" },
      },
      tickAmount: Math.min(12, statistics.votesReceived.length),
    },
    yaxis: { 
      title: { text: "Votes" },
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      forceNiceScale: true,
      decimalsInFloat: 0,
    },
    tooltip: {
      y: {
        formatter: (val: number) => Math.round(val).toString(),
      },
    },
    colors: ["#8B5CF6"],
    title: { text: "Votes Received", style: { fontSize: "16px", fontWeight: 600 } },
  };

  const votesSeries = [
    {
      name: "Votes",
      data: statistics.votesReceived.map((d) => d.count),
    },
  ];

  // Comments Received Chart
  const commentsOptions: ApexOptions = {
    chart: {
      type: "area" as const,
      height: 350,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const, width: 2 },
    xaxis: {
      categories: statistics.commentsReceived.map((d) => d.date),
      labels: {
        rotateAlways: true,
        showDuplicates: true,
        formatter: (value: string) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
        style: { fontSize: "11px" },
      },
      tickAmount: Math.min(12, statistics.commentsReceived.length),
    },
    yaxis: { 
      title: { text: "Comments" },
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
      forceNiceScale: true,
      decimalsInFloat: 0,
    },
    tooltip: {
      y: {
        formatter: (val: number) => Math.round(val).toString(),
      },
    },
    fill: { type: "gradient" as const, gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9 } },
    colors: ["#EF4444"],
    title: { text: "Comments Received", style: { fontSize: "16px", fontWeight: 600 } },
  };

  const commentsSeries = [
    {
      name: "Comments",
      data: statistics.commentsReceived.map((d) => d.count),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Member Growth & Document Uploads */}
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
            type="line"
            height={350}
          />
        </div>
      </div>

      {/* Document Views & Votes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart
            options={documentViewsOptions}
            series={documentViewsSeries}
            type="area"
            height={350}
          />
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart options={votesOptions} series={votesSeries} type="line" height={350} />
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={commentsOptions}
          series={commentsSeries}
          type="area"
          height={350}
        />
      </div>
    </div>
  );
}

