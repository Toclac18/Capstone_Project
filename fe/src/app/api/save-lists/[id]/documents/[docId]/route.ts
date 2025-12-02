// app/api/save-lists/[id]/documents/[docId]/route.ts

import { NextRequest } from "next/server";
import { mockRemoveDocFromSaveList } from "@/mock/save-list.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

type RouteContext = { params: { id: string; docId: string } };

/**
 * DELETE /api/save-lists/:id/documents/:docId
 * - Mock: xoá document khỏi list mock
 * - Real: gọi BE /api/save-lists/{id}/documents/{docId}
 */
async function handleDELETE(
  _req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { id, docId } = ctx.params;
  if (!id || !docId) {
    return jsonResponse(
      { message: "Missing path param id or docId" },
      { status: 400 },
    );
  }

  if (USE_MOCK) {
    const ok = await mockRemoveDocFromSaveList(String(id), String(docId));
    return new Response(null, { status: ok ? 204 : 404 });
  }

  try {
    const authHeader = await getAuthHeader("save-lists-remove-doc");

    const fh = new Headers();
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(
      `${BE_BASE}/api/save-lists/${encodeURIComponent(
        id,
      )}/documents/${encodeURIComponent(docId)}`,
      {
        method: "DELETE",
        headers: fh,
        cache: "no-store",
      },
    );

    return new Response(null, {
      status: upstream.status,
      headers: {
        "x-mode": "real",
      },
    });
  } catch (e: any) {
    return jsonResponse(
      {
        message: "Remove document from save list failed",
        error: String(e),
      },
      { status: 502 },
    );
  }
}

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/save-lists/[id]/documents/[docId]/route.ts/DELETE",
  });
