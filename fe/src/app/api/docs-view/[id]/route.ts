// src/app/api/docs-view/[id]/route.ts
import { mockGetDocDetail } from "@/mock/docs-detail.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { buildForwardHeaders } from "../_utils";

async function handleGET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  // -----------------------------
  // MOCK MODE: trả về shape giống BE /api/documents/:id
  // -----------------------------
  if (USE_MOCK) {
    const data = mockGetDocDetail(id);
    if (!data) return badRequest("Not found", 404);

    const { detail } = data; // giả sử mockGetDocDetail trả { detail, related, stats, comments }

    const now = new Date().toISOString();

    const beLike = {
      success: true,
      data: {
        id: detail.id,
        title: detail.title,
        description: detail.description ?? "",
        visibility: "PUBLIC",
        status: "VERIFIED",
        isPremium: detail.isPremium,
        price: detail.points ?? 0,
        thumbnailUrl: detail.thumbnail ?? null,
        pageCount: detail.pageCount ?? 0,
        viewCount: detail.viewCount ?? 0,
        upvoteCount: detail.upvote_counts ?? 0,
        downvoteCount: detail.downvote_counts ?? 0,
        voteScore: detail.vote_scores ?? 0,
        createdAt: now,
        updatedAt: now,
        summarizations: {
          shortSummary: "",
          mediumSummary: "",
          detailedSummary: "",
        },
        uploader: {
          id: "mock-uploader",
          fullName: detail.uploader,
          email: "",
          avatarUrl: null,
        },
        organization: {
          id: "mock-org",
          name: detail.orgName,
          logoUrl: null,
        },
        docType: {
          id: "mock-doc-type",
          name: "REPORT",
          description: "Mock doc type",
        },
        specialization: {
          id: "mock-spec",
          name: detail.specialization,
          domain: {
            id: "mock-domain",
            name: "",
          },
        },
        tags: [],
        userInfo: {
          hasAccess: true,
          isUploader: true,
          hasRedeemed: detail.isRedeemed ?? false,
          isMemberOfOrganization: true,
        },
      },
      timestamp: now,
    };

    return jsonResponse(beLike, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "x-mode": "mock",
      },
    });
  }

  // -----------------------------
  // REAL MODE: proxy sang BE /api/documents/:id
  // -----------------------------
  const fh = await buildForwardHeaders();

  const upstream = await fetch(`${BE_BASE}/api/documents/${id}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/docs-view/[id]/route.ts/GET",
  });
