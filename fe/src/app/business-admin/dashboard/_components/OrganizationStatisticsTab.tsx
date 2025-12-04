"use client";

import type { LoadState } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Building2, Users, FileText, Eye, TrendingUp } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface GlobalOrganizationStatistics {
  summary: {
    totalOrganizations: number;
    totalMembers: number;
    totalDocuments: number;
    totalViews: number;
    totalUpvotes: number;
    totalComments: number;
    activeOrganizations: number;
    averageMembersPerOrganization: number;
    averageDocumentsPerOrganization: number;
    averageViewsPerOrganization: number;
  };
  organizationGrowth: Array<{ date: string; count: number }>;
  memberGrowth: Array<{ date: string; count: number }>;
  documentUploads: Array<{ date: string; count: number }>;
  documentViews: Array<{ date: string; count: number }>;
  topOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    memberCount: number;
    documentCount: number;
    viewCount: number;
    totalScore: number;
  }>;
  organizationTypeBreakdown: Array<{ type: string; count: number }>;
  memberCountBreakdown: Array<{ range: string; count: number }>;
}

interface OrganizationStatisticsTabProps {
  state: LoadState;
  statistics: GlobalOrganizationStatistics | null;
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

  if (state === "error" || !statistics || !statistics.summary) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load organization statistics"}
        </p>
      </div>
    );
  }

  const { 
    summary, 
    organizationGrowth = [], 
    memberGrowth = [], 
    documentUploads = [], 
    documentViews = [], 
    topOrganizations = [], 
    organizationTypeBreakdown = [], 
    memberCountBreakdown = [] 
  } = statistics;

  const summaryCards = [
    {
      title: "Total Organizations",
      value: summary.totalOrganizations ?? 0,
      icon: Building2,
      color: "blue",
    },
    {
      title: "Total Members",
      value: summary.totalMembers ?? 0,
      icon: Users,
      color: "green",
    },
    {
      title: "Total Documents",
      value: summary.totalDocuments ?? 0,
      icon: FileText,
      color: "purple",
    },
    {
      title: "Total Views",
      value: summary.totalViews ?? 0,
      icon: Eye,
      color: "orange",
    },
  ];

  // Format dates and prepare categories with spacing
  const formatDateForChart = (date: string): string => {
    const parts = date.split("-");
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return date;
  };

  const getFormattedCategories = (dates: string[], maxLabels: number = 10) => {
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

  // Organization Growth Chart
  const orgGrowthChartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: getFormattedCategories(organizationGrowth.map((d) => d.date)),
      labels: {
        rotate: -45,
        style: {
          fontSize: "11px",
        },
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      title: {
        text: "Number of Organizations",
      },
    },
    colors: ["#3C50E0"],
    title: {
      text: "Organization Growth Over Time",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const orgGrowthChartSeries = [
    {
      name: "New Organizations",
      data: organizationGrowth.map((d) => d.count),
    },
  ];

  // Member Growth Chart
  const memberGrowthChartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: getFormattedCategories(memberGrowth.map((d) => d.date)),
      labels: {
        rotate: -45,
        style: {
          fontSize: "11px",
        },
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      title: {
        text: "Number of Members",
      },
    },
    colors: ["#10B981"],
    title: {
      text: "Member Growth Across All Organizations",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const memberGrowthChartSeries = [
    {
      name: "New Members",
      data: memberGrowth.map((d) => d.count),
    },
  ];

  // Document Activity Chart
  const documentActivityChartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: getFormattedCategories(documentUploads.map((d) => d.date)),
      labels: {
        rotate: -45,
        style: {
          fontSize: "11px",
        },
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      title: {
        text: "Count",
      },
    },
    legend: {
      position: "top",
    },
    colors: ["#10B981", "#3C50E0"],
    title: {
      text: "Document Activity from Organizations",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  const documentActivityChartSeries = [
    {
      name: "Documents Uploaded",
      data: documentUploads.map((d) => d.count),
    },
    {
      name: "Document Views",
      data: documentViews.map((d) => d.count),
    },
  ];

  // Organization Type Breakdown Chart
  const typeBreakdownChartOptions: ApexOptions = {
    chart: {
      type: "pie",
      height: 400,
      toolbar: { show: false },
    },
    labels: organizationTypeBreakdown.map((t) => t.type),
    colors: ["#3C50E0", "#10B981", "#F59E0B", "#EF4444", "#6366F1"],
    title: {
      text: "Organizations by Type",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
    legend: {
      position: "bottom",
    },
  };

  const typeBreakdownChartSeries = organizationTypeBreakdown.map((t) => t.count);

  // Member Count Breakdown Chart
  const memberCountChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: memberCountBreakdown.map((m) => m.range),
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Number of Organizations",
      },
    },
    colors: ["#3C50E0"],
    title: {
      text: "Organizations by Member Count",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const memberCountChartSeries = [
    {
      name: "Organizations",
      data: memberCountBreakdown.map((m) => m.count),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
            purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
            orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
          };

          return (
            <div
              key={card.title}
              className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Organizations</p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
            {(summary.activeOrganizations ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Avg Members per Organization
          </p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
            {(summary.averageMembersPerOrganization ?? 0).toFixed(1)}
          </p>
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Avg Documents per Organization
          </p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
            {(summary.averageDocumentsPerOrganization ?? 0).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Organization Growth Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={orgGrowthChartOptions}
          series={orgGrowthChartSeries}
          type="line"
          height={400}
        />
      </div>

      {/* Member Growth Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={memberGrowthChartOptions}
          series={memberGrowthChartSeries}
          type="line"
          height={400}
        />
      </div>

      {/* Document Activity Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart
          options={documentActivityChartOptions}
          series={documentActivityChartSeries}
          type="line"
          height={400}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Organization Type Breakdown */}
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart
            options={typeBreakdownChartOptions}
            series={typeBreakdownChartSeries}
            type="pie"
            height={400}
          />
        </div>

        {/* Member Count Breakdown */}
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Chart
            options={memberCountChartOptions}
            series={memberCountChartSeries}
            type="bar"
            height={400}
          />
        </div>
      </div>

      {/* Top Organizations */}
      {topOrganizations && topOrganizations.length > 0 && (
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Top Organizations by Activity
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="p-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Organization
                  </th>
                  <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Members
                  </th>
                  <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Documents
                  </th>
                  <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody>
                {topOrganizations.map((org) => (
                  <tr
                    key={org.organizationId}
                    className="border-b border-stroke last:border-0 dark:border-dark-3"
                  >
                    <td className="p-3 text-sm font-medium text-dark dark:text-white">
                      {org.organizationName}
                    </td>
                    <td className="p-3 text-right text-sm text-dark dark:text-white">
                      {org.memberCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-sm text-dark dark:text-white">
                      {org.documentCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-sm text-dark dark:text-white">
                      {org.viewCount.toLocaleString()}
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
