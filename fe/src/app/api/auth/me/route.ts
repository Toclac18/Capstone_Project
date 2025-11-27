// app/api/auth/me/route.ts

import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/server/config";
import {
  decodeJwtPayload,
  extractReaderId,
  extractEmail,
  extractRole,
} from "@/utils/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value || null;

  if (!rawToken) {
    return Response.json(
      {
        isAuthenticated: false,
        readerId: null,
        email: null,
        role: null,
      },
      { status: 200 },
    );
  }

  const payload = decodeJwtPayload(rawToken);
  if (!payload) {
    return Response.json(
      {
        isAuthenticated: false,
        readerId: null,
        email: null,
        role: null,
      },
      { status: 200 },
    );
  }

  const readerId = extractReaderId(payload);
  const email = extractEmail(payload);
  const role = extractRole(payload);

  return Response.json(
    {
      isAuthenticated: !!readerId,
      readerId,
      email,
      role,
    },
    { status: 200 },
  );
}
