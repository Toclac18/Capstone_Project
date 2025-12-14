"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import { getReviewerStatistics } from "@/services/statistics.service";
import type { ReviewerStatistics, StatisticsQueryParams } from "@/types/reviewer-statistics";
import { StatisticsFilters } from "./_components/StatisticsFilters";
import { SummaryCards } from "./_components/SummaryCards";
import { ReviewCharts } from "./_components/ReviewCharts";
import { useToast } from "@/components/ui/toast";

type LoadState = "loading" | "success" | "error";

export default function ReviewerStatisticsPage() {
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [statistics, setStatistics] = useState<ReviewerStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StatisticsQueryParams>({});

  useEffect(() => {
    let isMounted = true;

    const loadStatistics = async (params?: StatisticsQueryParams) => {
      try {
        if (!isMounted) return;
        setState("loading");
        setError(null);
        const data = await getReviewerStatistics(params);
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
      <Breadcrumb pageName="My Statistics" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsFilters onFilterChange={handleFilterChange} />
      </div>

      {state === "loading" && (
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading statistics...</div>
        </div>
      )}

      {state === "error" && (
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="text-red-500">{error || "Failed to load statistics"}</div>
        </div>
      )}

      {state === "success" && statistics && (
        <div className="mt-6 space-y-6">
          <SummaryCards summary={statistics.summary} averageReviewTime={statistics.averageReviewTimeDays} />
          
          <ReviewCharts
            reviewRequestStatusBreakdown={statistics.reviewRequestStatusBreakdown}
            reviewDecisionBreakdown={statistics.reviewDecisionBreakdown}
            reviewsByMonth={statistics.reviewsByMonth}
          />
        </div>
      )}
    </>
  );
}


