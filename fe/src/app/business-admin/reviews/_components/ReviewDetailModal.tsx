"use client";

import { useState, useEffect } from "react";
import { X, Download, CheckCircle, XCircle, Calendar, User } from "lucide-react";
import { getDocumentReviewByReviewRequestId, type DocumentReviewResponse } from "@/services/review-request.service";
import { useToast } from "@/components/ui/toast";
// import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/utils/format-date";

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewRequestId: string;
}

export function ReviewDetailModal({
  isOpen,
  onClose,
  reviewRequestId,
}: ReviewDetailModalProps) {
  const { showToast } = useToast();
  const [review, setReview] = useState<DocumentReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && reviewRequestId) {
      fetchReview();
    } else {
      setReview(null);
      setError(null);
    }
  }, [isOpen, reviewRequestId]);

  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocumentReviewByReviewRequestId(reviewRequestId);
      setReview(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load review details";
      setError(errorMessage);
      showToast({
        type: "error",
        title: "Error",
        message: errorMessage,
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (review?.reportFileUrl) {
      window.open(review.reportFileUrl, "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Review Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading review details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : review ? (
            <div className="space-y-6">
              {/* Document Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Document Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Title:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{review.document?.title || "N/A"}</p>
                  </div>
                  {review.document?.docType && (
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                      <p className="text-gray-900 dark:text-white mt-1">{review.document.docType.name}</p>
                    </div>
                  )}
                  {review.document?.domain && (
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Domain:</span>
                      <p className="text-gray-900 dark:text-white mt-1">{review.document.domain.name}</p>
                    </div>
                  )}
                  {review.document?.specialization && (
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Specialization:</span>
                      <p className="text-gray-900 dark:text-white mt-1">{review.document.specialization.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Review Decision
                </h3>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                      review.decision === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {review.decision === "APPROVED" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <span>{review.decision}</span>
                  </span>
                </div>
              </div>

              {/* Reviewer Info */}
              {review.reviewer && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Reviewer Information
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                      <p className="text-gray-900 dark:text-white">{review.reviewer.username || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
                      <p className="text-gray-900 dark:text-white mt-1">{review.reviewer.email || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Comment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Review Comment
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {review.report || "No comment provided"}
                  </p>
                </div>
              </div>

              {/* Report File */}
              {review.reportFileUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Review Report File
                  </h3>
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Report</span>
                  </button>
                </div>
              )}

              {/* Submission Date */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Submission Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted At:</span>
                    <p className="text-gray-900 dark:text-white">
                      {review.submittedAt ? formatDate(review.submittedAt) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

