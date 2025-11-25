import { mockDocumentsDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domainIdsParam = searchParams.get("domainIds");
  const domainIds = domainIdsParam
    ? domainIdsParam.split(",").filter(Boolean)
    : [];

  if (USE_MOCK) {
    const specializations = mockDocumentsDB.getSpecializations(domainIds);
    return new Response(JSON.stringify(specializations), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Public endpoint - no auth required
  const url = domainIdsParam
    ? `${BE_BASE}/api/reader/documents/specializations?domainIds=${encodeURIComponent(domainIdsParam)}`
    : `${BE_BASE}/api/reader/documents/specializations`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
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
    context: "api/reader/documents/specializations/route.ts/GET",
  });
