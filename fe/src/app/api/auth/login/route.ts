// app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { BE_BASE, COOKIE_NAME } from "@/server/config";
import { parseError } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, role, remember } = body;
  if (!email || !password || !role) {
    return Response.json(
      { error: "Email, password and role are required" },
      { status: 400 },
    );
  }

  const url = `${BE_BASE}/api/auth/login`;
  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
    cache: "no-store",
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    return Response.json(
      { error: parseError(text, "Login failed") },
      { status: upstream.status },
    );
  }

  let responseJson: any;
  try {
    responseJson = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Failed to parse backend response" },
      { status: 500 },
    );
  }

  const token = responseJson?.token;
  if (!token) {
    return Response.json(
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

  return Response.json({ success: true, role });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/login/route.ts/POST",
  });
