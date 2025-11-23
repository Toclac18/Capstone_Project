import { headers } from "next/headers";
import { mockDocumentsDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domainIdsParam = searchParams.get("domainIds");
  const domainIds = domainIdsParam
    ? domainIdsParam.split(",").filter(Boolean)
    : [];

  if (USE_MOCK) {
    const specializations = mockDocumentsDB.getSpecializations(domainIds);
    return jsonResponse(specializations, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const url = domainIdsParam
    ? `${BE_BASE}/api/reader/documents/specializations?domainIds=${encodeURIComponent(domainIdsParam)}`
    : `${BE_BASE}/api/reader/documents/specializations`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/documents/specializations/route.ts/GET",
  });
