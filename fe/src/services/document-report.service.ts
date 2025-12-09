import apiClient from "@/services/http";
import {
  CreateReportRequest,
  CreateReportResponse,
} from "@/types/document-report";

export async function createDocumentReport(
  payload: CreateReportRequest,
): Promise<CreateReportResponse> {
  const res = await apiClient.post<CreateReportResponse>(
    "/document-report",
    payload,
  );

  return res.data;
}
