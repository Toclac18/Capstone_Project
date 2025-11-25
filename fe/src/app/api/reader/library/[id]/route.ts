import { mockLibraryDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: documentId } = await params;
  const body = await request.json();

  if (USE_MOCK) {
    try {
      const result = mockLibraryDB.updateDocument(documentId, body);
      return jsonResponse(result, {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to update document";
      return jsonResponse(
        { error: message },
        {
          status: 400,
          headers: {
            "content-type": "application/json",
            "x-mode": "mock",
          },
        },
      );
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

  return proxyJsonResponse(upstream, { mode: "real" });
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: documentId } = await params;

  if (USE_MOCK) {
    try {
      const result = mockLibraryDB.deleteDocument(documentId);
      return jsonResponse(result, {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to delete document";
      return jsonResponse(
        { error: message },
        {
          status: 400,
          headers: {
            "content-type": "application/json",
            "x-mode": "mock",
          },
        },
      );
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

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/reader/library/[id]/route.ts/PUT",
  });

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/reader/library/[id]/route.ts/DELETE",
  });
