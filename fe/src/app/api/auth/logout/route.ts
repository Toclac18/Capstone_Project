// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePOST() {
  const cookieStore = await cookies();
  
  // Delete the access_token cookie
  cookieStore.delete(COOKIE_NAME);

  return Response.json({ success: true, message: "Logged out successfully" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/logout/route.ts/POST",
  });
