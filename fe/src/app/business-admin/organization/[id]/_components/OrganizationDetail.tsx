"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Organization } from "../../api";
import { getOrganization, updateOrganizationStatus } from "../../api";
import StatusConfirmation from "@/components/ui/status-confirmation";
import styles from "../styles.module.css";

interface OrganizationDetailProps {
  organizationId: string;
}

export function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [organizationId]);

  const fetchOrganization = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await getOrganization(organizationId);
      setOrganization(data);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to fetch organization";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "ACTIVE" | "INACTIVE") => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (organization) {
        const updated = await updateOrganizationStatus(organization.id, newStatus);
        setOrganization(updated);
        setSuccess(`Organization status updated to ${newStatus} successfully`);
      }
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update organization status";
      setError(errorMessage);
    } finally {
      setLoading(false);
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
          {organization.logo && !imageError ? (
            <img
              src={organization.logo}
              alt={organization.name || organization.email}
              className={styles["logo"]}
              onError={(e) => {
                console.error("Failed to load organization logo:", organization.logo, e);
                setImageError(true);
              }}
              onLoad={() => {
                console.log("Organization logo loaded successfully:", organization.logo);
              }}
              loading="lazy"
            />
          ) : (
            <div className={styles["logo-placeholder"]}>
              <span className={styles["logo-placeholder-text"]}>
                {(organization.name || organization.email)
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
                  <span
                    className={`${styles["status-badge"]} ${
                      organization.status === "ACTIVE" || organization.active
                        ? styles["status-active"]
                        : styles["status-inactive"]
                    }`}
                  >
                    {organization.status || (organization.active ? "ACTIVE" : "INACTIVE")}
                  </span>
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

          {/* Actions */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Actions
            </h2>
            <div className={styles["sidebar-section"]}>
              <StatusConfirmation
                onConfirm={handleStatusUpdate}
                currentStatus={(organization.status === "ACTIVE" || organization.active) ? "ACTIVE" : "INACTIVE"}
                itemName={organization.name || organization.email}
                title={
                  (organization.status === "ACTIVE" || organization.active)
                    ? "Confirm Inactive Status"
                    : "Confirm Active Status"
                }
                description={
                  (organization.status === "ACTIVE" || organization.active)
                    ? `Are you sure you want to set "${organization.name || organization.email}" to Inactive?`
                    : `Are you sure you want to set "${organization.name || organization.email}" to Active?`
                }
                size="lg"
                variant="outline"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

