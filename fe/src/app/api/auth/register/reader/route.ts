import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return badRequest("Invalid JSON");
  }

  // Validate required fields for Reader (matching backend RegisterReaderRequest)
  const { email, password, fullName, dateOfBirth } = body;
  if (!email || !password || !fullName || !dateOfBirth) {
    return badRequest("Missing required fields: email, password, fullName, dateOfBirth");
  }

  if (USE_MOCK) {
    const mockResponse = {
      userId: `user-${Date.now()}`,
      email,
      fullName,
      role: "READER",
      status: "PENDING_EMAIL_VERIFY",
      accessToken: null,
      tokenType: "Bearer",
    };
    return jsonResponse(mockResponse, { status: 201, mode: "mock" });
  }

  // Proxy to BE
  const upstream = await fetch(`${BE_BASE}/api/auth/register/reader`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName, dateOfBirth }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(
      { error: parseError(text, "Registration failed") },
      { status: upstream.status }
    );
  }

  // Parse response from backend
  let responseData: any;
  try {
    const text = await upstream.text();
    responseData = JSON.parse(text);
  } catch {
    return jsonResponse(
      { error: "Failed to parse backend response" },
      { status: 500 }
    );
  }

  // Backend may return { data: AuthResponse } or AuthResponse directly
  const authResponse = responseData?.data || responseData;
  
  return jsonResponse(authResponse, { 
    status: upstream.status,
    mode: "real" 
  });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/register/reader/route.ts/POST",
  });
