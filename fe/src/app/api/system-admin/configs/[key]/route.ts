// app/api/system-admin/configs/[key]/route.ts
import { NextRequest } from "next/server";
import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handlePUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<Response> {
  const { key } = await params;
  const body = await req.json().catch(() => null);

  if (!body || !body.configValue) {
    return jsonResponse({ error: "configValue is required" }, { status: 400 });
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/system-admin/configs/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: fh,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "Failed to update config");
      return jsonResponse(
        { error: errorText },
        { status: upstream.status, mode: "real" }
      );
    }

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw?.data ?? raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Config update failed", error: String(e) },
      { status: 502 }
    );
  }
}

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/system-admin/configs/[key]/route.ts/PUT",
  });

