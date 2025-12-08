// PUT /api/reviewer/review-list/requests/[id]/respond -> BE PUT /api/review-requests/{reviewRequestId}/respond
import { proxyJsonResponse, jsonResponse, badRequest } from "@/server/response";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { headers } from "next/headers";

async function handlePUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing reviewRequestId");

  if (USE_MOCK) {
    // Mock response
    return jsonResponse(
      {
        success: true,
        data: {
          id,
          status: "ACCEPTED",
        },
        message: "Review request accepted successfully",
      },
      {
        status: 200,
        mode: "mock",
      },
    );
  }

  const bearerToken = await getAuthHeader();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers();
  fh.set("Content-Type", "application/json");
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }
  if (ip) {
    fh.set("X-Forwarded-For", ip);
  }
  const raw = await req.text();

  const upstream = await fetch(
    `${BE_BASE}/api/review-requests/${id}/respond`,
    {
      method: "PUT",
      headers: fh,
      body: raw,
      cache: "no-store",
    },
  );

  // Backend returns ApiResponse<ReviewRequestResponse>
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // Unwrap backend response: { success: true, data: {...} }
  const json = await upstream.json();
  const data = json?.data || json;

  return jsonResponse(data, {
    status: upstream.status,
    mode: "real",
  });
}

export { handlePUT as PUT };

