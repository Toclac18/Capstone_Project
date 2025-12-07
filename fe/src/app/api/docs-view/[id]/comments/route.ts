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
  // REAL MODE: proxy sang BE /comments/document/:docId
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
  // REAL MODE: proxy POST sang BE /api/comments với documentId trong body
  // Backend trả CommentResponse trực tiếp (không wrap)
  // -----------------------------
  const fh = await buildForwardHeaders();
  
  // Parse body để thêm documentId
  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  // Thêm documentId vào body
  const requestBody = {
    ...body,
    documentId: id,
  };

  const upstream = await fetch(`${BE_BASE}/api/comments`, {
    method: "POST",
    headers: {
      ...fh,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  // Backend trả CommentResponse trực tiếp, nhưng frontend expect { success, data, timestamp }
  // Nên cần wrap lại
  if (upstream.ok) {
    const commentResponse = await upstream.json();
    return jsonResponse(
      {
        success: true,
        data: commentResponse,
        timestamp: new Date().toISOString(),
      },
      {
        status: upstream.status,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

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
