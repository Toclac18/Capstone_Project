// app/api/save-lists/route.ts

import { NextRequest } from "next/server";
import { mockCreateSaveList, mockGetSaveLists } from "@/mock/save-list.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

/**
 * GET /api/save-lists
 * - Mock: trả về danh sách SaveList mock
 * - Real: call BE /api/save-lists, unwrap .data
 */
async function handleGET(_req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    const data = await mockGetSaveLists();
    return jsonResponse(data, { status: 200, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader("save-lists-list");

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/save-lists`, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    const payload = (raw as any)?.data ?? raw;

    return jsonResponse(payload, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      {
        message: "Save list fetch failed",
        error: String(e),
      },
      { status: 502 },
    );
  }
}

/**
 * POST /api/save-lists
 * body: { name: string; documentId?: string }
 * - Mock: tạo SaveList mock
 * - Real: call BE /api/save-lists, unwrap .data
 */
async function handlePOST(req: NextRequest): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { name, documentId } = body || {};
  if (!name || String(name).trim() === "") {
    return jsonResponse(
      { message: 'Field "name" is required' },
      { status: 400 },
    );
  }

  if (USE_MOCK) {
    const created = await mockCreateSaveList(String(name), documentId);
    return jsonResponse(created, { status: 201, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader("save-lists-create");

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstreamBody: any = { name: String(name) };
    if (documentId) upstreamBody.documentId = String(documentId);

    const upstream = await fetch(`${BE_BASE}/api/save-lists`, {
      method: "POST",
      headers: fh,
      body: JSON.stringify(upstreamBody),
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    const payload = (raw as any)?.data ?? raw;

    return jsonResponse(payload, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      {
        message: "Save list create failed",
        error: String(e),
      },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/save-lists/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/save-lists/route.ts/POST",
  });
