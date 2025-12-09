"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Power, PowerOff } from "lucide-react";
import type { Organization } from "../../api";
import { getOrganization, updateOrganizationStatus } from "../../api";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { useToast, toast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface OrganizationDetailProps {
  organizationId: string;
}

// Helper function to check if logo is a valid URL
const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmedUrl = url.trim();
  if (trimmedUrl === '') {
    return false;
  }
  try {
    const urlObj = new URL(trimmedUrl);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // If URL constructor fails, it's not a valid URL
    return false;
  }
};

export function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    content: string;
    subContent?: string;
    confirmLabel: string;
    newStatus: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrganization = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Reset imageError before fetching
    setImageError(false);

    try {
      // Backend API expects userId (admin ID), not organizationId
      // The organizationId passed here should be the userId from the list
      const data = await getOrganization(organizationId);
      setOrganization(data);
      // Reset imageError again after setting organization to ensure fresh state
      setImageError(false);
      // Debug: Log logo URL
      console.log("Organization logo:", data.logo, "Valid:", isValidImageUrl(data.logo));
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to fetch organization";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  // Reset imageError when organization changes
  useEffect(() => {
    if (organization) {
      setImageError(false);
    }
  }, [organization]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!organization) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      // Backend API needs userId (admin ID), not organizationId
      const userId = organization.userId || organization.id;
      const updated = await updateOrganizationStatus(userId, newStatus as any);
      setOrganization(updated);
      showToast(toast.success("Status Updated", `Organization status updated to ${newStatus} successfully`));
      setConfirmModal(null);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update organization status";
      showToast(toast.error("Update Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusAction = (action: "approve" | "reject" | "activate" | "deactivate") => {
    if (!organization) return;

    const orgName = organization.name || organization.email;

    switch (action) {
      case "approve":
        setConfirmModal({
          open: true,
          title: "Approve Organization Registration",
          content: `Are you sure you want to approve "${orgName}"?`,
          subContent: "This will activate the organization account and allow them to access the system.",
          confirmLabel: "Approve",
          newStatus: "ACTIVE",
        });
        break;
      case "reject":
        setConfirmModal({
          open: true,
          title: "Reject Organization Registration",
          content: `Are you sure you want to reject "${orgName}"?`,
          subContent: "This will reject the organization registration. They will not be able to access the system.",
          confirmLabel: "Reject",
          newStatus: "REJECTED",
        });
        break;
      case "activate":
        setConfirmModal({
          open: true,
          title: "Activate Organization Account",
          content: `Are you sure you want to activate "${orgName}"?`,
          subContent: "This will reactivate the organization account and allow them to access the system.",
          confirmLabel: "Activate",
          newStatus: "ACTIVE",
        });
        break;
      case "deactivate":
        setConfirmModal({
          open: true,
          title: "Deactivate Organization Account",
          content: `Are you sure you want to deactivate "${orgName}"?`,
          subContent: "This will temporarily disable the organization account. They will not be able to access the system.",
          confirmLabel: "Deactivate",
          newStatus: "INACTIVE",
        });
        break;
    }
  };

  const getAvailableActions = (currentStatus: string) => {
    switch (currentStatus) {
      case "PENDING_APPROVE":
        return [
          {
            label: "Approve",
            action: "approve" as const,
            icon: CheckCircle,
            variant: "success",
          },
          {
            label: "Reject",
            action: "reject" as const,
            icon: XCircle,
            variant: "danger",
          },
        ];
      case "ACTIVE":
        return [
          {
            label: "Deactivate",
            action: "deactivate" as const,
            icon: PowerOff,
            variant: "warning",
          },
        ];
      case "INACTIVE":
        return [
          {
            label: "Activate",
            action: "activate" as const,
            icon: Power,
            variant: "success",
          },
        ];
      case "REJECTED":
        return [
          {
            label: "Approve",
            action: "approve" as const,
            icon: CheckCircle,
            variant: "success",
          },
        ];
      case "DELETED":
        return [
          {
            label: "Activate",
            action: "activate" as const,
            icon: Power,
            variant: "success",
          },
        ];
      default:
        return [];
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return styles["status-active"];
      case "PENDING_EMAIL_VERIFY":
      case "PENDING_APPROVE":
        return styles["status-pending"];
      case "INACTIVE":
      case "REJECTED":
        return styles["status-inactive"];
      case "DELETED":
        return styles["status-deleted"];
      default:
        return styles["status-inactive"];
    }
  };


  if (loading && !organization) {
    return (
      <div className={styles["container"]}>
        <div className={styles["loading-container"]}>
          <div className={styles["loading-spinner"]}></div>
          <span className={styles["loading-text"]}>Loading organization...</span>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className={styles["container"]}>
        <div className={styles["error-container"]}>
          <p className={styles["error-message"]}>{error}</p>
          <button
            onClick={() => router.back()}
            className={styles["error-button"]}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className={styles["container"]}>
        <div className={styles["error-container"]}>
          <p>Organization not found</p>
          <button
            onClick={() => router.back()}
            className={styles["error-button"]}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["container"]}>
      {/* Header */}
      <div className={styles["header"]}>
        <button
          onClick={() => router.back()}
          className={styles["back-button"]}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Organization List</span>
        </button>
        <div className={styles["header-content"]}>
          {(() => {
            const isValid = isValidImageUrl(organization.logo);
            console.log("Image render check:", {
              logo: organization.logo,
              isValid,
              imageError,
              willRender: isValid && !imageError,
            });
            return isValid && !imageError;
          })() ? (
            <img
              src={organization.logo!.trim()}
              alt={organization.name || organization.email}
              className={styles["logo"]}
              crossOrigin="anonymous"
              onError={(e) => {
                // If crossOrigin fails, try without it
                const img = e.currentTarget as HTMLImageElement;
                if (img.crossOrigin === 'anonymous') {
                  // Try without crossOrigin
                  img.crossOrigin = '';
                  img.src = organization.logo!.trim();
                } else {
                  // Both attempts failed, show placeholder
                  console.error("Failed to load organization logo:", organization.logo);
                  setImageError(true);
                }
              }}
              onLoad={() => {
                console.log("Organization logo loaded successfully:", organization.logo);
              }}
              loading="lazy"
            />
          ) : (
            <div className={styles["logo-placeholder"]}>
              <span className={styles["logo-placeholder-text"]}>
                {((organization.name || organization.email || "OR") as string)
                  .substring(0, 2)
                  .toUpperCase()}
              </span>
            </div>
          )}
          <div className={styles["title-wrapper"]}>
            <h1 className={styles["page-title"]}>
              {organization.name || organization.email}
            </h1>
            <p className={styles["page-subtitle"]}>
              Organization Details
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className={styles["alert"] + " " + styles["alert-success"]}>
          {success}
        </div>
      )}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Organization Info */}
      <div className={styles["content-grid"]}>
        {/* Left Column - Basic Info */}
        <div className={styles["left-column"]}>
          {/* Basic Information */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Basic Information
            </h2>
            <div className={styles["field-grid"]}>
              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Organization Name</label>
                <p className={styles["field-value"]}>
                  {organization.name || organization.email}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Email</label>
                <p className={styles["field-value"]}>
                  {organization.email}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Hotline</label>
                <p className={styles["field-value"]}>
                  {organization.hotline}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Address</label>
                <p className={styles["field-value"]}>
                  {organization.address || "N/A"}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Status</label>
                <div className={styles["status-container"]}>
                  <div className="space-y-3">
                    <div>
                      <span
                        className={`${styles["status-badge"]} ${getStatusBadgeClass(organization.status)}`}
                      >
                        {organization.status || (organization.active ? "ACTIVE" : "INACTIVE")}
                      </span>
                    </div>
                    {organization.status && getAvailableActions(organization.status).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {getAvailableActions(organization.status).map((actionItem, index) => {
                          const Icon = actionItem.icon;
                          const variantClasses: Record<string, string> = {
                            success: "bg-green-600 hover:bg-green-700 text-white border-green-600",
                            danger: "bg-red-600 hover:bg-red-700 text-white border-red-600",
                            warning: "bg-orange-600 hover:bg-orange-700 text-white border-orange-600",
                          };
                          return (
                            <button
                              key={index}
                              onClick={() => handleStatusAction(actionItem.action)}
                              disabled={isUpdating || loading}
                              className={`
                                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                                border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                ${variantClasses[actionItem.variant] || ""}
                              `}
                            >
                              <Icon className="w-4 h-4" />
                              {actionItem.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {organization.status && (organization.status === "PENDING_EMAIL_VERIFY" || organization.status === "DELETED") && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {organization.status === "PENDING_EMAIL_VERIFY" 
                          ? "Waiting for organization admin to verify their email address."
                          : "This organization has been deleted and cannot be modified."}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Created Date</label>
                <p className={styles["field-value"]}>
                  {organization.createdAt
                    ? new Date(organization.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Statistics
            </h2>
            <div className={styles["statistics-grid"]}>
              <div className={styles["stat-card"]}>
                <label className={styles["stat-label"]}>Total Members</label>
                <p className={styles["stat-value"]}>
                  {(organization as any).totalMembers || 0}
                </p>
              </div>
              <div className={styles["stat-card"]}>
                <label className={styles["stat-label"]}>Total Documents</label>
                <p className={styles["stat-value"]}>
                  {(organization as any).totalDocuments || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className={styles["right-column"]}>
          {/* Organization Admin */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Organization Admin
            </h2>
            <div className={styles["sidebar-section"]}>
              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Admin Name</label>
                <p className={styles["field-value"]}>
                  {organization.adminName || "N/A"}
                </p>
              </div>
              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Admin Email</label>
                <p className={styles["field-value"]}>
                  {organization.adminEmail}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.title}
          content={confirmModal.content}
          subContent={confirmModal.subContent}
          confirmLabel={confirmModal.confirmLabel}
          cancelLabel="Cancel"
          loading={isUpdating}
          onConfirm={() => handleStatusUpdate(confirmModal.newStatus)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

