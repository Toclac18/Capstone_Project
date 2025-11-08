"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Download } from "lucide-react";
import type { DocumentDetail } from "../../api";
import { getDocument, deleteDocument } from "../../api";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import { useToast, toast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface DocumentDetailProps {
  documentId: string;
}

export function DocumentDetail({ documentId }: DocumentDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getDocument(documentId);
      setDocument(data);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to fetch document";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleDelete = async () => {
    if (!document) return;
    
    setLoading(true);
    setError(null);

    try {
      await deleteDocument(document.id);
      showToast(toast.success("Document Deleted", "Document deleted successfully"));
      setTimeout(() => {
        router.push("/business-admin/document");
      }, 1500);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to delete document";
      showToast(toast.error("Delete Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = () => {
    // TODO: Implement view document functionality
    showToast(toast.info("Coming Soon", "View document feature will be available soon"));
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    showToast(toast.info("Coming Soon", "Download feature will be available soon"));
  };

  if (loading && !document) {
    return (
      <div className={styles["container"]}>
        <div className={styles["loading-container"]}>
          <div className={styles["loading-spinner"]}></div>
          <span className={styles["loading-text"]}>Loading document...</span>
        </div>
      </div>
    );
  }

  if (error && !document) {
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

  if (!document) {
    return (
      <div className={styles["container"]}>
        <div className={styles["error-container"]}>
          <p>Document not found</p>
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
          <span>Back to Document List</span>
        </button>
        <div className={styles["header-content"]}>
          <div className={styles["title-wrapper"]}>
            <h1 className={styles["page-title"]}>
              {document.title || "N/A"}
            </h1>
            <p className={styles["page-subtitle"]}>
              Document Details
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Document Info */}
      <div className={styles["content-grid"]}>
        {/* Left Column - Main Info */}
        <div className={styles["left-column"]}>
          {/* Basic Information */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Basic Information
            </h2>
            <div className={styles["field-grid"]}>
              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Title</label>
                <p className={styles["field-value"]}>
                  {document.title || "N/A"}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Description</label>
                <p className={styles["field-value"]}>
                  {document.description || "N/A"}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>File Name</label>
                <p className={styles["field-value"]}>
                  {document.file_name || "N/A"}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>View Count</label>
                <p className={styles["field-value"]}>
                  {document.viewCount ?? 0}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Public</label>
                <div className={styles["status-container"]}>
                  <span
                    className={`${styles["status-badge"]} ${
                      document.isPublic
                        ? styles["status-active"]
                        : styles["status-inactive"]
                    }`}
                  >
                    {document.isPublic ? "Public" : "Private"}
                  </span>
                </div>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Premium</label>
                <div className={styles["status-container"]}>
                  <span
                    className={`${styles["status-badge"]} ${
                      document.isPremium
                        ? styles["status-active"]
                        : styles["status-inactive"]
                    }`}
                  >
                    {document.isPremium ? "Premium" : "Free"}
                  </span>
                </div>
              </div>

              {document.isPremium && document.price && (
                <div className={styles["field-item"]}>
                  <label className={styles["label"]}>Price</label>
                  <p className={styles["field-value"]}>
                    {document.price ?? "N/A"}
                  </p>
                </div>
              )}

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Created Date</label>
                <p className={styles["field-value"]}>
                  {document.createdAt
                    ? new Date(document.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Updated Date</label>
                <p className={styles["field-value"]}>
                  {document.updatedAt
                    ? new Date(document.updatedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Uploader Information */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Uploader Information
            </h2>
            <div className={styles["field-grid"]}>
              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Full Name</label>
                <p className={styles["field-value"]}>
                  {document.uploader?.fullName || "N/A"}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Username</label>
                <p className={styles["field-value"]}>
                  {document.uploader?.username || "N/A"}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Email</label>
                <p className={styles["field-value"]}>
                  {document.uploader?.email || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          {document.organization && (
            <div className={styles["card"]}>
              <h2 className={styles["section-header"]}>
                Organization Information
              </h2>
              <div className={styles["field-grid"]}>
                <div className={styles["field-item"]}>
                  <label className={styles["label"]}>Name</label>
                  <p className={styles["field-value"]}>
                    {document.organization.name || "N/A"}
                  </p>
                </div>

                <div className={styles["field-item"]}>
                  <label className={styles["label"]}>Type</label>
                  <p className={styles["field-value"]}>
                    {document.organization.type || "N/A"}
                  </p>
                </div>

                <div className={styles["field-item"]}>
                  <label className={styles["label"]}>Email</label>
                  <p className={styles["field-value"]}>
                    {document.organization.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Document Type */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Document Type
            </h2>
            <div className={styles["field-grid"]}>
              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Type Name</label>
                <p className={styles["field-value"]}>
                  {document.type?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Specializations */}
          {document.specializations && document.specializations.length > 0 && (
            <div className={styles["card"]}>
              <h2 className={styles["section-header"]}>
                Specializations
              </h2>
              <div className="space-y-2">
                {document.specializations.map((spec) => (
                  <div key={spec.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-semibold">{spec.name || "N/A"}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Code: {spec.code ?? "N/A"}
                    </p>
                    {spec.domain && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Domain: {spec.domain.name || "N/A"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className={styles["card"]}>
              <h2 className={styles["section-header"]}>
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {tag.name || `Tag ${tag.id.substring(0, 8)}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className={styles["right-column"]}>
          {/* Statistics */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Statistics
            </h2>
            <div className={styles["statistics-grid"]}>
              <div className={styles["stat-card"]}>
                <label className={styles["stat-label"]}>Comments</label>
                <p className={styles["stat-value"]}>
                  {document.commentCount ?? 0}
                </p>
              </div>
              <div className={styles["stat-card"]}>
                <label className={styles["stat-label"]}>Saves</label>
                <p className={styles["stat-value"]}>
                  {document.saveCount ?? 0}
                </p>
              </div>
              <div className={styles["stat-card"]}>
                <label className={styles["stat-label"]}>Upvotes</label>
                <p className={styles["stat-value"]}>
                  {document.upvoteCount ?? 0}
                </p>
              </div>
              <div className={styles["stat-card"]}>
                <label className={styles["stat-label"]}>Downvotes</label>
                <p className={styles["stat-value"]}>
                  {document.downvoteCount ?? 0}
                </p>
              </div>
              <div className={styles["stat-card"]}>
                <label className={styles["stat-label"]}>Reports</label>
                <p className={styles["stat-value"]}>
                  {document.reportCount ?? 0}
                </p>
              </div>
              {document.isPremium && document.purchaseCount !== undefined && (
                <div className={styles["stat-card"]}>
                  <label className={styles["stat-label"]}>Purchases</label>
                  <p className={styles["stat-value"]}>
                    {document.purchaseCount ?? 0}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reviewer Information (only for premium documents) */}
          {document.isPremium && document.reviewer && (
            <div className={styles["card"]}>
              <h2 className={styles["section-header"]}>
                Reviewer Information
              </h2>
              <div className={styles["sidebar-section"]}>
                <div className={styles["field-item"]}>
                  <label className={styles["label"]}>Full Name</label>
                  <p className={styles["field-value"]}>
                    {document.reviewer.fullName || "N/A"}
                  </p>
                </div>
                <div className={styles["field-item"]}>
                  <label className={styles["label"]}>Username</label>
                  <p className={styles["field-value"]}>
                    {document.reviewer.username || "N/A"}
                  </p>
                </div>
                <div className={styles["field-item"]}>
                  <label className={styles["label"]}>Email</label>
                  <p className={styles["field-value"]}>
                    {document.reviewer.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles["card"]}>
            <h2 className={styles["section-header"]}>
              Actions
            </h2>
            <div className={styles["sidebar-section"]}>
              <div className="space-y-3">
                <button
                  onClick={handleViewDocument}
                  className={`${styles["action-button"]} ${styles["action-button-primary"]}`}
                  disabled={loading}
                >
                  <Eye className="w-4 h-4" />
                  <span>View Document</span>
                </button>
                <button
                  onClick={handleDownload}
                  className={`${styles["action-button"]} ${styles["action-button-secondary"]}`}
                  disabled={loading}
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <DeleteConfirmation
                  onDelete={handleDelete}
                  itemId={document.id}
                  itemName={document.title || "Document"}
                  title="Delete Document"
                  description={`Are you sure you want to delete "${document.title || "this document"}"?`}
                  size="lg"
                  variant="outline"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

