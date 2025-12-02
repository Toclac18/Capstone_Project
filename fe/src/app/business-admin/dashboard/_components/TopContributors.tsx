"use client";

import type { OrganizationStatistics } from "@/types/statistics";

interface TopContributorsProps {
  statistics: OrganizationStatistics;
}

export function TopContributors({ statistics }: TopContributorsProps) {
  if (!statistics.topContributors || statistics.topContributors.length === 0) {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-center text-gray-600 dark:text-gray-400">
          No contributors data available
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Top Contributors
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stroke dark:border-strokedark">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                Documents
              </th>
            </tr>
          </thead>
          <tbody>
            {statistics.topContributors.map((contributor, index) => (
              <tr
                key={contributor.memberId}
                className="border-b border-stroke dark:border-strokedark"
              >
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  #{index + 1}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {contributor.memberName || "Unknown"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {contributor.memberEmail || "N/A"}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  {contributor.uploadCount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

