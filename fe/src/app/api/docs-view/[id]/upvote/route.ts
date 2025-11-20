// src/app/api/docs-view/[id]/upvote/route.ts
import { mockUpvoteDoc } from "@/mock/docsDetail";
import { badRequest, buildForwardHeaders } from "../../_utils";
import { BE_BASE, USE_MOCK } from "@/server/config";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  if (USE_MOCK) {
    const result = mockUpvoteDoc(id);
    if (!result) return badRequest("Not found", 404);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const fh = await buildForwardHeaders();

  const upstream = await fetch(`${BE_BASE}/api/docs-view/${id}/upvote`, {
    method: "POST",
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