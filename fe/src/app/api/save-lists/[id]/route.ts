// src/app/api/save-lists/[id]/route.ts
import { proxyJsonResponse } from "@/server/response";
import { BE_BASE } from "@/server/config";
import { badRequest } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/save-lists/[id]
 * Get saved list detail with documents
 */
export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return badRequest("Missing saved list id");
  }

  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/save-lists/${id}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

/**
 * PUT /api/save-lists/[id]
 * Update saved list name
 */
export async function PUT(req: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return badRequest("Missing saved list id");
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/save-lists/${id}`, {
    method: "PUT",
    headers: fh,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

/**
 * DELETE /api/save-lists/[id]
 * Delete a saved list
 */
export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return badRequest("Missing saved list id");
  }

  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/save-lists/${id}`, {
    method: "DELETE",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}
