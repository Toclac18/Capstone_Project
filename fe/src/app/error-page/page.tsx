"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorContent } from "./components/ErrorContent";

// Component con để dùng useSearchParams
function ErrorPageInner() {
  const searchParams = useSearchParams();

  // Lấy dữ liệu từ URL, nếu không có thì dùng mặc định của next
  const code = searchParams.get("code") ?? "500";
  const title = searchParams.get("title") ?? "Internal Server Error";
  const message =
    searchParams.get("message") ??
    "Our servers encountered an unexpected condition that prevented them from fulfilling the request.";

  return <ErrorContent code={code} title={title} message={message} />;
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorPageInner />
    </Suspense>
  );
}
