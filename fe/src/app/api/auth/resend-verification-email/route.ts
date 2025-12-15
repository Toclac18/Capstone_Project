import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return badRequest("Invalid JSON");
  }

  const { email } = body;
  if (!email) {
    return badRequest("Email is required");
  }

  if (USE_MOCK) {
    return jsonResponse(
      { message: "Verification email has been resent" },
      { status: 200, mode: "mock" },
    );
  }

  const upstream = await fetch(
    `${BE_BASE}/api/auth/resend-verification-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(JSON.parse(text), { status: upstream.status });
  }

  // Backend returns ResponseEntity<Void> (204 No Content) or 200 OK
  const message =
    upstream.status === 204
      ? "Verification email has been resent"
      : "Verification email has been resent";

  return jsonResponse({ message }, { status: 200, mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/resend-verification-email/route.ts/POST",
  });
