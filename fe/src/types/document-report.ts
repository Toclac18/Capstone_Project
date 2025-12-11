// src/types/document-report.ts

export enum ReportReason {
  INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT",
  COPYRIGHT_VIOLATION = "COPYRIGHT_VIOLATION",
  SPAM = "SPAM",
  MISLEADING_INFORMATION = "MISLEADING_INFORMATION",
  DUPLICATE_CONTENT = "DUPLICATE_CONTENT",
  QUALITY_ISSUES = "QUALITY_ISSUES",
  OTHER = "OTHER",
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  [ReportReason.INAPPROPRIATE_CONTENT]: "Inappropriate Content",
  [ReportReason.COPYRIGHT_VIOLATION]: "Copyright Violation",
  [ReportReason.SPAM]: "Spam",
  [ReportReason.MISLEADING_INFORMATION]: "Misleading Information",
  [ReportReason.DUPLICATE_CONTENT]: "Duplicate Content",
  [ReportReason.QUALITY_ISSUES]: "Quality Issues",
  [ReportReason.OTHER]: "Other",
};

export interface CreateReportRequest {
  documentId: string; // UUID (string)
  reason: ReportReason;
  description?: string | null;
}

export interface ReportDto {
  id: string;
  documentId: string;
  reason: ReportReason;
  description?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type CreateReportResponse = ApiResponse<ReportDto>;
