import { mockLibraryDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: documentId } = await params;

  // Read request body once
  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

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
  fh.set("Content-Type", "application/json");

  // First, fetch document detail to get current isPremium value
  const detailUrl = `${BE_BASE}/api/documents/${documentId}`;
  let currentIsPremium = false;
  try {
    const detailResponse = await fetch(detailUrl, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      currentIsPremium = detailData?.isPremium ?? false;
    }
  } catch (error) {
    console.error("Failed to fetch document detail for isPremium:", error);
    // Continue with default false
  }

  // Fetch tags to get tag codes from tag IDs
  let tagCodes: number[] = [];
  if (body.tagIds && Array.isArray(body.tagIds) && body.tagIds.length > 0) {
    try {
      const tagsResponse = await fetch(`${BE_BASE}/api/tags/all`, {
        method: "GET",
        headers: fh,
        cache: "no-store",
      });
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        const tags = Array.isArray(tagsData) ? tagsData : tagsData?.data || [];
        // Map tag IDs to tag codes - only include tags that exist and have ACTIVE status
        tagCodes = body.tagIds
          .map((tagId: string) => {
            const tag = tags.find((t: any) => t.id === tagId);
            // Only include tags that exist, have a code, and are ACTIVE
            if (tag && tag.code && tag.status === "ACTIVE") {
              return Number(tag.code);
            }
            if (tag && !tag.code) {
              console.warn(`Tag ${tagId} found but missing code property`);
            }
            if (tag && tag.status !== "ACTIVE") {
              console.warn(
                `Tag ${tagId} is not ACTIVE (status: ${tag.status}), skipping`,
              );
            }
            if (!tag) {
              console.warn(`Tag ${tagId} not found in tags list`);
            }
            return null;
          })
          .filter((code: number | null): code is number => code !== null);
      }
    } catch (error) {
      console.error("Failed to fetch tags for tagCodes:", error);
    }
  }

  // Transform frontend request to backend format
  const backendRequest = {
    title: body.title,
    description: body.description,
    visibility: body.visibility,
    isPremium: currentIsPremium, // Use current value from document
    docTypeId: body.typeId, // Map typeId to docTypeId
    specializationId: body.specializationId,
    organizationId: body.organizationId || null,
    tagCodes: tagCodes.length > 0 ? tagCodes : null,
    newTags: body.newTags || null,
  };

  const url = `${BE_BASE}/api/documents/${documentId}`;

  // Stringify transformed body for fetch
  const bodyString = JSON.stringify(backendRequest);

  const upstream = await fetch(url, {
    method: "PUT",
    headers: fh,
    body: bodyString,
    cache: "no-store",
  });

  // Backend returns ResponseEntity<DocumentUploadResponse> directly (not wrapped in ApiResponse)
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // Backend returns DocumentUploadResponse directly
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
  const url = `${BE_BASE}/api/documents/${documentId}`;

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
