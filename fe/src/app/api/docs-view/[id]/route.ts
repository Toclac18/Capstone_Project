// src/app/api/docs-view/[id]/route.ts
import { mockGetDocDetail } from "@/mock/docs-detail.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { buildForwardHeaders } from "../_utils";

async function handleGET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  if (USE_MOCK) {
    const data = mockGetDocDetail(id);
    if (!data) return badRequest("Not found", 404);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "x-mode": "mock",
      },
    });
  }

  // REAL: forward sang BE
  const fh = await buildForwardHeaders();

  const upstream = await fetch(`${BE_BASE}/api/docs-view/${id}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/docs-view/[id]/route.ts/GET",
  });
