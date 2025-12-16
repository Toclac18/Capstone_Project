"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, FileText, X, UserPlus, PowerOff, Power } from "lucide-react";
import type { DocumentDetail } from "../../api";
import { getDocument, deleteDocument, deactivateDocument, activateDocument } from "../../api";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { useToast, toast } from "@/components/ui/toast";
import { AssignReviewerModal } from "../../_components/AssignReviewerModal";
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
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAssignReviewerModal, setShowAssignReviewerModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

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

  const handleAssignReviewerSuccess = () => {
    // Refresh document to get updated status
    fetchDocument();
  };

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleDelete = async () => {
    if (!document) return;
    
    setLoading(true);
    setError(null);

    try {
      await deleteDocument(document.id);
      showToast(toast.success("Document Deleted", "Document status changed to DELETED successfully"));
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
    // Navigate to reader view document page
    router.push(`/docs-view/${documentId}`);
  };

  const handleDeactivate = async () => {
    if (!document) return;
    
    setIsDeactivating(true);
    setError(null);

    try {
      await deactivateDocument(document.id);
      showToast(toast.success("Document Deactivated", "Document status changed to INACTIVE successfully"));
      setShowDeactivateModal(false);
      // Reload document to get updated status
      await fetchDocument();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to deactivate document";
      showToast(toast.error("Deactivate Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivate = async () => {
    if (!document) return;
    
    setIsActivating(true);
    setError(null);

    try {
      await activateDocument(document.id);
      showToast(toast.success("Document Activated", "Document status changed to ACTIVE successfully"));
      setShowActivateModal(false);
      // Reload document to get updated status
      await fetchDocument();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to activate document";
      showToast(toast.error("Activate Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setIsActivating(false);
    }
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
                <label className={styles["label"]}>Status</label>
                <div className={styles["status-container"]}>
                  <span
                    className={`${styles["status-badge"]} ${
                      document.status === "ACTIVE"
                        ? styles["status-active"]
                        : document.status === "REJECTED" || document.status === "DELETED"
                        ? styles["status-inactive"]
                        : styles["status-pending"]
                    }`}
                  >
                    {document.status || "N/A"}
                  </span>
                </div>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>View Count</label>
                <p className={styles["field-value"]}>
                  {document.viewCount ?? 0}
                </p>
              </div>

              <div className={styles["field-item"]}>
                <label className={styles["label"]}>Visibility</label>
                <div className={styles["status-container"]}>
                  <span
                    className={`${styles["status-badge"]} ${
                      document.visibility === "PUBLIC"
                        ? styles["status-active"]
                        : styles["status-inactive"]
                    }`}
                  >
                    {document.visibility === "PUBLIC" ? "Public" : "Private"}
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
                  {document.docType?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Specialization */}
          {document.specialization && (
            <div className={styles["card"]}>
              <h2 className={styles["section-header"]}>
                Specialization
              </h2>
              <div className={styles["field-grid"]}>
                <div className={styles["field-item"]}>
                  <label className={styles["label"]}>Name</label>
                  <p className={styles["field-value"]}>
                    {document.specialization.name || "N/A"}
                  </p>
                </div>
                {document.specialization.domain && (
                  <div className={styles["field-item"]}>
                    <label className={styles["label"]}>Domain</label>
                    <p className={styles["field-value"]}>
                      {document.specialization.domain.name || "N/A"}
                    </p>
                  </div>
                )}
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
                  {document.adminInfo?.commentCount ?? 0}
                </p>
              </div>
              <div className={styles["stat-card"]}>
                <label className={styles["stat-label"]}>Saves</label>
                <p className={styles["stat-value"]}>
                  {document.adminInfo?.saveCount ?? 0}
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
                  {document.adminInfo?.reportCount ?? 0}
                </p>
              </div>
              {document.isPremium && document.adminInfo?.purchaseCount !== undefined && (
                <div className={styles["stat-card"]}>
                  <label className={styles["stat-label"]}>Purchases</label>
                  <p className={styles["stat-value"]}>
                    {document.adminInfo.purchaseCount ?? 0}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Review Requests (only for premium documents) */}
          {document.isPremium && document.adminInfo?.reviewRequests && document.adminInfo.reviewRequests.length > 0 && (
            <div className={styles["card"]}>
              <h2 className={styles["section-header"]}>
                Review Requests
              </h2>
              <div className={styles["sidebar-section"]}>
                <div className="space-y-2">
                  {document.adminInfo.reviewRequests.slice(0, 3).map((req: any) => (
                    <div key={req.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-sm font-semibold">
                        {req.reviewer?.fullName || "Unknown Reviewer"}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Status: {req.status || "N/A"}
                      </p>
                    </div>
                  ))}
                  {document.adminInfo.reviewRequests.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{document.adminInfo.reviewRequests.length - 3} more
                    </p>
                  )}
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
                {document.isPremium && document.status === "PENDING_REVIEW" && (
                  <button
                    onClick={() => setShowAssignReviewerModal(true)}
                    className={`${styles["action-button"]} ${styles["action-button-primary"]}`}
                    disabled={loading}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Assign Reviewer</span>
                  </button>
                )}
                {document.summarizations && (
                  <button
                    onClick={() => setShowSummaryModal(true)}
                    className={`${styles["action-button"]} ${styles["action-button-secondary"]}`}
                    disabled={loading}
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Summary</span>
                  </button>
                )}
                {document.status === "ACTIVE" && (
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className={`${styles["action-button"]} ${styles["action-button-warning"]}`}
                    disabled={loading || isDeactivating}
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>Deactivate</span>
                  </button>
                )}
                {document.status === "DELETED" && (
                  <button
                    onClick={() => setShowActivateModal(true)}
                    className={`${styles["action-button"]} ${styles["action-button-primary"]}`}
                    disabled={loading || isActivating}
                  >
                    <Power className="w-4 h-4" />
                    <span>Activate</span>
                  </button>
                )}
                {document.status !== "DELETED" && document.status !== "ACTIVE" && (
                  <DeleteConfirmation
                    onDelete={handleDelete}
                    itemId={document.id}
                    itemName={document.title || "Document"}
                    title="Delete Document"
                    description={`Are you sure you want to delete "${document.title || "this document"}"? This will change its status to DELETED.`}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Reviewer Modal */}
      {showAssignReviewerModal && document && (
        <AssignReviewerModal
          open={showAssignReviewerModal}
          documentId={document.id}
          documentTitle={document.title || "Document"}
          documentDomain={document.specialization?.domain?.name}
          documentSpecialization={document.specialization?.name}
          onClose={() => setShowAssignReviewerModal(false)}
          onSuccess={handleAssignReviewerSuccess}
        />
      )}

      {/* Summary Modal */}
      {showSummaryModal && document.summarizations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Document Summary
              </h2>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {document.summarizations.shortSummary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Short Summary
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {document.summarizations.shortSummary}
                  </p>
                </div>
              )}
              {document.summarizations.mediumSummary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Medium Summary
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {document.summarizations.mediumSummary}
                  </p>
                </div>
              )}
              {document.summarizations.detailedSummary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Detailed Summary
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {document.summarizations.detailedSummary}
                  </p>
                </div>
              )}
              {!document.summarizations.shortSummary && 
               !document.summarizations.mediumSummary && 
               !document.summarizations.detailedSummary && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No summary available for this document.
                </p>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && document && (
        <ConfirmModal
          open={showDeactivateModal}
          title="Deactivate Document"
          content={`Are you sure you want to deactivate "${document.title || "this document"}"?`}
          subContent="This will change the document status to INACTIVE. Users will not be able to access this document until it is reactivated."
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          loading={isDeactivating}
          onConfirm={handleDeactivate}
          onCancel={() => setShowDeactivateModal(false)}
        />
      )}

      {/* Activate Confirmation Modal */}
      {showActivateModal && document && (
        <ConfirmModal
          open={showActivateModal}
          title="Activate Document"
          content={`Are you sure you want to activate "${document.title || "this document"}"?`}
          subContent="This will change the document status to ACTIVE and make it available to users."
          confirmLabel="Activate"
          cancelLabel="Cancel"
          loading={isActivating}
          onConfirm={handleActivate}
          onCancel={() => setShowActivateModal(false)}
        />
      )}
    </div>
  );
}

