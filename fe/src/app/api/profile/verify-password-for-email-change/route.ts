// app/api/profile/verify-password-for-email-change/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body || !body.password) {
    return badRequest("Missing required field: password");
  }

  if (USE_MOCK) {
    return jsonResponse(
      { message: "Password verified" },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("verify-password-for-email-change");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/user/verify-password-for-email-change`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify({ password: body.password }),
    cache: "no-store",
  });

  if (upstream.status === 200) {
    const text = await upstream.text();
    let data;
    try {
      const json = JSON.parse(text);
      data = json.data || json;
    } catch {
      // Backend returns plain text message
      data = {
        message: text || "Password verified",
      };
    }
    return jsonResponse(data, { status: 200, mode: "real" });
  }

  // Handle error response
  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    // Backend returns { success: false, message: "...", data: {...} }
    data = { message: json.message || json.error || text || "Failed to verify password" };
  } catch {
    data = { message: text || "Failed to verify password" };
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/profile/verify-password-for-email-change/route.ts/POST",
  });

