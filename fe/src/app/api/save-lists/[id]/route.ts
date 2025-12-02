// app/api/save-lists/[id]/route.ts

import { NextRequest } from "next/server";
import {
  mockDeleteSaveList,
  mockGetSaveListDetail,
} from "@/mock/save-list.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

type RouteContext = { params: { id: string } };

/**
 * GET /api/save-lists/:id
 * - Mock: trả detail mock
 * - Real: gọi BE /api/save-lists/{id}, unwrap .data
 */
async function handleGET(
  _req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { id } = ctx.params;
  if (!id) {
    return jsonResponse({ message: "Missing path param id" }, { status: 400 });
  }

  if (USE_MOCK) {
    const detail = await mockGetSaveListDetail(id);
    if (!detail) {
      return new Response("Not found", { status: 404 });
    }
    return jsonResponse(detail, { status: 200, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader("save-lists-detail");

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(
      `${BE_BASE}/api/save-lists/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: fh,
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
        message: "Save list detail fetch failed",
        error: String(e),
      },
      { status: 502 },
    );
  }
}

/**
 * DELETE /api/save-lists/:id
 * - Mock: xoá mock
 * - Real: gọi BE /api/save-lists/{id}
 */
async function handleDELETE(
  _req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { id } = ctx.params;
  if (!id) {
    return jsonResponse({ message: "Missing path param id" }, { status: 400 });
  }

  if (USE_MOCK) {
    const ok = await mockDeleteSaveList(id);
    return new Response(null, { status: ok ? 204 : 404 });
  }

  try {
    const authHeader = await getAuthHeader("save-lists-delete");

    const fh = new Headers();
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(
      `${BE_BASE}/api/save-lists/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: fh,
        cache: "no-store",
      },
    );

    // BE trả 204 No Content
    return new Response(null, {
      status: upstream.status,
      headers: {
        "x-mode": "real",
      },
    });
  } catch (e: any) {
    return jsonResponse(
      {
        message: "Save list delete failed",
        error: String(e),
      },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/save-lists/[id]/route.ts/GET",
  });

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/save-lists/[id]/route.ts/DELETE",
  });
