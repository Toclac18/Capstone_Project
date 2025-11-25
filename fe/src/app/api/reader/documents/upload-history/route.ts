import { mockDocumentsDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const type = searchParams.get("type") || undefined;
  const domain = searchParams.get("domain") || undefined;
  const status = searchParams.get("status") || undefined;
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 1;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 10;

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
    return jsonResponse(result, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
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

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/documents/upload-history/route.ts/GET",
  });
