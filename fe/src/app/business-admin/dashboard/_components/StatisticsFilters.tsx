"use client";

import { useState } from "react";
import type { StatisticsQueryParams } from "@/types/statistics";
import { useToast, toast } from "@/components/ui/toast";

interface StatisticsFiltersProps {
  onFilterChange: (filters: StatisticsQueryParams) => void;
}

export function StatisticsFilters({ onFilterChange }: StatisticsFiltersProps) {
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleApply = () => {
    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        showToast(toast.error("Validation Error", "Start Date must be before or equal to End Date"));
        return;
      }
    }
    
    onFilterChange({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    onFilterChange({});
  };

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Filters</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
          />
        </div>
        <div className="flex items-end gap-2 md:col-span-2 lg:col-span-1">
          <button
            onClick={handleApply}
            className="flex-1 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg border border-stroke bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-dark-3 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-800"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

