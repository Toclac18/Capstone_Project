// app/api/profile/delete-account/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handleDELETE(req: Request) {
  if (USE_MOCK) {
    return jsonResponse(
      { message: "Account deleted successfully" },
      { status: 200, mode: "mock" },
    );
  }

  // Parse request body to get password
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }

  if (!body.password || typeof body.password !== "string") {
    return badRequest("Password is required");
  }

  const authHeader = await getAuthHeader("delete-account");

  const fh = new Headers();
  fh.set("Content-Type", "application/json");
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/user/account`, {
    method: "DELETE",
    headers: fh,
    body: JSON.stringify({ password: body.password }),
    cache: "no-store",
  });

  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  const text = await upstream.text();
  let errorData;
  try {
    const json = JSON.parse(text);
    // Backend returns { success: false, message: "...", data: { errorCode: "..." }, timestamp: "..." }
    // Extract message from response
    const errorMessage = json.message || json.error || "Failed to delete account";
    errorData = {
      error: errorMessage,
      message: errorMessage,
    };
  } catch {
    errorData = {
      error: text || "Failed to delete account",
      message: text || "Failed to delete account",
    };
  }

  return jsonResponse(errorData, { status: upstream.status, mode: "real" });
}

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/profile/delete-account/route.ts/DELETE",
  });
