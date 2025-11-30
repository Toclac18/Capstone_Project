"use client";

import { useState, useEffect } from "react";
import type { OrganizationStatistics, LoadState, StatisticsQueryParams } from "@/types/statistics";
import type { Organization } from "@/app/business-admin/organization/api";
import { useToast } from "@/components/ui/toast";
import { SearchableOrganizationSelect } from "./SearchableOrganizationSelect";
import { OrganizationCharts } from "./OrganizationCharts";
import { OrganizationBreakdowns } from "./OrganizationBreakdowns";
import { TopContributors } from "./TopContributors";

interface OrganizationStatisticsTabProps {
  state: LoadState;
  statistics: OrganizationStatistics | null;
  error: string | null;
  selectedOrgId: string | null;
  onOrgSelect: (orgId: string | null) => void;
  filters: StatisticsQueryParams;
}

export function OrganizationStatisticsTab({
  state,
  statistics,
  error,
  selectedOrgId,
  onOrgSelect,
}: OrganizationStatisticsTabProps) {
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Load organizations list
  useEffect(() => {
    let isMounted = true;

    const loadOrganizations = async () => {
      try {
        if (!isMounted) return;
        setLoadingOrgs(true);
        const response = await fetch(
          `/api/business-admin/organizations?page=1&limit=100`
        );
        if (!response.ok) {
          throw new Error("Failed to load organizations");
        }
        const data = await response.json();
        if (!isMounted) return;
        setOrganizations(data.organizations || []);
      } catch (err: any) {
        if (!isMounted) return;
        showToast({
          type: "error",
          title: "Error",
          message: err.message || "Failed to load organizations",
        });
      } finally {
        if (isMounted) {
          setLoadingOrgs(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      isMounted = false;
    };
  }, [showToast]);


  if (loadingOrgs) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Organization Selector */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark relative" style={{ overflow: 'visible' }}>
        <SearchableOrganizationSelect
          organizations={organizations}
          selectedOrgId={selectedOrgId}
          onSelect={onOrgSelect}
          loading={loadingOrgs}
        />
      </div>

      {/* Statistics Display */}
      {!selectedOrgId && (
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Please select an organization to view statistics
          </p>
        </div>
      )}

      {selectedOrgId && state === "loading" && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
          </div>
        </div>
      )}

      {selectedOrgId && state === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">
            {error || "Failed to load statistics"}
          </p>
        </div>
      )}

      {selectedOrgId && state === "success" && statistics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Members
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.summary.totalMembers.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Documents
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.summary.totalDocuments.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.summary.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Members
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.summary.activeMembers.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Charts */}
          <OrganizationCharts statistics={statistics} />

          {/* Breakdowns */}
          <OrganizationBreakdowns statistics={statistics} />

          {/* Top Contributors */}
          <TopContributors statistics={statistics} />
        </div>
      )}
    </div>
  );
}

