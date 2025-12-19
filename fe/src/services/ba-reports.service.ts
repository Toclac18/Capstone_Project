// Types
export type ReportStatus = "PENDING" | "IN_REVIEW" | "RESOLVED" | "REJECTED" | "CLOSED";
export type ReportReason =
  | "INAPPROPRIATE_CONTENT"
  | "COPYRIGHT_VIOLATION"
  | "SPAM"
  | "MISLEADING_INFORMATION"
  | "DUPLICATE_CONTENT"
  | "QUALITY_ISSUES"
  | "OTHER";

export interface ReporterInfo {
  id: string;
  fullName: string;
  email: string;
}

export interface ReviewerInfo {
  id: string;
  fullName: string;
}

export interface Report {
  id: string;
  documentId: string;
  documentTitle: string;
  reporter: ReporterInfo;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  reviewedBy?: ReviewerInfo;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsResponse {
  data: Report[];
  pageInfo: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface UpdateReportRequest {
  status?: ReportStatus;
  adminNotes?: string;
}

// Display names
export const REPORT_STATUS_DISPLAY: Record<ReportStatus, string> = {
  PENDING: "Pending Review",
  IN_REVIEW: "In Review",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  CLOSED: "Closed",
};

export const REPORT_REASON_DISPLAY: Record<ReportReason, string> = {
  INAPPROPRIATE_CONTENT: "Inappropriate Content",
  COPYRIGHT_VIOLATION: "Copyright Violation",
  SPAM: "Spam",
  MISLEADING_INFORMATION: "Misleading Information",
  DUPLICATE_CONTENT: "Duplicate Content",
  QUALITY_ISSUES: "Quality Issues",
  OTHER: "Other",
};

// API functions
export async function getReports(params?: {
  status?: ReportStatus;
  reason?: ReportReason;
  documentId?: string;
  page?: number;
  size?: number;
}): Promise<ReportsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.reason) searchParams.set("reason", params.reason);
  if (params?.documentId) searchParams.set("documentId", params.documentId);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = `/api/business-admin/reports${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch reports");
  }

  return response.json();
}

export async function getReportById(id: string): Promise<Report> {
  const response = await fetch(`/api/business-admin/reports/${id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch report");
  }

  return response.json();
}

export async function updateReport(
  id: string,
  data: UpdateReportRequest
): Promise<Report> {
  const response = await fetch(`/api/business-admin/reports/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update report");
  }

  return response.json();
}
