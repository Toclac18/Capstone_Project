"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import { getSystemAdminDashboard } from "@/services/statistics.service";
import type { StatisticsQueryParams } from "@/types/statistics";
import { StatisticsFilters } from "@/app/business-admin/dashboard/_components/StatisticsFilters";
import { useToast } from "@/components/ui/toast";
import type { SystemAdminDashboard as SystemAdminDashboardType } from "./_components/types";
import type { LoadState } from "@/types/statistics";
import { OverviewTab } from "./_components/OverviewTab";
import { AccessStatisticsTab } from "./_components/AccessStatisticsTab";
import { UserActivityTab } from "./_components/UserActivityTab";
import { SystemActivityTab } from "./_components/SystemActivityTab";

type TabType = "overview" | "access" | "user-activity" | "system-activity";

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [filters, setFilters] = useState<StatisticsQueryParams>({});

  const [state, setState] = useState<LoadState>("loading");
  const [statistics, setStatistics] = useState<SystemAdminDashboardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard statistics
  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        if (!isMounted) return;
        setState("loading");
        setError(null);
        const data = await getSystemAdminDashboard(filters);
        if (!isMounted) return;
        setStatistics(data);
        setState("success");
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Failed to load dashboard statistics");
        setState("error");
        console.error("Failed to load System Admin dashboard:", err);
        showToast({
          type: "error",
          title: "Error",
          message: err.message || "Failed to load dashboard statistics",
        });
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [filters, showToast]);

  const tabs = [
    { id: "overview" as TabType, label: "Overview" },
    { id: "access" as TabType, label: "Access Statistics" },
    { id: "user-activity" as TabType, label: "User Activity" },
    { id: "system-activity" as TabType, label: "Content Activity" },
  ];

  return (
    <>
      <Breadcrumb pageName="System Admin Dashboard" />

      {/* Tabs */}
      <div className="mb-6 rounded-[10px] bg-white p-2 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex gap-1 border-b border-transparent">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-sm dark:bg-primary"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters (show for tabs that need filters) */}
      {(activeTab === "access" || activeTab === "user-activity" || activeTab === "system-activity") && (
        <div className="mb-6">
          <StatisticsFilters onFilterChange={setFilters} />
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <div className="col-span-12">
          {activeTab === "overview" && (
            <OverviewTab state={state} statistics={statistics} error={error} />
          )}

          {activeTab === "access" && (
            <AccessStatisticsTab state={state} statistics={statistics} error={error} />
          )}

          {activeTab === "user-activity" && (
            <UserActivityTab state={state} statistics={statistics} error={error} />
          )}

          {activeTab === "system-activity" && (
            <SystemActivityTab state={state} statistics={statistics} error={error} />
          )}
        </div>
      </div>
    </>
  );
}
