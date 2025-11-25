// app/api/documents/route.ts

import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { parseError } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

/**
 * This route proxies document detail by id using a query param (?id=...).
 * It preserves the original behavior: require id in query, then call
 * BE_BASE/api/documents/{id} with Authorization from cookie.
 */
async function handleGET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Document ID is required" }, { status: 400 });
  }

  const authHeader = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/documents/${id}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return Response.json(
      { error: parseError(text, "Request failed") },
      { status: upstream.status },
    );
  }

  try {
    const response = JSON.parse(text);
    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Failed to process response" },
      { status: 500 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/documents/route.ts/GET",
  });