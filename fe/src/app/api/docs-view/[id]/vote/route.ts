// src/app/api/docs-view/[id]/vote/route.ts
import { buildForwardHeaders } from "../../_utils";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";

// GET /api/docs-view/[id]/vote -> BE GET /api/documents/{documentId}/votes
async function handleGET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  if (USE_MOCK) {
    // Mock: giả lập user chưa vote (userVote = 0)
    return jsonResponse(
      {
        documentId: id,
        userVote: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        voteScore: 0,
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

  const fh = await buildForwardHeaders();

  const upstream = await fetch(`${BE_BASE}/api/documents/${id}/votes`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

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

// POST /api/docs-view/[id]/vote -> BE POST /api/documents/{documentId}/votes
async function handlePOST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  if (USE_MOCK) {
    // Mock: giả lập vote thành công
    let body: { voteValue?: number };
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON");
    }

    const voteValue = body.voteValue ?? 0;
    const upvoteCount = voteValue === 1 ? 1 : 0;
    const downvoteCount = voteValue === -1 ? 1 : 0;
    const voteScore = upvoteCount - downvoteCount;

    return jsonResponse(
      {
        documentId: id,
        userVote: voteValue,
        upvoteCount,
        downvoteCount,
        voteScore,
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

  const fh = await buildForwardHeaders();
  const raw = await req.text();

  const upstream = await fetch(`${BE_BASE}/api/documents/${id}/votes`, {
    method: "POST",
    headers: {
      ...fh,
      "Content-Type": "application/json",
    },
    body: raw,
    cache: "no-store",
  });

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

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/docs-view/[id]/vote/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/docs-view/[id]/vote/route.ts/POST",
  });

