// src/app/api/save-lists/[id]/documents/route.ts
import { mockAddDocToSaveList } from "@/mock/save-list.mock";
import { proxyJsonResponse, jsonResponse, badRequest } from "@/server/response";
import { getAuthHeader } from "@/server/auth";
import { BE_BASE, USE_MOCK } from "@/server/config";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

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
