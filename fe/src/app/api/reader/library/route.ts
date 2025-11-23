import { mockLibraryDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const source = searchParams.get("source") as
    | "UPLOADED"
    | "REDEEMED"
    | undefined;
  const type = searchParams.get("type") || undefined;
  const domain = searchParams.get("domain") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 1;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 12;

  if (USE_MOCK) {
    const result = mockLibraryDB.getLibrary({
      search,
      source,
      type,
      domain,
      dateFrom,
      dateTo,
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

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (source) queryParams.append("source", source);
  if (type) queryParams.append("type", type);
  if (domain) queryParams.append("domain", domain);
  if (dateFrom) queryParams.append("dateFrom", dateFrom);
  if (dateTo) queryParams.append("dateTo", dateTo);
  if (page) queryParams.append("page", page.toString());
  if (limit) queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const url = `${BE_BASE}/api/reader/library${queryString ? `?${queryString}` : ""}`;

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

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/library/route.ts/GET",
  });
