// src/app/api/docs-view/[id]/comments/route.ts
import { mockAddComment, mockGetDocDetail } from "@/mock/docs-detail.mock";
import { buildForwardHeaders } from "../../_utils";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  // -----------------------------
  // MOCK MODE: convert comments FE -> shape BE
  // -----------------------------
  if (USE_MOCK) {
    const data = mockGetDocDetail(id);
    if (!data) return badRequest("Not found", 404);

    const now = new Date().toISOString();

    const beComments = (data.comments || []).map((c: any) => ({
      id: c.id,
      documentId: c.docId,
      user: {
        id: "mock-user",
        fullName: c.author,
      },
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.createdAt,
    }));

    const payload = {
      success: true,
      data: beComments,
      pageInfo: {
        page: 0,
        size: beComments.length,
        totalElements: beComments.length,
        totalPages: 1,
        first: true,
        last: true,
        hasNext: false,
        hasPrevious: false,
      },
      timestamp: now,
    };

    return jsonResponse(payload, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // -----------------------------
  // REAL MODE: proxy sang BE /api/comments/document/:docId
  // -----------------------------
  const fh = await buildForwardHeaders();

  const upstream = await fetch(`${BE_BASE}/api/comments/document/${id}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

async function handlePOST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  // -----------------------------
  // MOCK MODE: thêm comment vào mock store, trả về shape giống BE
  // -----------------------------
  if (USE_MOCK) {
    let body: { content?: string; author?: string };
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON");
    }
    const content = (body.content || "").toString().trim();
    const author = (body.author || "You").toString().trim() || "You";
    if (!content) return badRequest('Field "content" is required');

    const saved = mockAddComment(id, content, author);
    if (!saved) return badRequest("Not found", 404);

    const now = new Date().toISOString();
    const beComment = {
      id: saved.id,
      documentId: saved.docId,
      user: {
        id: "mock-user",
        fullName: saved.author,
      },
      content: saved.content,
      createdAt: saved.createdAt,
      updatedAt: saved.createdAt,
    };

    return jsonResponse(
      {
        success: true,
        data: beComment,
        timestamp: now,
      },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  // -----------------------------
  // REAL MODE: proxy POST sang BE /api/comments/document/:docId
  // -----------------------------
  const fh = await buildForwardHeaders();
  const raw = await req.text(); // forward nguyên body

  const upstream = await fetch(`${BE_BASE}/api/comments/document/${id}`, {
    method: "POST",
    headers: fh,
    body: raw,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

// PUT /api/comments/:id  -> BE /comments/:commentId
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
    `${BE_BASE}/comments/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: fh,
      body: raw,
      cache: "no-store",
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}

// DELETE /api/comments/:id -> BE /comments/:commentId
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
    `${BE_BASE}/comments/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: fh,
      cache: "no-store",
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}
export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/docs-view/[id]/comments/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/docs-view/[id]/comments/route.ts/POST",
  });

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/comments/[id]/route.ts/PUT",
  });

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/comments/[id]/route.ts/DELETE",
  });
