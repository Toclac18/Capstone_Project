import type { ReviewAction } from "@/types/review";
import { submitReview } from "@/mock/reviewListMock";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";
import { BE_BASE, USE_MOCK } from "@/server/config";

const MAX_REPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    const { searchParams } = new URL(request.url);
    const action =
      (searchParams.get("action") as ReviewAction | null) ?? "APPROVE";

    // Optional safety: check Content-Length if available
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (
        !Number.isNaN(contentLength) &&
        contentLength > MAX_REPORT_SIZE_BYTES
      ) {
        return new Response(
          JSON.stringify({
            message: "Report file must be 10MB or smaller.",
          }),
          {
            status: 413,
            headers: {
              "content-type": "application/json",
              "x-mode": "mock",
            },
          },
        );
      }
    }

    const result = submitReview(id, action);

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
    `${BE_BASE}/api/reviewer/review-list/${id}/review`,
    {
      method: "POST",
      headers: fh,
      cache: "no-store",
      body: request.body,
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}
