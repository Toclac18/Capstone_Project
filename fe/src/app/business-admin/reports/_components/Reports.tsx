"use client";
import { useState, useEffect } from "react";
import { reportsApi } from "../api";

export function Reports() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    // Load reports data
    const loadReports = async () => {
      setLoading(true);
      try {
        const data = await reportsApi.getReports();
        setReports(data);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reports & Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View detailed reports and analytics for your business
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white dark:bg-gray-dark rounded-lg shadow p-8 text-center">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Reports Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're working on comprehensive reporting features. Stay tuned!
        </p>
        <button 
          onClick={async () => {
            try {
              await reportsApi.generateReport();
              alert('Report generation initiated!');
            } catch (error) {
              console.error('Error generating report:', error);
            }
          }}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition"
        >
          {loading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>
    </>
  );
}

