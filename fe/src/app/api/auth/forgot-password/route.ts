import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return badRequest("Invalid JSON");
  }

  // Determine which step based on request body
  const { email, otp, resetToken, newPassword } = body;

  // Step 1: Send OTP (only email provided, no other fields)
  if (email && !otp && !resetToken && !newPassword) {
    if (USE_MOCK) {
      return jsonResponse(
        {
          message: "If an account exists with this email, an OTP has been sent",
        },
        { status: 200, mode: "mock" },
      );
    }

    const upstream = await fetch(`${BE_BASE}/api/auth/forgot-password/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return jsonResponse(JSON.parse(text), { status: upstream.status });
    }

    const text = await upstream.text();
    const message =
      text.trim() ||
      "If an account exists with this email, an OTP has been sent";

    return jsonResponse({ message }, { status: upstream.status, mode: "real" });
  }

  // Step 2: Verify OTP (email and otp provided, no resetToken or newPassword)
  if (email && otp && !resetToken && !newPassword) {
    if (!/^\d{6}$/.test(otp)) {
      return badRequest("OTP must be 6 digits");
    }

    if (USE_MOCK) {
      return jsonResponse(
        { valid: true, resetToken: "mock-reset-token-12345" },
        { status: 200, mode: "mock" },
      );
    }

    const upstream = await fetch(`${BE_BASE}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return jsonResponse(
        { error: parseError(text, "Failed to verify OTP") },
        { status: upstream.status },
      );
    }

    const response = await upstream.json();
    // Backend returns: { success: true, data: { valid: boolean, resetToken: string }, timestamp: string }
    const data = response.data || response;
    return jsonResponse(
      { valid: data.valid, resetToken: data.resetToken },
      { status: upstream.status, mode: "real" },
    );
  }

  // Step 3: Reset password (resetToken and newPassword provided, no email or otp)
  if (resetToken && newPassword && !email && !otp) {
    if (newPassword.length < 8) {
      return badRequest("Password must be at least 8 characters");
    }

    if (USE_MOCK) {
      return jsonResponse(
        {
          message:
            "Password reset successfully. You can now login with your new password",
        },
        { status: 200, mode: "mock" },
      );
    }

    const upstream = await fetch(`${BE_BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, newPassword }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return jsonResponse(
        { error: parseError(text, "Failed to reset password") },
        { status: upstream.status },
      );
    }

    const text = await upstream.text();
    const message =
      text.trim() ||
      "Password reset successfully. You can now login with your new password";

    return jsonResponse({ message }, { status: upstream.status, mode: "real" });
  }

  // Invalid request
  return badRequest(
    "Invalid request. Please provide the required fields for the step you want to perform.",
  );
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/forgot-password/route.ts/POST",
  });
