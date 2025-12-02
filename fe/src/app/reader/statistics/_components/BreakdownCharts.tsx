"use client";

import type { StatusBreakdown, PremiumBreakdown } from "@/types/statistics";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { compactFormat } from "@/utils/format-number";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface BreakdownChartsProps {
  statusBreakdown: StatusBreakdown[];
  premiumBreakdown: PremiumBreakdown;
}

export function BreakdownCharts({
  statusBreakdown,
  premiumBreakdown,
}: BreakdownChartsProps) {
  const statusChartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#10B981", "#F59E0B", "#EF4444"],
    labels: statusBreakdown.map((item) => item.status),
    legend: {
      show: true,
      position: "bottom",
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
      formatter: (legendName, opts) => {
        const { seriesPercent } = opts.w.globals;
        return `${legendName}: ${seriesPercent[opts.seriesIndex]}%`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          background: "transparent",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Total",
              fontSize: "16px",
              fontWeight: "400",
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: "bold",
              formatter: (val) => compactFormat(+val),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
  };

  const premiumChartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#5750F1", "#0ABEF9"],
    labels: ["Premium", "Free"],
    legend: {
      show: true,
      position: "bottom",
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
      formatter: (legendName, opts) => {
        const { seriesPercent } = opts.w.globals;
        return `${legendName}: ${seriesPercent[opts.seriesIndex]}%`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          background: "transparent",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Total",
              fontSize: "16px",
              fontWeight: "400",
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: "bold",
              formatter: (val) => compactFormat(+val),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Document Status Breakdown
        </h3>
        <Chart
          options={statusChartOptions}
          series={statusBreakdown.map((item) => item.count)}
          type="donut"
          height={300}
        />
      </div>

      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Premium vs Free Documents
        </h3>
        <Chart
          options={premiumChartOptions}
          series={[premiumBreakdown.premiumCount, premiumBreakdown.freeCount]}
          type="donut"
          height={300}
        />
      </div>
    </div>
  );
}

