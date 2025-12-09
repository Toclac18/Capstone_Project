// src/app/api/comments/[id]/route.ts
import { buildForwardHeaders } from "../../docs-view/_utils";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";

// PUT /api/comments/:id -> BE PUT /comments/:commentId
async function handlePUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  if (USE_MOCK) {
    // Mock đơn giản: giả lập update thành công
    return jsonResponse(
      { success: true },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  const fh = await buildForwardHeaders();
  const raw = await req.text(); // forward nguyên body

  const upstream = await fetch(
    `${BE_BASE}/api/comments/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        ...fh,
        "Content-Type": "application/json",
      },
      body: raw,
      cache: "no-store",
    },
  );

  // Backend trả CommentResponse trực tiếp, nhưng frontend có thể cần xử lý
  // Giữ nguyên response từ backend
  return proxyJsonResponse(upstream, { mode: "real" });
}

// DELETE /api/comments/:id -> BE DELETE /comments/:commentId
async function handleDELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  if (USE_MOCK) {
    // Mock đơn giản: giả lập delete thành công
    return jsonResponse(
      { success: true },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  const fh = await buildForwardHeaders();

  const upstream = await fetch(
    `${BE_BASE}/api/comments/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: fh,
      cache: "no-store",
    },
  );

  // Backend trả ApiResponse<Void> với { success, message, data, timestamp }
  return proxyJsonResponse(upstream, { mode: "real" });
}

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/comments/[id]/route.ts/PUT",
  });

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/comments/[id]/route.ts/DELETE",
  });

