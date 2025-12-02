// app/api/save-lists/[id]/documents/route.ts

import { NextRequest } from "next/server";
import { mockAddDocToSaveList } from "@/mock/save-list.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

type RouteContext = { params: { id: string } };

/**
 * POST /api/save-lists/:id/documents
 * body: { documentId }
 * - Mock: thêm document vào list mock
 * - Real: gọi BE /api/save-lists/{id}/documents, unwrap .data
 */
async function handlePOST(
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { id } = ctx.params;
  if (!id) {
    return jsonResponse({ message: "Missing path param id" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { documentId } = body || {};
  if (!documentId) {
    return jsonResponse(
      { message: 'Field "documentId" is required' },
      { status: 400 },
    );
  }

  if (USE_MOCK) {
    const updated = await mockAddDocToSaveList(String(id), String(documentId));
    if (!updated) {
      return new Response("Not found", { status: 404 });
    }
    return jsonResponse(updated, { status: 200, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader("save-lists-add-doc");

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(
      `${BE_BASE}/api/save-lists/${encodeURIComponent(id)}/documents`,
      {
        method: "POST",
        headers: fh,
        body: JSON.stringify({ documentId: String(documentId) }),
        cache: "no-store",
      },
    );

    const raw = await upstream.json().catch(() => ({}));
    const payload = (raw as any)?.data ?? raw;

    return jsonResponse(payload, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      {
        message: "Add document to save list failed",
        error: String(e),
      },
      { status: 502 },
    );
  }
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/save-lists/[id]/documents/route.ts/POST",
  });
