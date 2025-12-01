"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import {
  getBusinessAdminDashboard,
  getGlobalDocumentStatistics,
  getReportHandlingStatistics,
  getOrganizationStatistics,
} from "@/services/statistics.service";
import type {
  BusinessAdminDashboard,
  GlobalDocumentStatistics,
  ReportHandlingStatistics,
  OrganizationStatistics,
  StatisticsQueryParams,
} from "@/types/statistics";
import { StatisticsFilters } from "./_components/StatisticsFilters";
import { useToast } from "@/components/ui/toast";
import { DashboardOverview } from "./_components/DashboardOverview";
import { DocumentStatisticsTab } from "./_components/DocumentStatisticsTab";
import { ReportStatisticsTab } from "./_components/ReportStatisticsTab";
import { OrganizationStatisticsTab } from "./_components/OrganizationStatisticsTab";

type LoadState = "loading" | "success" | "error";
type TabType = "overview" | "documents" | "reports" | "organizations";

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

  // Organization statistics state (will be loaded when needed)
  const [orgState, setOrgState] = useState<LoadState>("loading");
  const [orgStats, setOrgStats] = useState<OrganizationStatistics | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Load organization statistics when organization is selected
  useEffect(() => {
    let isMounted = true;

    const loadOrgStats = async () => {
      // Reset state if conditions not met
      if (activeTab !== "organizations" || !selectedOrgId) {
        if (!isMounted) return;
        setOrgStats(null);
        setOrgState("loading");
        return;
      }

      try {
        if (!isMounted) return;
        setOrgState("loading");
        setOrgError(null);
        // The selectedOrgId might be userId, we need to get organizationId
        // For now, pass it as is and let the API route handle the conversion
        const data = await getOrganizationStatistics({ ...filters, organizationId: selectedOrgId });
        if (!isMounted) return;
        setOrgStats(data);
        setOrgState("success");
      } catch (err: any) {
        if (!isMounted) return;
        setOrgError(err.message || "Failed to load statistics");
        setOrgState("error");
        showToast({
          type: "error",
          title: "Error",
          message: err.message || "Failed to load statistics",
        });
      }
    };

    loadOrgStats();

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedOrgId, filters, showToast]);

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

  // Load document statistics when tab is active
  useEffect(() => {
    if (activeTab !== "documents") return;

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
  ];

  return (
    <>
      <Breadcrumb pageName="Dashboard" />

      {/* Tabs */}
      <div className="mb-6 rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex space-x-1 border-b border-stroke dark:border-strokedark">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
          state={orgState}
          statistics={orgStats}
          error={orgError}
          selectedOrgId={selectedOrgId}
          onOrgSelect={setSelectedOrgId}
          filters={filters}
        />
      )}
    </>
  );
}

