"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  fetchOrganizationInfo,
  updateOrganizationInfo,
  type OrganizationInfo,
} from "../api";
import EditOrganizationForm from "../_components/EditOrganizationForm";
import { UploadLogoForm } from "../_components/UploadLogoForm";

type LoadState = "loading" | "success" | "error";

export default function EditOrganizationPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setState("loading");
      setError(null);
      try {
        const data = await fetchOrganizationInfo();
        setOrgInfo(data);
        setState("success");
      } catch (e: any) {
        setError(
          e?.message ||
            "Unable to load organization information. Please try again later.",
        );
        setState("error");
      }
    };
    run();
  }, []);

  const handleSave = async (data: any) => {
    try {
      const updated = await updateOrganizationInfo(data);
      setOrgInfo(updated);
      showToast({
        type: "success",
        title: "Organization Updated",
        message: "Organization information has been updated successfully.",
        duration: 3000,
      });
      router.push("/org-admin/manage-organization");
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Update Failed",
        message:
          e?.message || "Failed to update organization. Please try again.",
        duration: 5000,
      });
      throw e;
    }
  };

  const handleLogoUpdated = async () => {
    try {
      const data = await fetchOrganizationInfo();
      setOrgInfo(data);
    } catch (e: any) {
      console.error("Failed to reload organization info:", e);
    }
  };

  const handleCancel = () => {
    router.push("/org-admin/manage-organization");
  };

  if (state === "loading") {
    return (
      <div className="mx-auto w-full max-w-[1080px]">
        <h1 className="mb-6 text-3xl font-semibold text-dark dark:text-white">
          Edit Organization
        </h1>
        <div className="mt-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (state === "error" || !orgInfo) {
    return (
      <div className="mx-auto w-full max-w-[1080px]">
        <h1 className="mb-6 text-3xl font-semibold text-dark dark:text-white">
          Edit Organization
        </h1>
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error || "Failed to load organization information"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <h1 className="mb-6 text-3xl font-semibold text-dark dark:text-white">
        Edit Organization
      </h1>
      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-5 xl:col-span-3">
          <EditOrganizationForm
            organization={orgInfo}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
        <div className="col-span-5 xl:col-span-2">
          <UploadLogoForm
            organization={orgInfo}
            onLogoUpdated={handleLogoUpdated}
          />
        </div>
      </div>
    </div>
  );
}

