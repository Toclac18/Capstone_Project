// src/app/business-admin/reports/api.ts
import { apiClient } from "@/services/http";

// Types
export type ReportStatus = "PENDING" | "RESOLVED";
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

export interface ReportQueryParams {
  status?: ReportStatus;
  reason?: ReportReason;
  documentId?: string;
  page?: number;
  size?: number;
}

export interface UpdateReportRequest {
  status?: ReportStatus;
  adminNotes?: string;
}

// Display names
export const REPORT_STATUS_DISPLAY: Record<ReportStatus, string> = {
  PENDING: "Pending",
  RESOLVED: "Resolved",
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

/**
 * Get list of reports with query parameters
 * Uses GET /business-admin/reports (goes through Next.js API route)
 */
export async function getReports(params?: ReportQueryParams): Promise<ReportsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append("status", params.status);
  if (params?.reason) queryParams.append("reason", params.reason);
  if (params?.documentId) queryParams.append("documentId", params.documentId);
  if (params?.page !== undefined) queryParams.append("page", String(params.page));
  if (params?.size !== undefined) queryParams.append("size", String(params.size));

  const queryString = queryParams.toString();
  const url = `/business-admin/reports${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<ReportsResponse>(url);
  return res.data;
}

/**
 * Get report detail by ID
 * Uses GET /business-admin/reports/{id} (goes through Next.js API route)
 */
export async function getReportById(id: string): Promise<Report> {
  const res = await apiClient.get<Report>(`/business-admin/reports/${id}`);
  return res.data;
}

/**
 * Update report status and notes
 * Uses PUT /business-admin/reports/{id} (goes through Next.js API route)
 */
export async function updateReport(id: string, data: UpdateReportRequest): Promise<Report> {
  const res = await apiClient.put<Report>(`/business-admin/reports/${id}`, data);
  return res.data;
}
