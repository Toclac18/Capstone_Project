// app/api/system-admin/configs/route.ts
import { NextRequest } from "next/server";
import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(_req: NextRequest): Promise<Response> {
  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/system-admin/configs`, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    if (!upstream.ok) {
      const errorText = await upstream
        .text()
        .catch(() => "Failed to fetch configs");
      return jsonResponse(
        { error: errorText },
        { status: upstream.status, mode: "real" },
      );
    }

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Configs fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/system-admin/configs/route.ts/GET",
  });
