"use client";
import { useParams } from "next/navigation";
import { OrganizationDetail } from "./_components/OrganizationDetail";

export default function OrganizationDetailPage() {
  const params = useParams();
  const organizationId = params?.id as string;

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Organization ID is required</p>
      </div>
    );
  }

  return <OrganizationDetail organizationId={organizationId} />;
}



