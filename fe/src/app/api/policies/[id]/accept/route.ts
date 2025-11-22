// app/api/policies/[id]/accept/route.ts
import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";
import { acceptPolicy } from "@/mock/policies";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8080"
  );
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const { id } = await params;

  if (USE_MOCK) {
    // Mock: get user from cookie (in real app, decode JWT)
    const cookieStore = await cookies();
    const userId = cookieStore.get("access_token")?.value || "user-1";
    const success = acceptPolicy(id, userId);
    if (!success) {
      return json({ error: "Policy not found" }, 404, { "x-mode": "mock" });
    }
    return json({ message: "Policy accepted successfully" }, 200, {
      "x-mode": "mock",
    });
  }

  try {
    const { upstream } = await forwardPost(`/api/policies/${id}/accept`);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json(
      { message: "Policy acceptance failed", error: String(e) },
      502
    );
  }
}

// ---------- Helpers ----------
async function forwardPost(path: string) {
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
    method: "POST",
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

