import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return badRequest("Invalid JSON");
  }

  const { email, otp, newPassword } = body;
  if (!email || !otp || !newPassword) {
    return badRequest("Email, OTP, and new password are required");
  }

  if (USE_MOCK) {
    return jsonResponse(
      { message: "Password reset successfully. You can now login with your new password" },
      { status: 200, mode: "mock" }
    );
  }

  const upstream = await fetch(`${BE_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(
      { error: parseError(text, "Failed to reset password") },
      { status: upstream.status }
    );
  }

  // Backend returns ResponseEntity<String> which might be plain text or wrapped in ApiResponse
  const text = await upstream.text();
  let message = "Password reset successfully. You can now login with your new password";

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
    context: "api/auth/reset-password/route.ts/POST",
  });

