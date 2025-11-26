import { getReviewRequests } from "@/mock/review-list.mock";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";
import { BE_BASE, USE_MOCK } from "@/server/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 1;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 12;

  if (USE_MOCK) {
    const result = getReviewRequests({
      page,
      limit,
      search,
    });
    return jsonResponse(result, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Get authentication from cookie
  const bearerToken = await getAuthHeader();

  const fh = new Headers();
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());

  const url = `${BE_BASE}/api/reviewer/review-list/requests?${queryParams.toString()}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}
