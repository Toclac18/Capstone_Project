// src/app/api/save-lists/route.ts
import {
  mockCreateSaveListAndAddDoc,
  mockFetchSaveLists,
} from "@/mock/save-list.mock";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { badRequest } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

/**
 * GET /api/save-lists
 * - Mock: lấy danh sách savelist từ mock
 * - Real: forward sang {BE_BASE}/api/save-lists (backend lấy readerId từ auth token)
 */
export async function GET() {
  // ---- MOCK MODE ----
  if (USE_MOCK) {
    const items = mockFetchSaveLists("mock-reader-id");

    return jsonResponse(items, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // ---- REAL MODE ----
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/save-lists`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

/**
 * POST /api/save-lists
 * body: { name: string; documentId?: string }
 * - Mock: tạo savelist mới + add doc vào (mockCreateSaveListAndAddDoc)
 * - Real: forward sang {BE_BASE}/api/save-lists (backend lấy readerId từ auth token)
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { name } = body || {};
  if (!name || String(name).trim() === "") {
    return badRequest('Field "name" is required');
  }

  // ---- MOCK MODE ----
  if (USE_MOCK) {
    const created = mockCreateSaveListAndAddDoc({
      readerId: "mock-reader-id",
      name: String(name),
      documentId: body.documentId || "mock-doc-id",
    });

    return jsonResponse(created, {
      status: 201,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // ---- REAL MODE ----
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/save-lists`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify({ name, documentId: body.documentId }),
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}
