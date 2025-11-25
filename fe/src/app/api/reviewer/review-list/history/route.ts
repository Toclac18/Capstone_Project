import { getReviewHistory } from "@/mock/reviewListMock";
import type { ReviewHistoryQueryParams } from "@/types/review";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";
import { BE_BASE, USE_MOCK } from "@/server/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const type = searchParams.get("type") || undefined;
  const domain = searchParams.get("domain") || undefined;
  const specialization = searchParams.get("specialization") || undefined;
  const active =
    searchParams.get("active") === "true"
      ? true
      : searchParams.get("active") === "false"
        ? false
        : undefined;
  const rejected =
    searchParams.get("rejected") === "true"
      ? true
      : searchParams.get("rejected") === "false"
        ? false
        : undefined;
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 1;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 12;

  if (USE_MOCK) {
    const params: ReviewHistoryQueryParams = {
      page,
      limit,
      search,
      dateFrom,
      dateTo,
      type,
      domain,
      specialization,
      active,
      rejected,
    };
    const result = getReviewHistory(params);
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

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());

  const url = `${BE_BASE}/api/reviewer/review-list/history?${queryParams.toString()}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}
