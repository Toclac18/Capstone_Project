import { cookies } from "next/headers";
import { getReviewHistory } from "@/mock/reviewListMock";
import type { ReviewHistoryQueryParams } from "@/types/review";
import { getAuthHeader } from "@/server/auth";

const DEFAULT_BE_BASE = "http://localhost:8080";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export async function GET(request: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

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
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Get authentication from cookie
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  const authHeader = (await getAuthHeader("api/reviewer/review-list/history/route.ts")) || bearerToken;

  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
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

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}