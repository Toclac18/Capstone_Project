import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return badRequest("Invalid JSON");
  }

  const { token } = body;
  if (!token) {
    return badRequest("Token is required");
  }

  if (USE_MOCK) {
    // Mock verification - always success
    const mockResponse = {
      userId: `user-${Date.now()}`,
      email: "mock@example.com",
      fullName: "Mock User",
      role: "READER",
      status: "ACTIVE",
      accessToken: "mock-token",
      tokenType: "Bearer",
    };
    return jsonResponse(mockResponse, { status: 200, mode: "mock" });
  }

  // Backend expects POST
  const upstream = await fetch(`${BE_BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(JSON.parse(text), { status: upstream.status });
  }

  // Parse response from backend (returns AuthResponse)
  let responseData: any;
  try {
    const text = await upstream.text();
    responseData = JSON.parse(text);
  } catch {
    return jsonResponse(
      { error: "Failed to parse backend response" },
      { status: 500 },
    );
  }

  // Backend may return { data: AuthResponse } or AuthResponse directly
  const authResponse = responseData?.data || responseData;

  return jsonResponse(authResponse, {
    status: upstream.status,
    mode: "real",
  });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/verify-email/route.ts/POST",
  });
