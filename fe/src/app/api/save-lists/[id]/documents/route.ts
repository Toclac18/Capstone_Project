// src/app/api/save-lists/[id]/documents/route.ts
import { headers } from "next/headers";
import { mockAddDocToSaveList } from "@/mock/saveListMock";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

const DEFAULT_BE_BASE = "http://localhost:8081";

function badRequest(msg: string, status = 400) {
  return jsonResponse({ error: msg }, {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const { id } = await ctx.params;
  if (!id) {
    return badRequest("Missing path param id");
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { readerId, documentId } = body || {};
  if (!readerId || !documentId) {
    return badRequest('Fields "readerId" and "documentId" are required');
  }

  // ---- MOCK MODE ----
  if (USE_MOCK) {
    const saved = mockAddDocToSaveList(String(id), {
      readerId: String(readerId),
      documentId: String(documentId),
    });

    if (!saved) {
      return badRequest("SaveList not found", 404);
    }

    return jsonResponse(saved, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // ---- REAL MODE ----
  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);
  if (ip) fh.set("X-Forwarded-For", ip || "");

  const upstream = await fetch(
    `${BE_BASE}/api/save-lists/${encodeURIComponent(id)}/documents`,
    {
      method: "POST",
      headers: fh,
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

    return proxyJsonResponse(upstream, { mode: "real" });
}