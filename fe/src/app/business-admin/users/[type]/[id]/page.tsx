"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReader, getReviewer, updateReaderStatus, updateReviewerStatus } from "../../api";
import type { User } from "../../api";
import { useToast, toast } from "@/components/ui/toast";
import StatusConfirmation from "@/components/ui/status-confirmation";
import { ArrowLeft, Mail, Calendar, Building2 } from "lucide-react";
import styles from "../../styles.module.css";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const type = params?.type as string;
  const id = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !type) return;

    const loadUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const userData = type === "readers" 
          ? await getReader(id)
          : await getReviewer(id);
        setUser(userData);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load user details";
        setError(errorMessage);
        showToast(toast.error("Error", errorMessage));
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, type, showToast]);

  const handleUpdateStatus = async (newStatus: "ACTIVE" | "INACTIVE") => {
    if (!user) return;
    
    try {
      if (type === "readers") {
        await updateReaderStatus(user.id, newStatus);
      } else {
        await updateReviewerStatus(user.id, newStatus);
      }
      showToast(toast.success("Status Updated", `${type === "readers" ? "Reader" : "Reviewer"} status updated to ${newStatus} successfully`));
      // Reload user data
      const userData = type === "readers" 
        ? await getReader(id)
        : await getReviewer(id);
      setUser(userData);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update status";
      showToast(toast.error("Update Failed", errorMessage));
    }
  };

  if (loading) {
    return (
      <div className={styles["container"]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles["container"]}>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">
            {error || "User not found"}
          </p>
        </div>
      </div>
    );
  }

  const userData = user as any;

  return (
    <div className={styles["container"]}>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {type === "readers" ? "Readers" : "Reviewers"}
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className={styles["page-title"]}>
          {type === "readers" ? "Reader" : "Reviewer"} Details
        </h1>
      </div>

      {/* User Info Card */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-medium text-gray-700 dark:text-gray-300">
              {(userData.fullName || user.name || user.email)?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {userData.fullName || user.name || "N/A"}
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {userData.dateOfBirth && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(userData.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
              {type === "reviewers" && userData.organizationName && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span>{userData.organizationName}</span>
                </div>
              )}
              {type === "reviewers" && userData.organizationEmail && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span>Org Email: {userData.organizationEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div>
            <span
              className={`${styles["status-badge"]} ${
                user.status === "ACTIVE"
                  ? styles["status-active"]
                  : user.status === "PENDING_EMAIL_VERIFY" || user.status === "PENDING_APPROVE"
                  ? styles["status-pending"]
                  : styles["status-inactive"]
              }`}
            >
              {user.status || "UNKNOWN"}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                User ID
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">{user.id}</p>
            </div>
            {userData.point !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Points
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{userData.point}</p>
              </div>
            )}
            {type === "reviewers" && userData.ordid && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ORCID
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{userData.ordid}</p>
              </div>
            )}
            {type === "reviewers" && userData.educationLevel && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Education Level
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {userData.educationLevel}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Status
              </label>
              <div className="flex items-center gap-3">
                <span
                  className={`${styles["status-badge"]} ${
                    user.status === "ACTIVE"
                      ? styles["status-active"]
                      : user.status === "PENDING_EMAIL_VERIFY" || user.status === "PENDING_APPROVE"
                      ? styles["status-pending"]
                      : styles["status-inactive"]
                  }`}
                >
                  {user.status || "UNKNOWN"}
                </span>
                {user.status && (user.status === "ACTIVE" || user.status === "INACTIVE") && (
                  <StatusConfirmation
                    onConfirm={handleUpdateStatus}
                    currentStatus={user.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                    itemName={(userData.fullName || user.name || user.email)}
                    title={
                      user.status === "ACTIVE"
                        ? "Confirm Inactive Status"
                        : "Confirm Active Status"
                    }
                    description={
                      user.status === "ACTIVE"
                        ? `Are you sure you want to set "${userData.fullName || user.name || user.email}" to Inactive?`
                        : `Are you sure you want to set "${userData.fullName || user.name || user.email}" to Active?`
                    }
                    size="sm"
                    variant="outline"
                  />
                )}
              </div>
            </div>
            {user.createdAt && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created At
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {new Date(user.createdAt).toLocaleString()}
                </p>
              </div>
            )}
            {user.updatedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Updated At
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {new Date(user.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credentials (for reviewers) */}
      {type === "reviewers" && userData.credentialFileUrls && userData.credentialFileUrls.length > 0 && (
        <div className="mt-6 rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Credential Files
          </h3>
          <div className="space-y-2">
            {userData.credentialFileUrls.map((url: string, index: number) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                Credential {index + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

