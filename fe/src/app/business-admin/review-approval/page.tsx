"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { ReviewApprovalManagement } from "./_components/ReviewApprovalManagement";

export default function ReviewApprovalPage() {
  return (
    <main className="px-4 py-8">
      <Breadcrumb pageName="Review Approval" />
      <ReviewApprovalManagement />
    </main>
  );
}
