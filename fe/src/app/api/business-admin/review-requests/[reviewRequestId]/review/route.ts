import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(
  _request: Request,
  ctx: { params: Promise<{ reviewRequestId: string }> },
) {
  const { reviewRequestId } = await ctx.params;
  if (!reviewRequestId) {
    return jsonResponse({ error: "Missing reviewRequestId" }, { status: 400 });
  }

  if (USE_MOCK) {
    return jsonResponse({
      success: true,
      data: {
        id: "mock-review-id",
        reviewRequestId,
        decision: "APPROVED",
        report: "Mock review report",
        reportFileUrl: "https://example.com/report.docx",
        submittedAt: new Date().toISOString(),
      },
      message: "Document review retrieved successfully",
    }, {
      status: 200,
      mode: "mock",
    });
  }

  const authHeader = await getAuthHeader("documents");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/admin/review-requests/${reviewRequestId}/review`;
  console.log(`[document-review] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json().catch(() => ({}));
  const data = responseData?.data || responseData;

  return jsonResponse(data, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ reviewRequestId: string }> },
) {
  return withErrorBoundary(() => handleGET(request, ctx), {
    context: "api/business-admin/review-requests/[reviewRequestId]/review/route.ts/GET",
  });
}


