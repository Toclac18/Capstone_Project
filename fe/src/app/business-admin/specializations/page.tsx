"use client";
import { Suspense } from "react";
import { SpecializationManagement } from "./_components/SpecializationManagement";

function SpecializationsLoading() {
  return (
    <div className="container mx-auto w-full gap-6 p-6">
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-stroke-dark dark:bg-dark-2">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading specializations...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpecializationsPage() {
  return (
    <Suspense fallback={<SpecializationsLoading />}>
      <SpecializationManagement />
    </Suspense>
  );
}

