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
 * GET /api/save-lists?readerId=...
 * - Mock: lấy danh sách savelist từ mock
 * - Real: forward sang {BE_BASE}/api/save-lists
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const readerId = url.searchParams.get("id");

  if (!readerId) {
    return badRequest("Missing query param");
  }

  // ---- MOCK MODE ----
  if (USE_MOCK) {
    const items = mockFetchSaveLists(readerId);

    return jsonResponse(
      { saveLists: items },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  // ---- REAL MODE ----
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(
    `${BE_BASE}/api/save-lists?id=${encodeURIComponent(readerId)}`,
    {
      method: "GET",
      headers: fh,
      cache: "no-store",
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}

/**
 * POST /api/save-lists
 * body: { readerId: string; name: string; documentId: string }
 * - Mock: tạo savelist mới + add doc vào (mockCreateSaveListAndAddDoc)
 * - Real: forward sang {BE_BASE}/api/save-lists
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { readerId, name, documentId } = body || {};
  if (!readerId || !name || String(name).trim() === "" || !documentId) {
    return badRequest('Fields "readerId", "name", "documentId" are required');
  }

  // ---- MOCK MODE ----
  if (USE_MOCK) {
    const created = mockCreateSaveListAndAddDoc({
      readerId: String(readerId),
      name: String(name),
      documentId: String(documentId),
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
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}
