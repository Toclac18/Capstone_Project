"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BusinessAdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Dashboard
    router.replace("/business-admin/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
