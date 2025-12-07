// src/mock/document-report.mock.ts
import {
  CreateReportRequest,
  ReportDto,
  ReportReason,
} from "@/types/document-report";

export function mockCreateDocumentReport(
  payload: CreateReportRequest,
): ReportDto {
  const now = new Date().toISOString();

  // bạn bảo id mock = "1"
  return {
    id: "1",
    documentId: payload.documentId,
    reason: payload.reason ?? ReportReason.OTHER,
    description: payload.description ?? null,
    createdAt: now,
    createdBy: "mock-user",
  };
}
