// app/api/policies/[id]/route.ts
import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  getPolicyById,
  getPolicyView,
} from "@/mock/policies";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const { id } = await params;
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId"); // For checking acceptance
  const view = url.searchParams.get("view") === "true"; // Get with acceptance status

  if (USE_MOCK) {
    if (view) {
      const result = getPolicyView(id, userId || undefined);
      if (!result) {
        return json({ error: "Policy not found" }, 404, { "x-mode": "mock" });
      }
      return json({ data: result }, 200, { "x-mode": "mock" });
    }

    const policy = getPolicyById(id);
    if (!policy) {
      return json({ error: "Policy not found" }, 404, { "x-mode": "mock" });
    }
    return json({ data: policy }, 200, { "x-mode": "mock" });
  }

  const queryString = url.searchParams.toString();
  const path = queryString
    ? `/api/policies/${id}?${queryString}`
    : `/api/policies/${id}`;

  try {
    const { upstream } = await forward(path);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json({ message: "Policy fetch failed", error: String(e) }, 502);
  }
}

// ---------- Helpers ----------
async function forward(path: string) {
  const h = headers();
  const cookieStore = cookies();
  const headerAuth = (await h).get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  const upstreamUrl = beBase() + path;
  const passHeaders: Record<string, string> = {
    ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
  };

  const cookieHeader = (await h).get("cookie");
  if (cookieHeader) passHeaders["cookie"] = cookieHeader;

  const upstream = await fetch(upstreamUrl, {
    headers: passHeaders,
    cache: "no-store",
  });

  return { upstream, status: upstream.status, headers: upstream.headers };
}

function json(
  data: any,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}
