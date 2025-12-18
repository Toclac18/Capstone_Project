// src/app/api/org-admin/documents/route.ts
import { BE_BASE } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 10;

async function handleGET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const page = Number(searchParams.get("page") ?? DEFAULT_PAGE);
  const pageSize = Number(searchParams.get("size") ?? DEFAULT_PAGE_SIZE);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const visibility = searchParams.get("visibility") ?? "";

  const upstreamUrl = new URL(`${BE_BASE}/api/organization/documents`);

  upstreamUrl.searchParams.set("page", String(page));
  upstreamUrl.searchParams.set("size", String(pageSize));

  if (search) {
    upstreamUrl.searchParams.set("search", search);
  }
  if (status && status !== "ALL") {
    upstreamUrl.searchParams.set("status", status);
  }
  if (visibility && visibility !== "ALL") {
    upstreamUrl.searchParams.set("visibility", visibility);
  }

  const authHeader = await getAuthHeader();
  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }

  const upstream = await fetch(upstreamUrl.toString(), {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text || upstream.statusText, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "text/plain",
      },
    });
  }

  const payload = await upstream.json();

  return jsonResponse(payload, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/org-admin/documents/route.ts/GET",
  });
