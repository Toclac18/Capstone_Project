"use client";
import { useEffect, useState } from "react";

// Simple chart components without async operations
function SimplePaymentsOverview({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={`${className} animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center`}>
        <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white dark:bg-gray-dark rounded-lg shadow p-6`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Payments Overview
      </h3>
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Chart placeholder</div>
      </div>
    </div>
  );
}

function SimpleWeeksProfit({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={`${className} animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center`}>
        <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white dark:bg-gray-dark rounded-lg shadow p-6`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Weeks Profit
      </h3>
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Chart placeholder</div>
      </div>
    </div>
  );
}

function SimpleUsedDevices({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={`${className} animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center`}>
        <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white dark:bg-gray-dark rounded-lg shadow p-6`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Used Devices
      </h3>
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Chart placeholder</div>
      </div>
    </div>
  );
}

function SimpleTopChannels({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={`${className} animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center`}>
        <div className="text-gray-500 dark:text-gray-400">Loading table...</div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white dark:bg-gray-dark rounded-lg shadow p-6`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Channels
      </h3>
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Table placeholder</div>
      </div>
    </div>
  );
}

export { SimplePaymentsOverview, SimpleWeeksProfit, SimpleUsedDevices, SimpleTopChannels };

