// src/app/api/save-lists/route.ts
import { headers } from "next/headers";
import { getAuthHeader } from "@/server/auth";
import {
  mockCreateSaveListAndAddDoc,
  mockFetchSaveLists,
} from "@/mock/save-list.mock";

// Cấu trúc giống contact-admin/route.ts
const DEFAULT_BE_BASE = "http://localhost:8081";

function badRequest(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * GET /api/save-lists?readerId=...
 * - Mock: lấy danh sách savelist từ mock
 * - Real: forward sang {BE_BASE}/api/save-lists
 */
export async function GET(req: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const url = new URL(req.url);
  const readerId = url.searchParams.get("readerId");

  if (!readerId) {
    return badRequest('Missing query param "readerId"');
  }

  // ---- MOCK MODE ----
  if (USE_MOCK) {
    const items = mockFetchSaveLists(readerId);

    return new Response(JSON.stringify({ saveLists: items }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // ---- REAL MODE ----
  const h = await headers();
  const jwtAuth = (await getAuthHeader("api/save-lists/route.ts")) || "";
  const authHeader = jwtAuth || h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);
  if (ip) fh.set("X-Forwarded-For", ip || "");

  const upstream = await fetch(
    `${BE_BASE}/api/save-lists?readerId=${encodeURIComponent(readerId)}`,
    {
      method: "GET",
      headers: fh,
      cache: "no-store",
    },
  );

  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

/**
 * POST /api/save-lists
 * body: { readerId: string; name: string; documentId: string }
 * - Mock: tạo savelist mới + add doc vào (mockCreateSaveListAndAddDoc)
 * - Real: forward sang {BE_BASE}/api/save-lists
 */
export async function POST(req: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

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

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // ---- REAL MODE ----
  const h = await headers();
  const jwtAuth = (await getAuthHeader("api/save-lists/route.ts")) || "";
  const authHeader = jwtAuth || h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);
  if (ip) fh.set("X-Forwarded-For", ip || "");

  const upstream = await fetch(`${BE_BASE}/api/save-lists`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}
