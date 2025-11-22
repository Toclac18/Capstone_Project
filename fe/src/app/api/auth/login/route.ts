import { cookies } from "next/headers";

const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, role, remember } = body;
  if (!email || !password || !role) {
    return Response.json(
      { error: "Email, password and role are required" },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${BE_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
    cache: "no-store",
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return Response.json(
      { error: parseError(text) },
      { status: upstream.status }
    );
  }

  try {
    const response = JSON.parse(text);
    const loginData = response.data || response;

    if (!loginData.accessToken) {
      return Response.json(
        { error: "Invalid server response" },
        { status: 500 }
      );
    }

    await setCookie(loginData.accessToken, remember);
    return Response.json(loginData);
  } catch {
    return Response.json(
      { error: "Failed to process login" },
      { status: 500 }
    );
  }
}

async function setCookie(token: string, remember?: boolean) {
  if (!token) throw new Error("Token is required");

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? 2592000 : 28800, // 30d : 8h
  });
}

function parseError(text: string): string {
  try {
    const json = JSON.parse(text);
    return json?.detail || json?.message || "Login failed";
  } catch {
    return text || "Login failed";
  }
}
