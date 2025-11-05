// app/api/organizations/[id]/status/route.ts
import { cookies } from "next/headers";

const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

async function getAuthHeader(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? `Bearer ${token}` : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status) {
    return Response.json({ error: "Status is required" }, { status: 400 });
  }

  const authHeader = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/organizations/${id}/status`, {
    method: "PATCH",
    headers: fh,
    body: JSON.stringify(body),
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
    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Failed to process response" },
      { status: 500 }
    );
  }
}

function parseError(text: string): string {
  try {
    const json = JSON.parse(text);
    return json?.error || json?.message || "Request failed";
  } catch {
    return text || "Request failed";
  }
}

