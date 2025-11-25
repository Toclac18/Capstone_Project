import type { ReviewAction } from "@/types/review";
import { approveReviewRequest } from "@/mock/reviewListMock";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    const body = (await request.json()) as { action?: ReviewAction };
    const action = body.action ?? "APPROVE";

    const result = approveReviewRequest(id, action);

    return jsonResponse(result, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Get authentication from cookie
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }
  const upstream = await fetch(
    `${BE_BASE}/api/reviewer/review-list/requests/${id}/approve`,
    {
      method: "POST",
      headers: fh,
      cache: "no-store",
      body: request.body,
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}
