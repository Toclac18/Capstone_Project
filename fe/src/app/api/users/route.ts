// app/api/users/route.ts

import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { parseError } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

/**
 * List users with optional query params. Proxies to BE_BASE/api/users.
 */
async function handleGET(req: Request) {
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();
  const url = queryString
    ? `${BE_BASE}/api/users?${queryString}`
    : `${BE_BASE}/api/users`;

  const authHeader = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(url, {
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
    context: "api/users/route.ts/GET",
  });
