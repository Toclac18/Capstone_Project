// app/api/users/route.ts

import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { getUsers } from "@/mock/business-admin-users";

/**
 * List users with optional query params. Proxies to BE_BASE/api/users.
 */
async function handleGET(req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    const { searchParams } = new URL(req.url);
    const params = {
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      status: searchParams.get("status") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    };

    const result = getUsers(params);
    return jsonResponse(result, { status: 200, mode: "mock" });
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = queryString
      ? `${BE_BASE}/api/users?${queryString}`
      : `${BE_BASE}/api/users`;

    const authHeader = await getAuthHeader();

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(url, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: any) {
    return jsonResponse(
      { message: "Users fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

async function handlePOST(req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    const body = await req.json().catch(() => ({}));
    const params = {
      page: body?.page || 1,
      limit: body?.limit || 10,
      search: body?.search || undefined,
      role: body?.role || undefined,
      status: body?.status || undefined,
      dateFrom: body?.dateFrom || undefined,
      dateTo: body?.dateTo || undefined,
      sortBy: body?.sortBy || undefined,
      sortOrder: body?.sortOrder || undefined,
    };

    const result = getUsers(params);
    return jsonResponse(result, { status: 200, mode: "mock" });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = await getAuthHeader();

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/users`, {
      method: "POST",
      headers: fh,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: any) {
    return jsonResponse(
      { message: "Users fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/users/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/users/route.ts/POST",
  });
