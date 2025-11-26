// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/server/config";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handlePOST() {
  const cookieStore = await cookies();

  // Delete the access token cookie by setting it with maxAge: 0
  cookieStore.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Immediately expire the cookie
  });

  return jsonResponse({ success: true, message: "Logged out successfully" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/logout/route.ts/POST",
  });
