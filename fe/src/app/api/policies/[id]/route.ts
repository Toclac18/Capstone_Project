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
    "http://localhost:8080"
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
  const h = await headers();
  const cookieStore = await cookies();
  const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
  
  // Get token from cookie and convert to Bearer format
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";
  
  // Also check if Authorization header is already present
  const headerAuth = h.get("authorization") || "";

  const upstreamUrl = beBase() + path;
  const passHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Use Bearer token from cookie or existing Authorization header
  if (bearerToken) {
    passHeaders["Authorization"] = bearerToken;
  } else if (headerAuth) {
    passHeaders["Authorization"] = headerAuth;
  }

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
