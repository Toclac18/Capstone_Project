import { cookies } from "next/headers";
import { mockLibraryDB } from "@/mock/db";

const DEFAULT_BE_BASE = "http://localhost:8080";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const { id: documentId } = await params;
  const body = await request.json();

  if (USE_MOCK) {
    try {
      const result = mockLibraryDB.updateDocument(documentId, body);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to update document";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    }
  }

  // Get authentication from cookie
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  const fh = new Headers();
  fh.set("Content-Type", "application/json");
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const url = `${BE_BASE}/api/reader/library/${documentId}`;

  const upstream = await fetch(url, {
    method: "PUT",
    headers: fh,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const { id: documentId } = await params;

  if (USE_MOCK) {
    try {
      const result = mockLibraryDB.deleteDocument(documentId);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to delete document";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    }
  }

  // Get authentication from cookie
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  const fh = new Headers();
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const url = `${BE_BASE}/api/reader/library/${documentId}`;

  const upstream = await fetch(url, {
    method: "DELETE",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

