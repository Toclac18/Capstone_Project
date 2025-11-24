// app/api/organizations/all/route.ts

import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { parseError } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handleGET() {
  const authHeader = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/organizations/all`, {
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
    context: "api/organizations/all/route.ts/GET",
  });
