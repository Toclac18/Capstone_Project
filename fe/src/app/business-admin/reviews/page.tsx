"use client";

import { ReviewManagement } from "./_components/ReviewManagement";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";

export default function ReviewManagementPage() {
  return(
    <div>
      <Breadcrumb pageName="Review Management" />
     <ReviewManagement />;
    </div>
  )
}


