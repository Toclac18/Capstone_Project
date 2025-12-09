"use client";

import { useState, useMemo } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface ReviewChartsProps {
  reviewRequestStatusBreakdown: Record<string, number>;
  reviewDecisionBreakdown: Record<string, number>;
  reviewsByMonth: Record<string, number>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

type Timeframe = "day" | "month" | "year";

// Custom tooltip formatter to show integers
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-white p-3 shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {payload[0].name || payload[0].dataKey}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          {typeof payload[0].value === 'number' ? Math.round(payload[0].value) : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// Helper function to parse and format dates
const parseDate = (dateStr: string): Date | null => {
  // Try different date formats
  // YYYY-MM-DD
  const fullDateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (fullDateMatch) {
    return new Date(parseInt(fullDateMatch[1]), parseInt(fullDateMatch[2]) - 1, parseInt(fullDateMatch[3]));
  }

  // YYYY-MM
  const monthMatch = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    return new Date(parseInt(monthMatch[1]), parseInt(monthMatch[2]) - 1, 1);
  }

  // YYYY
  const yearMatch = dateStr.match(/^(\d{4})$/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1);
  }

  return null;
};

// Format date based on timeframe
const formatDate = (dateStr: string, timeframe: Timeframe): string => {
  const date = parseDate(dateStr);
  if (!date) return dateStr;

  if (timeframe === "day") {
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  } else if (timeframe === "month") {
    return date.toLocaleDateString("en-US", { month: "2-digit", year: "numeric" });
  } else {
    return date.getFullYear().toString();
  }
};

export function ReviewCharts({
  reviewRequestStatusBreakdown,
  reviewDecisionBreakdown,
  reviewsByMonth,
}: ReviewChartsProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");

  // Process and group data by timeframe, handling duplicates
  const processedData = useMemo(() => {
    // Group by timeframe and sum counts (handle duplicates)
    const grouped: Record<string, number> = {};

    Object.entries(reviewsByMonth).forEach(([dateStr, count]) => {
      const date = parseDate(dateStr);
      if (!date) return;

      let key: string;
      if (timeframe === "day") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      } else if (timeframe === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = date.getFullYear().toString();
      }

      grouped[key] = (grouped[key] || 0) + Math.round(count);
    });

    // Convert to array and sort
    return Object.entries(grouped)
      .map(([date, count]) => ({
        date: formatDate(date, timeframe),
        count: count,
        sortKey: date,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [reviewsByMonth, timeframe]);

  // Convert status breakdown to array format
  const statusData = Object.entries(reviewRequestStatusBreakdown)
    .map(([status, count]) => ({
      status,
      count: Math.round(count),
    }))
    .filter(item => item.count > 0);

  // Convert decision breakdown to array format
  const decisionData = Object.entries(reviewDecisionBreakdown)
    .map(([decision, count]) => ({
      decision,
      count: Math.round(count),
    }))
    .filter(item => item.count > 0);

  const chartTitle = 
    timeframe === "day" ? "Reviews Completed by Day" :
    timeframe === "month" ? "Reviews Completed by Month" :
    "Reviews Completed by Year";

  // Calculate Y-axis domain and unique integer ticks
  const yAxisConfig = useMemo(() => {
    if (processedData.length === 0) {
      const ticks = [0, 1, 2, 3, 4, 5];
      return { domain: [0, 5] as [number, number], ticks };
    }

    const maxCount = Math.max(...processedData.map(d => d.count));
    const maxValue = Math.ceil(maxCount);
    
    // Add some padding at the top, but keep it as integer
    const paddedMax = maxValue === 0 ? 1 : maxValue + 1;
    
    // Generate unique integer ticks from 0 to paddedMax
    const ticks: number[] = [];
    const step = paddedMax <= 5 ? 1 : Math.ceil(paddedMax / 6);
    
    for (let i = 0; i <= paddedMax; i += step) {
      ticks.push(i);
    }
    
    // Ensure max value is included
    if (ticks[ticks.length - 1] < paddedMax) {
      ticks.push(paddedMax);
    }
    
    // Remove duplicates and sort
    const uniqueTicks = Array.from(new Set(ticks)).sort((a, b) => a - b);
    
    return {
      domain: [0, paddedMax] as [number, number],
      ticks: uniqueTicks,
    };
  }, [processedData]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Reviews by Timeframe - Line Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark dark:text-white">
            {chartTitle}
          </h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 text-sm text-dark outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="day">By Day</option>
            <option value="month">By Month</option>
            <option value="year">By Year</option>
          </select>
        </div>
        {processedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                angle={timeframe === "day" ? -45 : 0}
                textAnchor={timeframe === "day" ? "end" : "middle"}
                height={timeframe === "day" ? 60 : 30}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => Math.round(value).toString()}
                domain={yAxisConfig.domain}
                ticks={yAxisConfig.ticks}
                allowDecimals={false}
                type="number"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                name="Count"
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      {/* Review Request Status Breakdown - Pie Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Review Request Status
        </h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => {
                  const data = entry.payload || entry;
                  return `${data.status}: ${data.count}`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      {/* Review Decision Breakdown - Pie Chart */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card lg:col-span-2">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Review Decisions
        </h3>
        {decisionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={decisionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => {
                  const data = entry.payload || entry;
                  return `${data.decision}: ${data.count}`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {decisionData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}


