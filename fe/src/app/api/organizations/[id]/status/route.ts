// app/api/organizations/[id]/status/route.ts

import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { parseError } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handlePATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status) {
    return Response.json({ error: "Status is required" }, { status: 400 });
  }

  const authHeader = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/organizations/${id}/status`, {
    method: "PATCH",
    headers: fh,
    body: JSON.stringify(body),
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

export const PATCH = (...args: Parameters<typeof handlePATCH>) =>
  withErrorBoundary(() => handlePATCH(...args), {
    context: "api/organizations/[id]/status/route.ts/PATCH",
  });