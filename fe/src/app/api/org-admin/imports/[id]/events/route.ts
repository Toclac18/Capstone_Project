import { NextRequest } from "next/server";
import { headers, cookies } from "next/headers";

export const runtime = "nodejs";

function beBase(): string {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;

  const h = await headers();
  const cookieStore = await cookies();

  // Bỏ await khỏi h và cookieStore vì chúng đã được gọi ở trên
  const headerAuth = h.get("authorization") || ""; 
  const cookieAuth = cookieStore.get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  const fh: Record<string, string> = {
    accept: "text/event-stream",
    connection: "keep-alive",
    "cache-control": "no-cache",
  };
  if (effectiveAuth) fh["authorization"] = effectiveAuth;

  const cookieHeader = h.get("cookie"); 
  if (cookieHeader) fh["cookie"] = cookieHeader;

  const target = `${beBase()}/api/org-admin/imports/${id}/events`;

  const controller = new AbortController();
  
  try {
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
  } catch (error) {
      console.error("Error fetching upstream SSE:", error);
      return new Response("Upstream service is unavailable or stream failed.", {
          status: 500,
          headers: { "Content-Type": "text/plain" },
      });
  }
}