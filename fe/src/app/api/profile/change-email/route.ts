// app/api/profile/change-email/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body || !body.password || !body.newEmail) {
    return badRequest("Missing required fields: password, newEmail");
  }

  if (USE_MOCK) {
    return jsonResponse(
      { message: "OTP has been sent to your new email address" },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("change-email");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/user/change-email`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify({ password: body.password, newEmail: body.newEmail }),
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
        message: text || "OTP has been sent to your new email address",
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
    data = { message: json.message || json.error || text || "Failed to change email" };
  } catch {
    data = { message: text || "Failed to change email" };
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/profile/change-email/route.ts/POST",
  });
