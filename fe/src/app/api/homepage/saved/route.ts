import { NextResponse } from "next/server";
import { USE_MOCK, BE_BASE, proxyGetJson, proxyPostJson } from "../_shared";
import { mockSavedDocumentIds } from "@/mock/homepage.mock";

// Bộ nhớ tạm cho mock
let memorySaved = new Set<string>(mockSavedDocumentIds);

export async function GET() {
  if (USE_MOCK) {
    return NextResponse.json(
      { ids: Array.from(memorySaved) },
      {
        headers: { "x-mode": "mock" },
      },
    );
  }
  const url = new URL(`${BE_BASE}/api/homepage/saved`);
  return proxyGetJson(url);
}

/**
 * body: { docId: string; saved: boolean }
 * - mock: cập nhật memorySaved
 * - real: proxy sang BE
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    docId?: string;
    saved?: boolean;
  };

  if (USE_MOCK) {
    const docId = String(body?.docId || "").trim();
    const saved = Boolean(body?.saved);
    if (!docId) {
      return NextResponse.json(
        { message: "docId is required" },
        { status: 400 },
      );
    }
    if (saved) memorySaved.add(docId);
    else memorySaved.delete(docId);

    return NextResponse.json(
      { ids: Array.from(memorySaved), affected: docId, saved },
      { headers: { "x-mode": "mock" } },
    );
  }

  const url = new URL(`${BE_BASE}/api/homepage/saved`);
  return proxyPostJson(url, body);
}
