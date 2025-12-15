"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import { getSystemAdminDashboard } from "@/services/statistics.service";
import type { StatisticsQueryParams } from "@/types/statistics";
import { useToast } from "@/components/ui/toast";
import type { SystemAdminDashboard as SystemAdminDashboardType } from "./_components/types";
import type { LoadState } from "@/types/statistics";
import { AccessStatisticsTab } from "./_components/AccessStatisticsTab";

export default function AdminDashboardPage() {
  const { showToast } = useToast();
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

  return (
    <>
      <Breadcrumb pageName="Access Statistics" />

      {/* Access Statistics Content */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <div className="col-span-12">
          <AccessStatisticsTab 
            state={state} 
            statistics={statistics} 
            error={error}
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>
      </div>
    </>
  );
}
