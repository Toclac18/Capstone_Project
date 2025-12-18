"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getReviewRequests,
  approveReviewRequest,
  type ReviewRequest,
} from "../api";
import { Pagination } from "@/components/ui/pagination";
import { AcceptModal } from "./AcceptModal";
import { RejectModal } from "./RejectModal";
import { DocumentInfoModal } from "./DocumentInfoModal";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/utils/format-date";
import { truncateText } from "@/utils/truncate-text";
import { Spinner } from "@/components/ui/spinner";
import styles from "../styles.module.css";

const ITEMS_PER_PAGE = 12;
const DESCRIPTION_MAX_LENGTH = 80;
const MAX_TAGS_DISPLAY = 3;
const TEMPLATE_DOWNLOAD_URL = "/review-report-template.docx";

export function ReviewRequestsTab() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDocInfoModalOpen, setIsDocInfoModalOpen] = useState(false);
  const [selectedDocForInfo, setSelectedDocForInfo] = useState<ReviewRequest | null>(null);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [loadingButtonAction, setLoadingButtonAction] = useState<"accept" | "reject" | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReviewRequests({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      setRequests(response.requests);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review requests");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcceptClick = useCallback(async (request: ReviewRequest) => {
    setLoadingButtonId(request.id);
    setLoadingButtonAction("accept");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSelectedRequest(request);
      setIsAcceptModalOpen(true);
    } finally {
      setLoadingButtonId(null);
      setLoadingButtonAction(null);
    }
  }, []);

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    try {
      // Call API to approve (accept) review request
      await approveReviewRequest(requestId, "APPROVE");
      
      // Refresh data
      await fetchData();

      // Auto download review report template
      try {
        const link = document.createElement("a");
        link.href = TEMPLATE_DOWNLOAD_URL;
        link.download = "review-report-template.docx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        // best-effort only, don't block main flow
        console.error("Failed to trigger template download:", e);
      }
      
      showToast({
        type: 'success',
        title: 'Request Accepted',
        message: 'Review request has been accepted successfully. The document status has been changed to "Reviewing".',
        duration: 3000,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Accept Failed',
        message: err instanceof Error ? err.message : 'Failed to accept review request. Please try again.',
        duration: 3000,
      });
      throw err;
    }
  }, [fetchData, showToast]);

  const handleRejectClick = useCallback(async (request: ReviewRequest) => {
    setLoadingButtonId(request.id);
    setLoadingButtonAction("reject");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSelectedRequest(request);
      setIsRejectModalOpen(true);
    } finally {
      setLoadingButtonId(null);
      setLoadingButtonAction(null);
    }
  }, []);

  const handleRejectRequest = useCallback(async (requestId: string, rejectionReason?: string) => {
    try {
      // Call API to reject review request
      await approveReviewRequest(requestId, "REJECT", rejectionReason);
      
      // Refresh data
      await fetchData();
      
      showToast({
        type: 'success',
        title: 'Request Rejected',
        message: 'Review request has been rejected successfully. The document has been removed from your review requests list.',
        duration: 3000,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Reject Failed',
        message: err instanceof Error ? err.message : 'Failed to reject review request. Please try again.',
        duration: 3000,
      });
      throw err;
    }
  }, [fetchData, showToast]);

  const handleTitleClick = useCallback((request: ReviewRequest) => {
    setSelectedDocForInfo(request);
    setIsDocInfoModalOpen(true);
  }, []);

  if (loading) {
    return (
      <div className={styles["loading-container"]}>
        <p>Loading review requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["error-container"]}>
        <p>{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={styles["empty-container"]}>
        <p>No pending review requests at this time.</p>
      </div>
    );
  }

  return (
    <div className={styles["tab-content"]}>
      <div className={styles["table-wrapper"]}>
        <div className={styles["table-container"]}>
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]} style={{ width: "18%" }}>Title</th>
                <th className={styles["table-header-cell"]} style={{ width: "9%" }}>Type</th>
                <th className={styles["table-header-cell"]} style={{ width: "9%" }}>Domain</th>
                <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Specialization</th>
                <th className={styles["table-header-cell"]} style={{ width: "11%" }}>Tags</th>
                <th className={styles["table-header-cell"]} style={{ width: "9%" }}>Uploader</th>
                <th className={styles["table-header-cell"]} style={{ width: "9%" }}>Date Upload</th>
                <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Due Date</th>
                <th className={styles["table-header-cell"]} style={{ width: "15%" }}>Action</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {requests.map((req) => {
                const isExpired = req.responseDeadline
                  ? new Date(req.responseDeadline) < new Date()
                  : false;
                return (
                  <tr
                    key={req.id}
                    className={`${styles["table-row"]} ${
                      isExpired ? styles["table-row-expired"] : ""
                    }`}
                  >
                  <td className={styles["table-cell"]}>
                    <div 
                      className={styles["table-cell-main"]}
                      style={{ cursor: 'pointer', color: '#3b82f6' }}
                      onClick={() => handleTitleClick(req)}
                    >
                        {req.documentTitle}
                    </div>
                    {req.description && (
                      <div className={styles["table-cell-secondary"]}>
                        {truncateText(req.description, DESCRIPTION_MAX_LENGTH)}
                      </div>
                    )}
                  </td>
                  <td className={styles["table-cell"]}>
                    <span className={styles["table-cell-value"]}>{req.documentType}</span>
                  </td>
                  <td className={styles["table-cell"]}>
                    <span className={styles["table-cell-value"]}>{req.domain}</span>
                  </td>
                  <td className={styles["table-cell"]}>
                    {req.specialization ? (
                      <span className={styles["table-cell-value"]}>{req.specialization}</span>
                    ) : (
                      <span className={styles["text-muted"]}>—</span>
                    )}
                  </td>
                  <td className={styles["table-cell"]}>
                    {req.tags && req.tags.length > 0 ? (
                      <div className={styles["tags-list"]}>
                        {req.tags.slice(0, MAX_TAGS_DISPLAY).map((tag, idx) => (
                          <span key={`${tag}-${idx}`} className={styles["tag"]}>
                            {tag}
                          </span>
                        ))}
                        {req.tags.length > MAX_TAGS_DISPLAY && (
                          <span className={styles["tag-more"]}>+{req.tags.length - MAX_TAGS_DISPLAY}</span>
                        )}
                      </div>
                    ) : (
                      <span className={styles["text-muted"]}>—</span>
                    )}
                  </td>
                  <td className={styles["table-cell"]}>
                    <span className={styles["table-cell-value"]}>{req.uploaderName}</span>
                  </td>
                  <td className={styles["table-cell"]}>
                    <span className={styles["table-cell-value"]}>
                      {formatDate(req.uploadedDate)}
                    </span>
                  </td>
                  <td className={styles["table-cell"]}>
                    {req.responseDeadline ? (
                      <span
                        className={`${styles["table-cell-value"]} ${
                          isExpired ? styles["due-date-expired"] : styles["due-date-active"]
                        }`}
                      >
                        {formatDate(req.responseDeadline)}
                      </span>
                    ) : (
                      <span className={styles["text-muted"]}>—</span>
                    )}
                  </td>
                  <td className={styles["table-cell"]}>
                    {isExpired ? (
                      <div className={styles["expired-status"]}>
                        <span className={styles["expired-text"]}>Expired</span>
                      </div>
                    ) : (
                      <div className={styles["action-cell"]}>
                        <button
                          type="button"
                          onClick={() => handleAcceptClick(req)}
                          disabled={loadingButtonId === req.id}
                          className={styles["action-button-accept"]}
                        >
                          {loadingButtonId === req.id && loadingButtonAction === "accept" ? (
                            <>
                              <Spinner size="md" className="mr-2" />
                            </>
                          ) : (
                            "Accept"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectClick(req)}
                          disabled={loadingButtonId === req.id}
                          className={styles["action-button-reject"]}
                        >
                          {loadingButtonId === req.id && loadingButtonAction === "reject" ? (
                            <>
                              <Spinner size="md" className="mr-2" />
                            </>
                          ) : (
                            "Reject"
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles["pagination-container"]}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </div>
      )}

      {/* Accept Modal */}
      <AcceptModal
        isOpen={isAcceptModalOpen}
        onClose={() => {
          setIsAcceptModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onAccept={handleAcceptRequest}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onReject={handleRejectRequest}
      />

      {/* Document Info Modal */}
      <DocumentInfoModal
        isOpen={isDocInfoModalOpen}
        onClose={() => {
          setIsDocInfoModalOpen(false);
          setSelectedDocForInfo(null);
        }}
        request={selectedDocForInfo}
      />
    </div>
  );
}
