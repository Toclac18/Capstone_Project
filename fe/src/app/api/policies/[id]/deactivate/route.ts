// app/api/policies/[id]/deactivate/route.ts
import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (USE_MOCK) {
    return jsonResponse(
      { data: { id, isActive: false } },
      { status: 200, mode: "mock" },
    );
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies/${id}/deactivate`, {
      method: "PATCH",
      headers: fh,
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw?.data ?? raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Policy deactivation failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const PATCH = (...args: Parameters<typeof handlePATCH>) =>
  withErrorBoundary(() => handlePATCH(...args), {
    context: "api/policies/[id]/deactivate/route.ts/PATCH",
  });

