"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, UserPlus, UserCog, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { getDocuments } from "../../document/api";
import type { DocumentListItem, DocumentQueryParams, DocumentListResponse } from "../../document/api";
import { getAllReviewRequests } from "@/services/review-request.service";
import type { ReviewRequestResponse } from "@/types/review-request";
import { AssignReviewerModal } from "../../document/_components/AssignReviewerModal";
import { ReviewDetailModal } from "./ReviewDetailModal";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import styles from "../../document/styles.module.css";

type TabType = "needs-assignment" | "pending" | "in-review" | "completed" | "all";

export function ReviewManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("needs-assignment");
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDocument, setSelectedDocument] = useState<DocumentListItem | null>(null);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState<ReviewRequestResponse | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false);
  const [selectedReviewRequestId, setSelectedReviewRequestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "createdAt" | "deadline">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  // Build filters based on active tab
  const getFiltersForTab = useCallback((tab: TabType): DocumentQueryParams => {
    const baseFilters: DocumentQueryParams = {
      page: currentPage,
      limit: itemsPerPage,
      isPremium: true,
      deleted: false, // Exclude DELETED by default
      sortBy: sortBy === "deadline" ? "createdAt" : sortBy, // Backend doesn't support deadline sort
      sortOrder: sortOrder,
    };

    switch (tab) {
      case "needs-assignment":
        // Documents that are AI_VERIFIED (chưa có reviewer accept)
        return {
          ...baseFilters,
          status: "AI_VERIFIED",
        };
      case "pending":
        // Documents with review request status = PENDING
        // Don't filter by document status - will filter by review request status in component
        return {
          ...baseFilters,
          // No status filter - fetch all premium documents and filter by review request status
        };
      case "in-review":
        // Documents with status REVIEWING (đã có reviewer accept, đang review)
        return {
          ...baseFilters,
          status: "REVIEWING",
        };
      case "completed":
        // Documents that have been reviewed (có review request status = COMPLETED)
        // Will filter by review request status in the component
        return {
          ...baseFilters,
          // No status filter - will filter by review request status
        };
      case "all":
        return {
          ...baseFilters,
          // No status filter - show all premium documents
        };
      default:
        return baseFilters;
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  // Fetch review requests
  const fetchReviewRequests = useCallback(async () => {
    try {
      // Fetch all review requests (use large page size to get all)
      const response = await getAllReviewRequests(0, 10000); // Get all for mapping
      const allRequests = response.content || [];
      const completedRequests = allRequests.filter(req => req.status === "COMPLETED");
      console.log("Fetched review requests:", {
        total: allRequests.length,
        completed: completedRequests.length,
        completedSample: completedRequests.slice(0, 3).map(req => ({
          id: req.id,
          documentId: req.document?.id,
          status: req.status,
        })),
      });
      setReviewRequests(allRequests);
    } catch (e) {
      console.error("Failed to fetch review requests:", e);
      setReviewRequests([]);
    }
  }, []);

  // Fetch documents
  const fetchDocuments = useCallback(async (tab: TabType) => {
    setLoading(true);
    setError(null);

    try {
      const filters = getFiltersForTab(tab);
      if (searchTerm) {
        filters.search = searchTerm;
      }
      const response: DocumentListResponse = await getDocuments(filters);
      
      setDocuments(response.documents);
      setTotalItems(response.total);
      setCurrentPage(response.page);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to fetch documents";
      setError(errorMessage);
      setDocuments([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [getFiltersForTab, searchTerm]);

  useEffect(() => {
    fetchReviewRequests();
  }, [fetchReviewRequests]);

  useEffect(() => {
    fetchDocuments(activeTab);
  }, [activeTab, currentPage, fetchDocuments]);

  // Get review request for a document (prioritize active ones)
  const getReviewRequestForDocument = useCallback((documentId: string): ReviewRequestResponse | null => {
    if (!reviewRequests || reviewRequests.length === 0) {
      return null;
    }
    
    // Normalize documentId to string for comparison
    const docIdStr = String(documentId);
    
    // Get all review requests for this document
    const allDocRequests = reviewRequests.filter(req => {
      const reqDocId = String(req.document?.id || "");
      return reqDocId === docIdStr;
    });
    
    if (allDocRequests.length === 0) {
      return null;
    }
    
    // Prioritize active requests (PENDING or ACCEPTED)
    const activeRequests = allDocRequests.filter(req => 
      req.status === "PENDING" || req.status === "ACCEPTED"
    );
    
    if (activeRequests.length > 0) {
      // Sort by created date, newest first
      return activeRequests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    }
    
    // If no active, get the most recent one (any status)
    return allDocRequests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [reviewRequests]);

  // Get unique reviewers from review requests
  const availableReviewers = useMemo(() => {
    const reviewerMap = new Map<string, { id: string; name: string; email: string }>();
    reviewRequests.forEach(req => {
      if (req.reviewer && !reviewerMap.has(req.reviewer.userId)) {
        reviewerMap.set(req.reviewer.userId, {
          id: req.reviewer.userId,
          name: req.reviewer.fullName,
          email: req.reviewer.email,
        });
      }
    });
    return Array.from(reviewerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [reviewRequests]);

  // Get unique domains from documents
  const availableDomains = useMemo(() => {
    const domainMap = new Map<string, string>();
    documents.forEach(doc => {
      // Extract domain from specializationName (format: "Domain - Specialization")
      if (doc.specializationName) {
        const parts = doc.specializationName.split(" - ");
        if (parts.length > 1) {
          const domain = parts[0];
          if (!domainMap.has(domain)) {
            domainMap.set(domain, domain);
          }
        }
      }
    });
    return Array.from(domainMap.values()).sort();
  }, [documents]);

  // Filter and sort documents by priority
  const sortedDocuments = useMemo(() => {
    let filtered = [...documents];
    
    // Filter by reviewer
    if (selectedReviewerId) {
      filtered = filtered.filter((doc) => {
        const req = getReviewRequestForDocument(doc.id);
        return req && req.reviewer?.userId === selectedReviewerId;
      });
    }
    
    // Filter by domain
    if (selectedDomainId) {
      filtered = filtered.filter((doc) => {
        if (doc.specializationName) {
          return doc.specializationName.startsWith(selectedDomainId);
        }
        return false;
      });
    }
    
    // Filter by tab based on review request status
    if (activeTab === "needs-assignment") {
      // Documents with status AI_VERIFIED and no active review request
      filtered = filtered.filter((doc) => {
        if (doc.status !== "AI_VERIFIED") return false;
        const req = getReviewRequestForDocument(doc.id);
        // No review request or only REJECTED/EXPIRED/COMPLETED
        return !req || (req.status !== "PENDING" && req.status !== "ACCEPTED");
      });
    } else if (activeTab === "pending") {
      // Documents with review request status = PENDING
      // Get all documents that have at least one PENDING review request
      filtered = filtered.filter((doc) => {
        // Check all review requests for this document
        const docIdStr = String(doc.id);
        const pendingRequests = reviewRequests.filter(req => {
          const reqDocId = String(req.document?.id || "");
          const isMatch = reqDocId === docIdStr && req.status === "PENDING";
          if (isMatch) {
            console.log("Found PENDING request for document:", {
              docId: doc.id,
              docTitle: doc.title,
              reqId: req.id,
              reqStatus: req.status,
              reviewer: req.reviewer?.fullName,
            });
          }
          return isMatch;
        });
        return pendingRequests.length > 0;
      });
    } else if (activeTab === "in-review") {
      // Documents with status REVIEWING (đã có reviewer accept)
      // Review request status phải là ACCEPTED
      filtered = filtered.filter((doc) => {
        if (doc.status !== "REVIEWING") return false;
        const req = getReviewRequestForDocument(doc.id);
        return req && req.status === "ACCEPTED";
      });
    } else if (activeTab === "completed") {
      // Documents có review request status = COMPLETED
      // Must find COMPLETED review request specifically (not use getReviewRequestForDocument which prioritizes active)
      filtered = filtered.filter((doc) => {
        if (!reviewRequests || reviewRequests.length === 0) {
          return false;
        }
        const docIdStr = String(doc.id);
        const completedRequest = reviewRequests.find(req => {
          const reqDocId = String(req.document?.id || "");
          return reqDocId === docIdStr && req.status === "COMPLETED";
        });
        if (completedRequest) {
          console.log(`[Completed Tab] Document ${doc.id} has COMPLETED review request:`, {
            documentId: doc.id,
            reviewRequestId: completedRequest.id,
            status: completedRequest.status,
          });
        }
        return !!completedRequest;
      });
    }
    // "all" tab shows all documents
    
    // Priority sorting:
    // 1. Needs assignment (AI_VERIFIED + premium + no review request)
    // 2. PENDING review requests (by response deadline)
    // 3. ACCEPTED review requests (by review deadline)
    // 4. COMPLETED
    // 5. EXPIRED/REJECTED
    
    return filtered.sort((a, b) => {
      const reqA = getReviewRequestForDocument(a.id);
      const reqB = getReviewRequestForDocument(b.id);
      
      // For "needs-assignment" tab: prioritize documents without review request or with REJECTED/EXPIRED
      if (activeTab === "needs-assignment") {
        if (!reqA && reqB) return -1;
        if (reqA && !reqB) return 1;
        if (reqA && reqB) {
          // REJECTED/EXPIRED before COMPLETED
          if ((reqA.status === "REJECTED" || reqA.status === "EXPIRED") && reqB.status === "COMPLETED") return -1;
          if ((reqB.status === "REJECTED" || reqB.status === "EXPIRED") && reqA.status === "COMPLETED") return 1;
        }
      }
      
      // For "pending" tab: sort by response deadline (earliest first, overdue first)
      if (activeTab === "pending" && reqA && reqB) {
        if (reqA.responseDeadline && reqB.responseDeadline) {
          const now = new Date().getTime();
          const deadlineA = new Date(reqA.responseDeadline).getTime();
          const deadlineB = new Date(reqB.responseDeadline).getTime();
          const overdueA = deadlineA < now;
          const overdueB = deadlineB < now;
          // Overdue first
          if (overdueA && !overdueB) return -1;
          if (!overdueA && overdueB) return 1;
          // Then by deadline (earliest first)
          return deadlineA - deadlineB;
        }
      }
      
      // For "in-review" tab: sort by review deadline (earliest first, overdue first)
      if (activeTab === "in-review" && reqA && reqB) {
        if (reqA.reviewDeadline && reqB.reviewDeadline) {
          const now = new Date().getTime();
          const deadlineA = new Date(reqA.reviewDeadline).getTime();
          const deadlineB = new Date(reqB.reviewDeadline).getTime();
          const overdueA = deadlineA < now;
          const overdueB = deadlineB < now;
          // Overdue first
          if (overdueA && !overdueB) return -1;
          if (!overdueA && overdueB) return 1;
          // Then by deadline (earliest first)
          return deadlineA - deadlineB;
        }
      }
      
      // For "completed" tab: sort by completion date (newest first)
      if (activeTab === "completed" && reqA && reqB) {
        const dateA = new Date(reqA.updatedAt || reqA.createdAt).getTime();
        const dateB = new Date(reqB.updatedAt || reqB.createdAt).getTime();
        return dateB - dateA;
      }
      
      // Apply custom sort
      if (sortBy === "title") {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return sortOrder === "asc" 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      } else if (sortBy === "deadline") {
        // Sort by deadline (for pending/in-review tabs)
        if (activeTab === "pending" && reqA && reqB && reqA.responseDeadline && reqB.responseDeadline) {
          const deadlineA = new Date(reqA.responseDeadline).getTime();
          const deadlineB = new Date(reqB.responseDeadline).getTime();
          return sortOrder === "asc" ? deadlineA - deadlineB : deadlineB - deadlineA;
        } else if (activeTab === "in-review" && reqA && reqB && reqA.reviewDeadline && reqB.reviewDeadline) {
          const deadlineA = new Date(reqA.reviewDeadline).getTime();
          const deadlineB = new Date(reqB.reviewDeadline).getTime();
          return sortOrder === "asc" ? deadlineA - deadlineB : deadlineB - deadlineA;
        }
      }
      
      // Default: sort by created date
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [documents, activeTab, getReviewRequestForDocument, selectedReviewerId, selectedDomainId, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAssignSuccess = () => {
    fetchReviewRequests();
    fetchDocuments(activeTab);
    setShowAssignModal(false);
    setSelectedDocument(null);
    setSelectedReviewRequest(null); // Clear selected review request after assignment
  };

  const handleViewDetail = (doc: DocumentListItem, reviewRequest: ReviewRequestResponse | null) => {
    // If in completed tab and has review request, show review detail modal
    if (activeTab === "completed" && reviewRequest && reviewRequest.status === "COMPLETED") {
      setSelectedReviewRequestId(reviewRequest.id);
      setShowReviewDetailModal(true);
    } else {
      // Otherwise, navigate to document detail page
      router.push(`/business-admin/document/${doc.id}`);
    }
  };

  const handleAssignClick = (doc: DocumentListItem) => {
    setSelectedDocument(doc);
    setSelectedReviewRequest(null);
    setShowAssignModal(true);
  };

  const handleChangeReviewerClick = (doc: DocumentListItem, reviewRequest: ReviewRequestResponse) => {
    console.log("[ReviewManagement] Change reviewer clicked:", {
      documentId: doc.id,
      reviewRequestId: reviewRequest.id,
      reviewRequestStatus: reviewRequest.status,
    });
    setSelectedDocument(doc);
    setSelectedReviewRequest(reviewRequest);
    setShowAssignModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "AI_VERIFIED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "REVIEWING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const tabs = [
    { id: "needs-assignment" as TabType, label: "Needs Assignment", count: null },
    { id: "pending" as TabType, label: "Pending", count: null },
    { id: "in-review" as TabType, label: "In Review", count: null },
    { id: "completed" as TabType, label: "Completed", count: null },
    { id: "all" as TabType, label: "All", count: null },
  ];

  return (
    <div className={styles["container"]}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={styles["page-title"]}>Review Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage premium document reviews and assignments
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 rounded-[10px] bg-white p-2 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex gap-1 border-b border-transparent">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-sm dark:bg-primary"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCurrentPage(1);
                fetchDocuments(activeTab);
              }
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {/* Filter by Reviewer */}
        {(activeTab === "pending" || activeTab === "in-review" || activeTab === "completed" || activeTab === "all") && (
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reviewer
            </label>
            <select
              value={selectedReviewerId || ""}
              onChange={(e) => {
                setSelectedReviewerId(e.target.value || null);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Reviewers</option>
              {availableReviewers.map((reviewer) => (
                <option key={reviewer.id} value={reviewer.id}>
                  {reviewer.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter by Domain */}
        {availableDomains.length > 0 && (
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain
            </label>
            <select
              value={selectedDomainId || ""}
              onChange={(e) => {
                setSelectedDomainId(e.target.value || null);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Domains</option>
              {availableDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort By */}
        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as "title" | "createdAt" | "deadline");
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
            {(activeTab === "pending" || activeTab === "in-review") && (
              <option value="deadline">Deadline</option>
            )}
          </select>
        </div>

        {/* Sort Order */}
        <div className="min-w-[120px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Order
          </label>
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as "asc" | "desc");
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className={`${styles["table-container"]} mt-6`}>
        <div className="overflow-x-auto">
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]}>Title</th>
                {activeTab === "completed" && (
                  <>
                    <th className={styles["table-header-cell"]}>Premium</th>
                    <th className={styles["table-header-cell"]}>Decision</th>
                  </>
                )}
                <th className={styles["table-header-cell"]}>Document Status</th>
                <th className={styles["table-header-cell"]}>Review Request Status</th>
                <th className={styles["table-header-cell"]}>Reviewer</th>
                <th className={styles["table-header-cell"]}>Deadline</th>
                <th className={styles["table-header-cell"]}>Created At</th>
                <th className={styles["table-header-cell"]}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === "completed" ? 9 : 7} className={styles["loading-container"]}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "completed" ? 9 : 7} className={styles["empty-container"]}>
                    No documents found.
                  </td>
                </tr>
              ) : (
                sortedDocuments.map((doc) => {
                  // Get review request for this document
                  // Different tabs need different logic
                  let reviewRequest: ReviewRequestResponse | null = null;
                  
                  const docIdStr = String(doc.id);
                  
                  if (activeTab === "pending") {
                    // For pending tab, get the PENDING request specifically
                    const pendingRequests = reviewRequests.filter(req => {
                      const reqDocId = String(req.document?.id || "");
                      return reqDocId === docIdStr && req.status === "PENDING";
                    });
                    if (pendingRequests.length > 0) {
                      // Get the most recent PENDING request
                      reviewRequest = pendingRequests.sort((a, b) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )[0];
                    }
                  } else if (activeTab === "completed") {
                    // For completed tab, get the COMPLETED request specifically
                    const completedRequests = reviewRequests.filter(req => {
                      const reqDocId = String(req.document?.id || "");
                      return reqDocId === docIdStr && req.status === "COMPLETED";
                    });
                    if (completedRequests.length > 0) {
                      // Get the most recent COMPLETED request
                      reviewRequest = completedRequests.sort((a, b) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )[0];
                    }
                  } else {
                    // For other tabs, use the standard logic
                    reviewRequest = getReviewRequestForDocument(doc.id);
                  }
                  
                  // Determine decision from document status (for completed tab)
                  const decision = activeTab === "completed" 
                    ? (doc.status === "ACTIVE" ? "APPROVED" : doc.status === "REJECTED" ? "REJECTED" : null)
                    : null;

                  return (
                    <tr key={doc.id} className={styles["table-row"]}>
                      <td className={styles["table-cell"]}>
                        <div className={styles["table-cell-main"]}>
                          {doc.title || "N/A"}
                        </div>
                      </td>
                      {activeTab === "completed" && (
                        <>
                          <td className={styles["table-cell"]}>
                            {decision === "APPROVED" && doc.isPremium ? (
                              <span
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              >
                                Premium
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className={styles["table-cell"]}>
                            {decision ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  decision === "APPROVED"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
                                {decision === "APPROVED" ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                <span>{decision}</span>
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className={styles["table-cell"]}>
                        <span
                          className={`${styles["status-badge"]} ${getStatusBadgeClass(doc.status)}`}
                        >
                          {doc.status
                            ? doc.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                            : "N/A"}
                        </span>
                      </td>
                      <td className={styles["table-cell"]}>
                        {reviewRequest ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              reviewRequest.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : reviewRequest.status === "ACCEPTED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : reviewRequest.status === "COMPLETED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : reviewRequest.status === "REJECTED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : reviewRequest.status === "EXPIRED"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {reviewRequest.status === "PENDING" && <Clock className="w-3 h-3" />}
                            {reviewRequest.status === "ACCEPTED" && <Clock className="w-3 h-3" />}
                            {reviewRequest.status === "COMPLETED" && <CheckCircle className="w-3 h-3" />}
                            {reviewRequest.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                            {reviewRequest.status === "EXPIRED" && <AlertCircle className="w-3 h-3" />}
                            <span>{reviewRequest.status}</span>
                          </span>
                        ) : doc.status === "AI_VERIFIED" ? (
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>No Review Request</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {reviewRequest?.reviewer ? (
                          <div className="text-sm">
                            <div className="font-medium">{reviewRequest.reviewer.fullName || "N/A"}</div>
                            {reviewRequest.reviewer.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {reviewRequest.reviewer.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {reviewRequest ? (
                          (() => {
                            const deadline = reviewRequest.status === "PENDING" 
                              ? reviewRequest.responseDeadline 
                              : reviewRequest.status === "ACCEPTED"
                              ? reviewRequest.reviewDeadline
                              : null;
                            
                            if (!deadline) {
                              return <span className="text-gray-500">-</span>;
                            }
                            
                            const isOverdue = new Date(deadline) < new Date();
                            return (
                              <div className="text-sm">
                                {new Date(deadline).toLocaleDateString()}
                                {isOverdue && (
                                  <span className="ml-1 text-red-600 dark:text-red-400 text-xs">
                                    (Overdue)
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className={styles["table-cell"]}>
                        <div className={styles["action-cell"]}>
                          <button
                            onClick={() => handleViewDetail(doc, reviewRequest)}
                            className={styles["action-icon-btn"]}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {doc.status === "AI_VERIFIED" && !reviewRequest && (
                            <button
                              onClick={() => handleAssignClick(doc)}
                              className={styles["action-icon-btn"]}
                              title="Assign Reviewer"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          {reviewRequest && reviewRequest.status === "PENDING" && (
                            <button
                              onClick={() => handleChangeReviewerClick(doc, reviewRequest)}
                              className={styles["action-icon-btn"]}
                              title="Change Reviewer"
                            >
                              <UserCog className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / itemsPerPage)}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>

      {/* Assign Reviewer Modal */}
      {showAssignModal && selectedDocument && (
        <AssignReviewerModal
          open={showAssignModal}
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title || "Document"}
          documentDomain={undefined} // Can be added if available
          documentSpecialization={selectedDocument.specializationName}
          existingReviewRequestId={selectedReviewRequest?.id || undefined} // For change reviewer
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDocument(null);
            setSelectedReviewRequest(null);
          }}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Review Detail Modal */}
      {showReviewDetailModal && selectedReviewRequestId && (
        <ReviewDetailModal
          isOpen={showReviewDetailModal}
          onClose={() => {
            setShowReviewDetailModal(false);
            setSelectedReviewRequestId(null);
          }}
          reviewRequestId={selectedReviewRequestId}
        />
      )}
    </div>
  );
}

