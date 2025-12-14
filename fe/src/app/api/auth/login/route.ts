// app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { BE_BASE, COOKIE_NAME } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return badRequest("Invalid JSON");
  }

  const { email, password, remember, role } = body;
  if (!email || !password || !role) {
    return badRequest("Email, password and role are required");
  }

  const url = `${BE_BASE}/api/auth/login`;
  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(
      { error: parseError(text, "Login failed") },
      { status: upstream.status },
    );
  }

  // Parse response from backend
  let responseJson: any;
  try {
    const text = await upstream.text();
    responseJson = JSON.parse(text);
  } catch {
    return jsonResponse(
      { error: "Failed to parse backend response" },
      { status: 500 },
    );
  }

  // Backend may return { data: AuthResponse } or AuthResponse directly
  const authResponse = responseJson?.data || responseJson;
  const token = authResponse?.accessToken;

  if (!token) {
    return jsonResponse(
      { error: "No token received from backend" },
      { status: 500 },
    );
  }

  // Write JWT cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? 2592000 : 28800,
  });

  return jsonResponse({
    success: true,
    role: role || authResponse?.role,
    userId: authResponse?.userId,
    email: authResponse?.email,
    fullName: authResponse?.fullName,
    status: authResponse?.status,
  });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/login/route.ts/POST",
  });
