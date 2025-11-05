"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { logout } from "@/services/authService";
import {
  fetchOrganizationInfo,
  updateOrganizationInfo,
  deleteOrganization,
  type OrganizationInfo,
  type UpdateOrganizationData,
} from "./api";
import EditOrganizationModal from "./_components/EditOrganizationModal";
import DeleteOrganizationModal from "./_components/DeleteOrganizationModal";
import styles from "./styles.module.css";

type LoadState = "loading" | "success" | "error";

export default function ManageOrganizationPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleUpdate = async (data: UpdateOrganizationData) => {
    try {
      const updated = await updateOrganizationInfo(data);
      setOrgInfo(updated);
      showToast({
        type: "success",
        title: "Organization Updated",
        message: "Organization information has been updated successfully.",
        duration: 3000,
      });
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: e?.message || "Failed to update organization. Please try again.",
        duration: 5000,
      });
      throw e;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization();
      showToast({
        type: "success",
        title: "Organization Deleted",
        message: "Organization has been deleted successfully. You will be logged out.",
        duration: 3000,
      });
      
      // Auto logout after 2 seconds
      setTimeout(async () => {
        try {
          await logout();
        } catch (e: any) {
          showToast({
            type: "error",
            title: "Logout Failed",
            message: e?.message || "Failed to logout. Please try again.",
            duration: 5000,
          });
        }
        router.push("/auth/sign-in");
      }, 2000);
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: e?.message || "Failed to delete organization. Please try again.",
        duration: 5000,
      });
      throw e;
    }
  };

  return (
    <div className={styles["page-container"]}>
      <Breadcrumb pageName="Manage Organization" />

      {state === "loading" && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-skeleton"]} />
          <div className={styles["loading-skeleton-large"]} />
        </div>
      )}

      {state === "error" && (
        <div className={styles["error-container"]}>{error}</div>
      )}

      {state === "success" && orgInfo && (
        <div className={styles["card"]}>
          {/* Header with Logo */}
          <div className={styles["header-section"]}>
            <div className={styles["logo-container"]}>
              {orgInfo.logo ? (
                <Image
                  src={orgInfo.logo}
                  width={120}
                  height={120}
                  className={styles["logo"]}
                  alt="organization logo"
                />
              ) : (
                <div className={styles["logo-fallback"]}>
                  <span className={styles["logo-fallback-text"]}>
                    {orgInfo.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className={styles["header-info"]}>
              <h2 className={styles["org-name"]}>{orgInfo.name}</h2>
              <p className={styles["org-type"]}>
                {orgInfo.type.replace(/-/g, " ")}
              </p>
            </div>
            <div className={styles["header-actions"]}>
              <button
                onClick={() => setShowEditModal(true)}
                className={styles["btn-update"]}
              >
                <Edit2 className="w-4 h-4" />
                Update
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className={styles["btn-delete"]}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Organization Details */}
          <div className={styles["details-section"]}>
            <h3 className={styles["section-title"]}>Organization Information</h3>
            <div className={styles["details-grid"]}>
              <div className={styles["detail-field"]}>
                <div className={styles["detail-label"]}>Organization Name</div>
                <div className={styles["detail-value"]}>{orgInfo.name}</div>
              </div>

              <div className={styles["detail-field"]}>
                <div className={styles["detail-label"]}>Organization Type</div>
                <div className={styles["detail-value"]}>
                  {orgInfo.type.replace(/-/g, " ")}
                </div>
              </div>

              <div className={styles["detail-field"]}>
                <div className={styles["detail-label"]}>Registration Number</div>
                <div className={styles["detail-value"]}>
                  {orgInfo.registrationNumber}
                </div>
              </div>

              <div className={styles["detail-field"]}>
                <div className={styles["detail-label"]}>Organization Email</div>
                <div className={styles["detail-value"]}>{orgInfo.email}</div>
              </div>

              {orgInfo.certificateUpload && (
                <div className={styles["detail-field-full"]}>
                  <div className={styles["detail-label"]}>
                    Organization Certificate Upload
                  </div>
                  <a
                    href={orgInfo.certificateUpload}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles["detail-link"]}
                  >
                    View Certificate
                  </a>
                </div>
              )}

              <div className={styles["detail-field"]}>
                <div className={styles["detail-label"]}>Created Date</div>
                <div className={styles["detail-value"]}>
                  {new Date(orgInfo.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {orgInfo && (
        <>
          <EditOrganizationModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            organization={orgInfo}
            onSave={handleUpdate}
          />
          <DeleteOrganizationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDelete}
            organizationName={orgInfo.name}
          />
        </>
      )}
    </div>
  );
}

