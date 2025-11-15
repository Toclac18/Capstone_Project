// src/app/api/docs-view/[id]/downvote/route.ts
import { mockDownvoteDoc } from "@/mock/docsDetail";
import { badRequest, getBeBase, buildForwardHeaders } from "../../_utils";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  if (USE_MOCK) {
    const result = mockDownvoteDoc(id);
    if (!result) return badRequest("Not found", 404);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const BE_BASE = getBeBase();
  const fh = await buildForwardHeaders();

  const upstream = await fetch(`${BE_BASE}/api/docs-view/${id}/downvote`, {
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
