import { NextRequest } from "next/server";
import { headers, cookies } from "next/headers";

export const runtime = "nodejs";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;

  const h = headers();
  const cookieStore = cookies();

  const headerAuth = (await h).get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  const fh: Record<string, string> = {
    accept: "text/event-stream",
    connection: "keep-alive",
    "cache-control": "no-cache",
  };
  if (effectiveAuth) fh["authorization"] = effectiveAuth;

  const cookieHeader = (await h).get("cookie");
  if (cookieHeader) fh["cookie"] = cookieHeader;

  const target = `${beBase()}/api/org-admin/imports/${id}/events`;

  const controller = new AbortController();
  const upstream = await fetch(target, {
    method: "GET",
    headers: fh,
    signal: controller.signal,
  });

  // Stream passthrough
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
