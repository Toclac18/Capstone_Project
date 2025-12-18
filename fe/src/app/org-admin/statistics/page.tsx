"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import { getOrganizationStatistics } from "@/services/statistics.service";
import type {
  OrganizationStatistics,
  StatisticsQueryParams,
} from "@/types/statistics";
import { StatisticsFilters } from "@/app/reader/statistics/_components/StatisticsFilters";
import { useToast } from "@/components/ui/toast";
import { OrganizationSummaryCards } from "./_components/OrganizationSummaryCards";
import { OrganizationCharts } from "./_components/OrganizationCharts";
import { OrganizationBreakdowns } from "./_components/OrganizationBreakdowns";
import { TopContributors } from "./_components/TopContributors";

type LoadState = "loading" | "success" | "error";

export default function OrganizationStatisticsPage() {
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [statistics, setStatistics] = useState<OrganizationStatistics | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StatisticsQueryParams>({});

  useEffect(() => {
    let isMounted = true;

    const loadStatistics = async (params?: StatisticsQueryParams) => {
      try {
        if (!isMounted) return;
        setState("loading");
        setError(null);
        const data = await getOrganizationStatistics(params);
        if (!isMounted) return;
        setStatistics(data);
        setState("success");
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Failed to load statistics");
        setState("error");
        showToast({
          type: "error",
          title: "Error",
          message: err.message || "Failed to load statistics",
        });
      }
    };

    loadStatistics(filters);

    return () => {
      isMounted = false;
    };
  }, [filters, showToast]);

  const handleFilterChange = (newFilters: StatisticsQueryParams) => {
    setFilters(newFilters);
  };

  return (
    <>
      <Breadcrumb pageName="Dashboard" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsFilters onFilterChange={handleFilterChange} />
      </div>

      {state === "loading" && (
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            Loading statistics...
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="text-red-500">
            {error || "Failed to load statistics"}
          </div>
        </div>
      )}

      {state === "success" && statistics && (
        <div className="mt-6 space-y-6">
          {statistics.organization && (
            <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-dark dark:bg-gray-dark">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                {statistics.organization.name || "Organization"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statistics.organization.type || "N/A"} •{" "}
                {statistics.organization.email || "N/A"}
              </p>
            </div>
          )}

          <OrganizationSummaryCards summary={statistics.summary} />

          <OrganizationCharts statistics={statistics} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <OrganizationBreakdowns
              memberStatusBreakdown={statistics.memberStatusBreakdown}
              documentStatusBreakdown={statistics.documentStatusBreakdown}
              documentVisibilityBreakdown={
                statistics.documentVisibilityBreakdown
              }
              premiumBreakdown={statistics.premiumBreakdown}
            />
            <TopContributors contributors={statistics.topContributors} />
          </div>
        </div>
      )}
    </>
  );
}
