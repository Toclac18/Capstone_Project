// src/app/api/docs-view/[id]/route.ts
import { mockGetDocDetail } from "@/mock/docsDetail";
import { badRequest, getBeBase, buildForwardHeaders } from "../_utils";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function GET(
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
  const BE_BASE = getBeBase();
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
