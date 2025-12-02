"use client";

import type { LoadState } from "@/types/statistics";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Users } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface RoleUserStats {
  role: string;
  total: number;
  active: number;
  deactive: number;
  deleted: number;
  pendingVerification: number;
}

export interface UserStatistics {
  summary: {
    totalUsers: number;
    activeUsers: number;
    deactiveUsers: number;
    deletedUsers: number;
    pendingVerificationUsers: number;
  };
  perRole: RoleUserStats[];
}

interface UserStatisticsTabProps {
  state: LoadState;
  statistics: UserStatistics | null;
  error: string | null;
}

export function UserStatisticsTab({ state, statistics, error }: UserStatisticsTabProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user statistics...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !statistics) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load user statistics"}
        </p>
      </div>
    );
  }

  const { summary, perRole } = statistics;

  const summaryCards = [
    { title: "Total Users", value: summary.totalUsers },
    { title: "Active Users", value: summary.activeUsers },
    { title: "Deactivated Users", value: summary.deactiveUsers },
    { title: "Deleted Users", value: summary.deletedUsers },
    {
      title: "Pending Verification",
      value: summary.pendingVerificationUsers,
    },
  ];

  const roleCategories = perRole.map((r) => r.role);

  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
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
      categories: roleCategories,
      labels: {
        rotate: -30,
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Users",
      },
    },
    legend: {
      position: "top",
    },
    colors: ["#10B981", "#F59E0B", "#EF4444", "#6366F1"],
    title: {
      text: "Users by Role & Status",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const chartSeries = [
    {
      name: "Active",
      data: perRole.map((r) => r.active),
    },
    {
      name: "Deactive",
      data: perRole.map((r) => r.deactive),
    },
    {
      name: "Deleted",
      data: perRole.map((r) => r.deleted),
    },
    {
      name: "Pending Verification",
      data: perRole.map((r) => r.pendingVerification),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
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
              <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users by Role & Status Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <Chart options={chartOptions} series={chartSeries} type="bar" height={400} />
      </div>

      {/* Per-role Table */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Role Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="p-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Role
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Deactive
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Deleted
                </th>
                <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody>
              {perRole.map((role) => (
                <tr
                  key={role.role}
                  className="border-b border-stroke last:border-0 dark:border-dark-3"
                >
                  <td className="p-3 text-sm text-dark dark:text-white">{role.role}</td>
                  <td className="p-3 text-right text-sm font-semibold text-dark dark:text-white">
                    {role.total.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-sm text-emerald-600 dark:text-emerald-400">
                    {role.active.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-sm text-amber-600 dark:text-amber-400">
                    {role.deactive.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-sm text-red-600 dark:text-red-400">
                    {role.deleted.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-sm text-indigo-600 dark:text-indigo-400">
                    {role.pendingVerification.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


