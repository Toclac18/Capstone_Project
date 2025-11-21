
import { mockLibraryDB } from "@/mock/db";
import { BE_BASE, COOKIE_NAME, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
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

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
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

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/reader/library/[id]/route.ts/PUT",
  });

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/reader/library/[id]/route.ts/DELETE",
  });
