// src/app/api/document-report/route.ts
import { BE_BASE, USE_MOCK } from "@/server/config";
import { badRequest, jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { mockCreateDocumentReport } from "@/mock/document-report.mock";
import { ReportReason } from "@/types/document-report";
import { getAuthHeader } from "@/server/auth";

interface RawBody {
  documentId?: string;
  reason?: ReportReason | string;
  description?: string | null;
}

async function handlePOST(req: Request): Promise<Response> {
  let body: RawBody | null = null;

  try {
    body = (await req.json()) as RawBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const documentId = body?.documentId;
  const reason = body?.reason as ReportReason | undefined;
  const description =
    typeof body?.description === "string" ? body.description : null;

  if (!documentId) {
    return badRequest("Document ID is required");
  }

  if (!reason) {
    return badRequest("Report reason is required");
  }

  // MOCK
  if (USE_MOCK) {
    const report = mockCreateDocumentReport({
      documentId,
      reason,
      description,
    });

    return jsonResponse(
      {
        success: true,
        data: report,
      },
      { mode: "mock" },
    );
  }

  // REAL BE
  const authHeader = await getAuthHeader("document-report");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/reports`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify({ documentId, reason, description }),
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/document-report/route.ts/POST",
  });
