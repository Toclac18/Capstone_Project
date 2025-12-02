// app/api/profile/change-password/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handlePUT(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body || !body.currentPassword || !body.newPassword || !body.confirmPassword) {
    return badRequest("Missing required fields: currentPassword, newPassword, confirmPassword");
  }

  if (USE_MOCK) {
    return jsonResponse(
      { message: "Password changed successfully" },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("change-password");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/user/change-password`, {
    method: "PUT",
    headers: fh,
    body: JSON.stringify({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      confirmPassword: body.confirmPassword,
    }),
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
    data = { error: text || "Failed to change password" };
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/profile/change-password/route.ts/PUT",
  });
