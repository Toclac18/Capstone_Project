// app/api/profile/delete-account/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handleDELETE() {
  if (USE_MOCK) {
    return jsonResponse(
      { message: "Account deleted successfully" },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("delete-account");

  const fh = new Headers();
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/user/account`, {
    method: "DELETE",
    headers: fh,
    cache: "no-store",
  });

  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    data = json.data || json;
  } catch {
    data = { error: text || "Failed to delete account" };
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/profile/delete-account/route.ts/DELETE",
  });
