// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export async function POST() {
  const cookieStore = await cookies();
  
  // Delete the access_token cookie
  cookieStore.delete(COOKIE_NAME);

  return Response.json({ success: true, message: "Logged out successfully" });
}
