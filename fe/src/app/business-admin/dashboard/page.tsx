"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import {
  getBusinessAdminDashboard,
  getGlobalDocumentStatistics,
  getReportHandlingStatistics,
  getUserStatistics,
} from "@/services/statistics.service";
import type {
  BusinessAdminDashboard,
  GlobalDocumentStatistics,
  ReportHandlingStatistics,
  StatisticsQueryParams,
} from "@/types/statistics";
import { StatisticsFilters } from "./_components/StatisticsFilters";
import { useToast } from "@/components/ui/toast";
import { DashboardOverview } from "./_components/DashboardOverview";
import { DocumentStatisticsTab } from "./_components/DocumentStatisticsTab";
import { ReportStatisticsTab } from "./_components/ReportStatisticsTab";
import { OrganizationStatisticsTab } from "./_components/OrganizationStatisticsTab";
import { UserStatisticsTab } from "./_components/UserStatisticsTab";
import type { UserStatistics } from "./_components/UserStatisticsTab";

type LoadState = "loading" | "success" | "error";
type TabType = "overview" | "documents" | "reports" | "organizations" | "users";

export default function BusinessAdminDashboardPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [filters, setFilters] = useState<StatisticsQueryParams>({});

  // Dashboard overview state
  const [dashboardState, setDashboardState] = useState<LoadState>("loading");
  const [dashboard, setDashboard] = useState<BusinessAdminDashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Document statistics state
  const [docState, setDocState] = useState<LoadState>("loading");
  const [docStats, setDocStats] = useState<GlobalDocumentStatistics | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  // Report statistics state
  const [reportState, setReportState] = useState<LoadState>("loading");
  const [reportStats, setReportStats] = useState<ReportHandlingStatistics | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // User statistics state
  const [userState, setUserState] = useState<LoadState>("loading");
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // Load dashboard overview
  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        if (!isMounted) return;
        setDashboardState("loading");
        setDashboardError(null);
        const data = await getBusinessAdminDashboard();
        if (!isMounted) return;
        setDashboard(data);
        setDashboardState("success");
      } catch (err: any) {
        if (!isMounted) return;
        setDashboardError(err.message || "Failed to load dashboard");
        setDashboardState("error");
        showToast({
          type: "error",
          title: "Error",
          message: err.message || "Failed to load dashboard",
        });
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // Load document statistics when tab is active (documents or organizations views)
  useEffect(() => {
    if (activeTab !== "documents" && activeTab !== "organizations") return;

    let isMounted = true;

    const loadDocumentStats = async () => {
      try {
        if (!isMounted) return;
        setDocState("loading");
        setDocError(null);
        const data = await getGlobalDocumentStatistics(filters);
        if (!isMounted) return;
        setDocStats(data);
        setDocState("success");
      } catch (err: any) {
        if (!isMounted) return;
        setDocError(err.message || "Failed to load statistics");
        setDocState("error");
        showToast({
          type: "error",
          title: "Error",
          message: err.message || "Failed to load statistics",
        });
      }
    };

    loadDocumentStats();

    return () => {
      isMounted = false;
    };
  }, [activeTab, filters, showToast]);

  // Load user statistics when tab is active
  useEffect(() => {
    if (activeTab !== "users") return;

    let isMounted = true;

    const loadUserStats = async () => {
      try {
        if (!isMounted) return;
        setUserState("loading");
        setUserError(null);

        const stats = await getUserStatistics();

        if (!isMounted) return;
        setUserStats(stats);
        setUserState("success");
      } catch (err: any) {
        if (!isMounted) return;
        setUserError(err.message || "Failed to load user statistics");
        setUserState("error");
        showToast({
          type: "error",
          title: "Error",
          message: err.message || "Failed to load user statistics",
        });
      }
    };

    loadUserStats();

    return () => {
      isMounted = false;
    };
  }, [activeTab, showToast]);

  // Load report statistics when tab is active
  useEffect(() => {
    if (activeTab !== "reports") return;

    let isMounted = true;

    const loadReportStats = async () => {
      try {
        if (!isMounted) return;
        setReportState("loading");
        setReportError(null);
        const data = await getReportHandlingStatistics(filters);
        if (!isMounted) return;
        setReportStats(data);
        setReportState("success");
      } catch (err: any) {
        if (!isMounted) return;
        setReportError(err.message || "Failed to load statistics");
        setReportState("error");
        showToast({
          type: "error",
          title: "Error",
          message: err.message || "Failed to load statistics",
        });
      }
    };

    loadReportStats();

    return () => {
      isMounted = false;
    };
  }, [activeTab, filters, showToast]);

  const handleFilterChange = (newFilters: StatisticsQueryParams) => {
    setFilters(newFilters);
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview" },
    { id: "documents" as TabType, label: "Documents" },
    { id: "reports" as TabType, label: "Reports" },
    { id: "organizations" as TabType, label: "Organizations" },
    { id: "users" as TabType, label: "Users" },
  ];

  return (
    <>
      <Breadcrumb pageName="Dashboard" />

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

      {/* Filters (only show for tabs that need filters) */}
      {(activeTab === "documents" || activeTab === "reports" || activeTab === "organizations") && (
        <div className="mb-6">
          <StatisticsFilters onFilterChange={handleFilterChange} />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "overview" && (
        <DashboardOverview
          state={dashboardState}
          dashboard={dashboard}
          error={dashboardError}
        />
      )}

      {activeTab === "documents" && (
        <DocumentStatisticsTab
          state={docState}
          statistics={docStats}
          error={docError}
        />
      )}

      {activeTab === "reports" && (
        <ReportStatisticsTab
          state={reportState}
          statistics={reportStats}
          error={reportError}
        />
      )}

      {activeTab === "organizations" && (
        <OrganizationStatisticsTab
          state={docState}
          statistics={docStats}
          error={docError}
        />
      )}

      {activeTab === "users" && (
        <UserStatisticsTab state={userState} statistics={userStats} error={userError} />
      )}
    </>
  );
}

