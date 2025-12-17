// src/app/api/save-lists/[id]/documents/[documentId]/route.ts
import { proxyJsonResponse, badRequest } from "@/server/response";
import { getAuthHeader } from "@/server/auth";
import { BE_BASE } from "@/server/config";

type RouteContext = { params: Promise<{ id: string; documentId: string }> };

/**
 * DELETE /api/save-lists/[id]/documents/[documentId]
 * Remove a document from saved list
 */
export async function DELETE(_req: Request, context: RouteContext) {
  const { id, documentId } = await context.params;

  if (!id || !documentId) {
    return badRequest("Missing saved list id or document id");
  }

  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(
    `${BE_BASE}/api/save-lists/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`,
    {
      method: "DELETE",
      headers: fh,
      cache: "no-store",
    }
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}
