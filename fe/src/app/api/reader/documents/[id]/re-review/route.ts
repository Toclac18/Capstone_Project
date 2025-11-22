// app/api/reader/documents/[id]/re-review/route.ts

import { mockDocumentsDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, parseError } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest } from "@/server/response";

/**
 * Handle POST request to submit a re-review request for a document
 */
async function handlePOST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const reason = (body.reason || "").toString().trim();

  if (!reason) {
    return badRequest("Reason is required");
  }

  if (reason.length < 10) {
    return badRequest("Reason must be at least 10 characters");
  }

  if (USE_MOCK) {
    const result = mockDocumentsDB.requestReReview(id, reason);

    if (result.error) {
      return jsonResponse(
        { error: result.error },
        { status: result.status || 400, mode: "mock" },
      );
    }

    return jsonResponse(
      {
        message: "Your request has been submitted and is under review.",
      },
      { mode: "mock" },
    );
  }
  const authHeader = await getAuthHeader("reader-documents-rereview");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(
    `${BE_BASE}/api/reader/documents/${encodeURIComponent(id)}/re-review`,
    {
      method: "POST",
      headers: fh,
      body: JSON.stringify({ reason }),
      cache: "no-store",
    },
  );

  const text = await upstream.text();

  if (!upstream.ok) {
    return jsonResponse(
      { error: parseError(text, "Request failed") },
      { status: upstream.status, mode: "real" },
    );
  }

  // Success path
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    return jsonResponse(
      { error: "Failed to parse upstream response" },
      { status: 500, mode: "real" },
    );
  }

  return jsonResponse(data, { mode: "real" });
}

/**
 * Exported route wrapped with global withErrorBoundary
 */
export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/reader/documents/[id]/re-review/POST",
  });
