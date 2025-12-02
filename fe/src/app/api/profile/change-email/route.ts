// app/api/profile/change-email/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body || !body.newEmail) {
    return badRequest("Missing required field: newEmail");
  }

  if (USE_MOCK) {
    return jsonResponse(
      { message: "OTP has been sent to your current email address" },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("change-email");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/user/change-email`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify({ newEmail: body.newEmail }),
    cache: "no-store",
  });

  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    data = json.data || json;
  } catch {
    // Backend returns plain text message
    data = { message: text || "OTP has been sent to your current email address" };
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/profile/change-email/route.ts/POST",
  });
