// src/services/document-report.service.ts
import {
  CreateReportRequest,
  CreateReportResponse,
} from "@/types/document-report";

export async function createDocumentReport(
  payload: CreateReportRequest,
): Promise<CreateReportResponse> {
  const res = await fetch("/api/document-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to create report";
    try {
      const json = await res.json();
      if (typeof json?.message === "string") {
        message = json.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const json = (await res.json()) as CreateReportResponse;
  return json;
}
