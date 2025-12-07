// src/app/api/documents/[id]/presigned-url/route.ts
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest, jsonResponse, proxyJsonResponse } from "@/server/response";
import { buildForwardHeaders } from "../../_utils";
import { BE_BASE, USE_MOCK } from "@/server/config";

async function handleGET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  // -----------------------------
  // MOCK MODE
  // -----------------------------
  if (USE_MOCK) {
    return jsonResponse(
      {
        success: true,
        data: {
          presignedUrl: "/sample.pdf",
          expiresInMinutes: 20,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "x-mode": "mock",
        },
      },
    );
  }

  // -----------------------------
  // REAL MODE -> Proxy đến BE
  // GET /api/documents/:id/presigned-url
  // -----------------------------
  const fh = await buildForwardHeaders();

  const upstream = await fetch(
    `${BE_BASE}/api/documents/${encodeURIComponent(id)}/presigned-url`,
    {
      method: "GET",
      headers: fh,
      cache: "no-store",
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/documents/[id]/presigned-url/route.ts/GET",
  });
