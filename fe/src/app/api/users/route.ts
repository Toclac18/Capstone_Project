// app/api/users/route.ts
import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getUsers, createUser } from "@/mock/business-admin-users";
import type { UserQueryParams, CreateUserData } from "@/types/user";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

export async function GET(req: NextRequest) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const url = new URL(req.url);
  const queryString = url.searchParams.toString();
  const path = queryString ? `/api/users?${queryString}` : `/api/users`;

  if (USE_MOCK) {
    // Parse query params from URL
    const params: UserQueryParams = {};
    if (url.searchParams.get("page")) params.page = parseInt(url.searchParams.get("page")!);
    if (url.searchParams.get("limit")) params.limit = parseInt(url.searchParams.get("limit")!);
    if (url.searchParams.get("search")) params.search = url.searchParams.get("search")!;
    if (url.searchParams.get("role")) params.role = url.searchParams.get("role")!;
    if (url.searchParams.get("status")) params.status = url.searchParams.get("status")!;
    if (url.searchParams.get("sortBy")) params.sortBy = url.searchParams.get("sortBy")!;
    if (url.searchParams.get("sortOrder")) params.sortOrder = url.searchParams.get("sortOrder") as "asc" | "desc";
    if (url.searchParams.get("dateFrom")) params.dateFrom = url.searchParams.get("dateFrom")!;
    if (url.searchParams.get("dateTo")) params.dateTo = url.searchParams.get("dateTo")!;

    const result = getUsers(params);
    return json({ data: result }, 200, { "x-mode": "mock" });
  }

  try {
    const { upstream } = await forward(path);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json({ message: "Users fetch failed", error: String(e) }, 502);
  }
}

export async function POST(req: NextRequest) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const body = await req.json().catch(() => null);

  if (!body) {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (USE_MOCK) {
    // Check if this is a list request (has query params in body) or create request
    if (body.page !== undefined || body.search !== undefined || body.role !== undefined) {
      // This is a list request (POST with query params)
      const params: UserQueryParams = body;
      const result = getUsers(params);
      return json({ data: result }, 200, { "x-mode": "mock" });
    } else {
      // This is a create request
      const data = body as CreateUserData;
      const user = createUser(data);
      return json({ data: user }, 201, { "x-mode": "mock" });
    }
  }

  try {
    const { upstream } = await forwardJson("/api/users", body);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json({ message: "User creation failed", error: String(e) }, 502);
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

async function forwardJson(path: string, body: any) {
  const h = headers();
  const cookieStore = cookies();
  const headerAuth = (await h).get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  const upstreamUrl = beBase() + path;
  const passHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
  };

  const cookieHeader = (await h).get("cookie");
  if (cookieHeader) passHeaders["cookie"] = cookieHeader;

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: passHeaders,
    body: JSON.stringify(body),
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

