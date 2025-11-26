import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

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
      { message: "OTP has been sent to your email address" },
      { status: 200, mode: "mock" }
    );
  }

  const upstream = await fetch(`${BE_BASE}/api/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(
      { error: parseError(text, "Failed to request password reset") },
      { status: upstream.status }
    );
  }

  // Backend returns ResponseEntity<String> which might be plain text or wrapped in ApiResponse
  const text = await upstream.text();
  let message = "OTP has been sent to your email address";

  // Try to parse as JSON first, fallback to plain text
  try {
    const json = JSON.parse(text);
    message = json?.data || json?.message || message;
  } catch {
    // Plain text response
    message = text || message;
  }

  return jsonResponse(
    { message },
    { status: upstream.status, mode: "real" }
  );
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/request-password-reset/route.ts/POST",
  });

