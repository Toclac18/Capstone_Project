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

  if (USE_MOCK) {
    const data = mockGetDocDetail(id);
    if (!data) return badRequest("Not found", 404);
    return jsonResponse(
      { comments: data.comments },
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

  const upstream = await fetch(`${BE_BASE}/api/docs-view/${id}/comments`, {
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

    const comment = mockAddComment(id, content, author);
    if (!comment) return badRequest("Not found", 404);

    return jsonResponse(
      { comment },
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

  const upstream = await fetch(`${BE_BASE}/api/docs-view/${id}/comments`, {
    method: "POST",
    headers: fh,
    body: raw,
    cache: "no-store",
  });

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
