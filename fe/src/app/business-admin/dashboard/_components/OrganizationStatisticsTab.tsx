 "use client";

import type { GlobalDocumentStatistics, LoadState } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface OrganizationStatisticsTabProps {
  state: LoadState;
  statistics: GlobalDocumentStatistics | null;
  error: string | null;
}

export function OrganizationStatisticsTab({
  state,
  statistics,
  error,
}: OrganizationStatisticsTabProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading organization statistics...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !statistics) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load organization statistics"}
        </p>
      </div>
    );
  }

  const { summary, organizationBreakdown } = statistics;

  const orgSummaryCards = [
    {
      title: "Total Organizations",
      value: summary.totalOrganizations,
    },
    {
      title: "Total Uploaders",
      value: summary.totalUploaders,
    },
    {
      title: "Total Documents",
      value: summary.totalDocuments,
    },
  ];

  const topOrganizations = organizationBreakdown.slice(0, 10);

  const orgChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: topOrganizations.map((org) => org.organizationName),
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    colors: ["#3C50E0"],
    title: {
      text: "Top Organizations by Document Count",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const orgChartSeries = [
    {
      name: "Documents",
      data: topOrganizations.map((org) => org.documentCount),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {orgSummaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card"
          >
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {card.title}
            </p>
            <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Top Organizations Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={orgChartOptions} series={orgChartSeries} type="bar" height={400} />
      </div>

      {/* Top Organizations Table */}
      {organizationBreakdown.length > 0 && (
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Organizations Overview
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="p-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Organization
                  </th>
                  <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Documents
                  </th>
                </tr>
              </thead>
              <tbody>
                {organizationBreakdown.map((org) => (
                  <tr
                    key={org.organizationId}
                    className="border-b border-stroke last:border-0 dark:border-dark-3"
                  >
                    <td className="p-3 text-sm text-dark dark:text-white">
                      {org.organizationName}
                    </td>
                    <td className="p-3 text-right text-sm font-semibold text-dark dark:text-white">
                      {org.documentCount.toLocaleString()}
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

