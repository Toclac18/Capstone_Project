import { cookies } from "next/headers";
import { getReviewRequests } from "@/mock/review-list";

const DEFAULT_BE_BASE = "http://localhost:8080";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export async function GET(request: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 12;

  if (USE_MOCK) {
    const result = getReviewRequests({
      page,
      limit,
      search,
    });
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

