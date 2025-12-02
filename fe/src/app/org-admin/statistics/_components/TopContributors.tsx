"use client";

import type { TopContributor } from "@/types/statistics";

interface TopContributorsProps {
  contributors: TopContributor[];
}

export function TopContributors({ contributors }: TopContributorsProps) {
  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Top Contributors
      </h3>
      <div className="space-y-4">
        {contributors.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No contributors yet</p>
        ) : (
          contributors.map((contributor, index) => (
            <div
              key={contributor.memberId}
              className="flex items-center justify-between rounded-lg border border-stroke p-4 dark:border-strokedark"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-black dark:text-white">
                    {contributor.memberName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contributor.memberEmail}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-black dark:text-white">
                  {contributor.uploadCount}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">uploads</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

