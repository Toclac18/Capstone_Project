"use client";

import { useState } from "react";
import type { StatisticsQueryParams } from "@/types/reviewer-statistics";
import { Calendar } from "lucide-react";

interface StatisticsFiltersProps {
  onFilterChange: (filters: StatisticsQueryParams) => void;
}

export function StatisticsFilters({ onFilterChange }: StatisticsFiltersProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleApply = () => {
    onFilterChange({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    onFilterChange({});
  };

  // Set default to last 6 months
  const setDefaultRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    onFilterChange({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  };

  return (
    <div className="col-span-full rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-dark dark:text-white">Date Range Filter</h3>
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
          />
        </div>
        
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="rounded-lg bg-primary px-6 py-2 text-white transition hover:bg-primary/90"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-stroke bg-white px-6 py-2 text-dark transition hover:bg-gray-50 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:bg-gray-800"
          >
            Reset
          </button>
          <button
            onClick={setDefaultRange}
            className="rounded-lg border border-stroke bg-white px-6 py-2 text-dark transition hover:bg-gray-50 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:bg-gray-800"
          >
            Last 6 Months
          </button>
        </div>
      </div>
    </div>
  );
}


