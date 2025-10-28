// src/app/api/auth/login/route.ts
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
const JWT_SECRET = process.env.JWT_SECRET!;
const encoder = new TextEncoder();

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    userId = "u_1",
    email = "john@example.com",
    name = "John Doe",
    role = "user",
  } = body;

  if (!JWT_SECRET) {
    return new Response(
      JSON.stringify({ error: "Server missing JWT_SECRET" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const token = await new SignJWT({ sub: userId, email, name, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("readee-fe-mock")
    .setAudience("readee-users")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encoder.encode(JWT_SECRET));

  const isProd = process.env.NODE_ENV === "production";
  (await cookies()).set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return new Response(
    JSON.stringify({ ok: true, user: { userId, email, name, role } }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}
