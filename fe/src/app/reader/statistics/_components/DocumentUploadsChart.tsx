"use client";

import type { TimeSeriesData } from "@/types/statistics";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface DocumentUploadsChartProps {
  data: TimeSeriesData[];
}

export function DocumentUploadsChart({ data }: DocumentUploadsChartProps) {
  const chartData = data.map((item) => ({
    x: item.date,
    y: item.count,
  }));

  const options: ApexOptions = {
    colors: ["#5750F1"],
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
        text: "Documents",
      },
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
    grid: {
      strokeDashArray: 5,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 100],
      },
    },
  };

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
        Document Uploads Over Time
      </h3>
      <Chart
        options={options}
        series={[
          {
            name: "Documents Uploaded",
            data: chartData,
          },
        ]}
        type="area"
        height={350}
      />
    </div>
  );
}

