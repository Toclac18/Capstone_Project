"use client";

import type { PersonalDocumentStatistics } from "@/types/statistics";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ActivityChartsProps {
  statistics: PersonalDocumentStatistics;
}

export function ActivityCharts({ statistics }: ActivityChartsProps) {
  const chartData = [
    {
      name: "Views",
      data: statistics.documentViews.map((item) => ({
        x: item.date,
        y: item.count,
      })),
    },
    {
      name: "Votes",
      data: statistics.votesReceived.map((item) => ({
        x: item.date,
        y: item.count,
      })),
    },
    {
      name: "Comments",
      data: statistics.commentsReceived.map((item) => ({
        x: item.date,
        y: item.count,
      })),
    },
    {
      name: "Saves",
      data: statistics.documentsSaved.map((item) => ({
        x: item.date,
        y: item.count,
      })),
    },
  ];

  const options: ApexOptions = {
    colors: ["#5750F1", "#0ABEF9", "#10B981", "#F59E0B"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "line",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    xaxis: {
      type: "datetime",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Count",
      },
    },
    grid: {
      strokeDashArray: 5,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Satoshi",
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      x: {
        format: "dd MMM yyyy",
      },
    },
  };

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
        Document Activity Over Time
      </h3>
      <Chart
        options={options}
        series={chartData}
        type="line"
        height={350}
      />
    </div>
  );
}

