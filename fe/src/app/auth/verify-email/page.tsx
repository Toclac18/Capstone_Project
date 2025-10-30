"use client";

import { Suspense } from "react";
import VerifyEmailContent from "./_components";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-2 dark:bg-dark">
          <div className="w-full max-w-md rounded-[10px] bg-white px-7.5 py-10 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-dark dark:text-white">
                Loading...
              </h2>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
