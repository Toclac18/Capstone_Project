"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Search, User, Check } from "lucide-react";
import { apiClient } from "@/services/http";
import { assignReviewer } from "@/services/review-request.service";
import { useToast, toast } from "@/components/ui/toast";

interface AssignReviewerModalProps {
  open: boolean;
  documentId: string;
  documentTitle: string;
  documentDomain?: string;
  documentSpecialization?: string;
  existingReviewRequestId?: string; // For changing reviewer (cancel old and assign new)
  onClose: () => void;
  onSuccess: () => void;
}

interface ReviewerItem {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  status: string;
  organizationName?: string | null;
  educationLevel?: string | null;
  point?: number;
  domain?: {
    id: string;
    name: string;
  } | null;
  specialization?: {
    id: string;
    name: string;
    domain?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export function AssignReviewerModal({
  open,
  documentId,
  documentTitle,
  documentDomain,
  documentSpecialization,
  existingReviewRequestId,
  onClose,
  onSuccess,
}: AssignReviewerModalProps) {
  const { showToast } = useToast();
  const [reviewers, setReviewers] = useState<ReviewerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20); // Show 20 reviewers per page

  // Fetch reviewers
  useEffect(() => {
    if (open) {
      console.log("[AssignReviewerModal] Modal opened:", {
        documentId,
        existingReviewRequestId,
      });
      setCurrentPage(1);
      setSearchTerm("");
      fetchReviewers(1, "");
    }
  }, [open, documentId, existingReviewRequestId]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchReviewers(1, searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchTerm, open]);

  // Fetch reviewers when page changes (with current search term)
  useEffect(() => {
    if (open) {
      // Use a ref or state to track if this is from search or page change
      // For now, fetch with current search term
      const timeoutId = setTimeout(() => {
        fetchReviewers(currentPage, searchTerm);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [currentPage]);

  const fetchReviewers = async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(itemsPerPage),
        status: "ACTIVE",
      });
      
      // Add search term if provided
      if (search) {
        params.append("search", search);
      }
      
      // Add domain/specialization filters if provided
      if (documentDomain) {
        params.append("domainId", documentDomain);
      }
      if (documentSpecialization) {
        params.append("specializationId", documentSpecialization);
      }
      
      const res = await apiClient.get<{
        users: ReviewerItem[];
        total: number;
        page: number;
        limit: number;
      }>(`/business-admin/reviewers?${params.toString()}`);
      
      if (res.data?.users) {
        setReviewers(res.data.users);
        setTotalItems(res.data.total || 0);
        setTotalPages(Math.ceil((res.data.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error("Failed to fetch reviewers:", error);
      showToast(toast.error("Error", "Failed to load reviewers"));
    } finally {
      setLoading(false);
    }
  };


  // No need for client-side filtering since we're doing server-side search
  const filteredReviewers = reviewers;

  const selectedReviewer = useMemo(() => {
    if (!selectedReviewerId) return null;
    return reviewers.find((r) => r.id === selectedReviewerId);
  }, [reviewers, selectedReviewerId]);

  const handleSelectReviewer = (reviewerId: string) => {
    setSelectedReviewerId(reviewerId);
  };

  const handleAssign = async () => {
    if (!selectedReviewerId) return;

    setSubmitting(true);
    try {
      const requestBody = {
        reviewerId: selectedReviewerId,
        note: note.trim() || null,
        existingReviewRequestId: existingReviewRequestId || null,
      };
      console.log("[AssignReviewerModal] Assigning reviewer:", {
        documentId,
        existingReviewRequestId,
        requestBody,
      });
      await assignReviewer(documentId, requestBody);

      showToast(toast.success("Success", existingReviewRequestId ? "Reviewer changed successfully" : "Reviewer assigned successfully"));
      onSuccess();
      handleClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to assign reviewer";
      showToast(toast.error("Error", errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReviewerId(null);
    setNote("");
    setSearchTerm("");
    setShowConfirm(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {existingReviewRequestId ? "Change Reviewer" : "Assign Reviewer"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {documentTitle}
            </p>
            {existingReviewRequestId && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                This will cancel the existing pending review request and assign a new reviewer
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviewers by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading || submitting}
              />
              {totalItems > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Showing {reviewers.length} of {totalItems} reviewers
                </p>
              )}
            </div>
          </div>

          {/* Reviewers List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredReviewers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No reviewers found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredReviewers.map((reviewer) => (
                <div
                  key={reviewer.id}
                  onClick={() => handleSelectReviewer(reviewer.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedReviewerId === reviewer.id
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {selectedReviewerId === reviewer.id ? (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {reviewer.fullName}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {reviewer.email}
                      </p>
                      {reviewer.organizationName && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {reviewer.organizationName}
                        </p>
                      )}
                      {reviewer.educationLevel && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Education: {reviewer.educationLevel}
                        </p>
                      )}
                      {reviewer.domain && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Domain: {reviewer.domain.name}
                        </p>
                      )}
                      {reviewer.specialization && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Specialization: {reviewer.specialization.name}
                          {reviewer.specialization.domain && (
                            <span className="text-gray-400"> ({reviewer.specialization.domain.name})</span>
                          )}
                        </p>
                      )}
                      {reviewer.point !== undefined && reviewer.point !== null && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Points: {reviewer.point}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            reviewer.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {reviewer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {!loading && filteredReviewers.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages} ({totalItems} total reviewers)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {/* Note Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the reviewer..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={submitting}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{note.length}/1000</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedReviewerId) {
                  setShowConfirm(true);
                }
              }}
              disabled={!selectedReviewerId || submitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Assigning..." : "Assign Reviewer"}
            </button>
          </div>
        </div>

        {/* Confirm Dialog */}
        {showConfirm && selectedReviewer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Confirm Assignment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to assign{" "}
                <span className="font-semibold">{selectedReviewer.fullName}</span> to
                review this document?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

