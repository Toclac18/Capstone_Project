// GET /api/reviewer/review-list/todo -> BE GET /api/review-requests/todo
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { headers } from "next/headers";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 0;
  const size = searchParams.get("size") || searchParams.get("limit")
    ? parseInt(searchParams.get("size") || searchParams.get("limit")!)
    : 10;

  if (USE_MOCK) {
    return jsonResponse(
      {
        success: true,
        data: [],
        pageInfo: {
          page: page,
          size: size,
          totalElements: 0,
          totalPages: 0,
        },
      },
      {
        status: 200,
        mode: "mock",
      },
    );
  }

  const bearerToken = await getAuthHeader();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers();
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }
  if (ip) {
    fh.set("X-Forwarded-For", ip);
  }

  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());

  const upstream = await fetch(
    `${BE_BASE}/api/review-requests/todo?${queryParams.toString()}`,
    {
      method: "GET",
      headers: fh,
      cache: "no-store",
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}

export { handleGET as GET };
