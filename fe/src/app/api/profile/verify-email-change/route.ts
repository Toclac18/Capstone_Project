// app/api/profile/verify-email-change/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body || !body.otp) {
    return badRequest("Missing required field: otp");
  }

  if (USE_MOCK) {
    return jsonResponse(
      { message: "Email changed successfully. Please login again with your new email" },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("verify-email-change");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/user/verify-email-change`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify({ otp: body.otp }),
    cache: "no-store",
  });

  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    data = json.data || json;
  } catch {
    // Backend returns plain text message
    data = { message: text || "Email changed successfully. Please login again with your new email" };
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/profile/verify-email-change/route.ts/POST",
  });

