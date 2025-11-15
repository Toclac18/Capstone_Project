// src/app/api/docs-view/[id]/comments/route.ts
import { mockAddComment, mockGetDocDetail } from "@/mock/docsDetail";
import { badRequest, getBeBase, buildForwardHeaders } from "../../_utils";

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
    return new Response(JSON.stringify({ comments: data.comments }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const BE_BASE = getBeBase();
  const fh = await buildForwardHeaders();

  const upstream = await fetch(`${BE_BASE}/api/docs-view/${id}/comments`, {
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

export async function POST(
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

    return new Response(JSON.stringify({ comment }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const BE_BASE = getBeBase();
  const fh = await buildForwardHeaders();
  const raw = await req.text(); // forward nguyên body

  const upstream = await fetch(`${BE_BASE}/api/docs-view/${id}/comments`, {
    method: "POST",
    headers: fh,
    body: raw,
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
