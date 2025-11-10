// app/api/documents/route.ts
import { cookies } from "next/headers";

const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

async function getAuthHeader(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (process.env.NODE_ENV === "development") {
    console.log(`[documents] Cookie name: ${COOKIE_NAME}`);
    console.log(`[documents] Token found: ${token ? "YES" : "NO"}`);
    if (token) {
      console.log(`[documents] Token length: ${token.length}`);
    }
  }
  return token ? `Bearer ${token}` : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return Response.json({ error: "Document ID is required" }, { status: 400 });
  }

  const authHeader = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/documents/${id}`, {
    method: "GET",
    headers: fh,
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const authHeader = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/documents`, {
    method: "POST",
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

