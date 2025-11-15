import { cookies } from "next/headers";
import { mockDocumentsDB } from "@/mock/db";

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
  const status = searchParams.get("status") || undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;

  if (USE_MOCK) {
    const result = mockDocumentsDB.getUploadHistory({
      search,
      dateFrom,
      dateTo,
      type,
      domain,
      status: status as "PENDING" | "APPROVED" | "REJECTED" | undefined,
      page,
      limit,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Lấy authentication từ cookie
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  // Backend chỉ nhận Authorization header, không nhận cookie
  const fh = new Headers();
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (dateFrom) queryParams.append("dateFrom", dateFrom);
  if (dateTo) queryParams.append("dateTo", dateTo);
  if (type) queryParams.append("type", type);
  if (domain) queryParams.append("domain", domain);
  if (status) queryParams.append("status", status);
  if (page) queryParams.append("page", page.toString());
  if (limit) queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const url = `${BE_BASE}/api/reader/documents/upload-history${queryString ? `?${queryString}` : ""}`;

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

