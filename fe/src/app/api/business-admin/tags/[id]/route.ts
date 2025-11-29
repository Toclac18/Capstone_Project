import { mockTagsDB } from "@/mock/db.mock";
import type { UpdateTagRequest } from "@/types/document-tag";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    const body = (await request.json()) as UpdateTagRequest;
    try {
      const result = mockTagsDB.update(id, body);
      return jsonResponse(result, {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (error: any) {
      return jsonResponse({ message: error.message }, {
        status: 400,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
  }

  // Get authentication from cookie
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const url = `${BE_BASE}/api/admin/tags/${id}`;

  // Read and stringify request body to avoid duplex option error
  let body: string;
  try {
    const jsonBody = await request.json();
    body = JSON.stringify(jsonBody);
  } catch {
    body = JSON.stringify({});
  }

  const upstream = await fetch(url, {
    method: "PUT",
    headers: fh,
    body,
    cache: "no-store",
  });

  // Backend returns ApiResponse<TagResponse>, extract data
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const text = await upstream.text();
  try {
    const apiResponse = JSON.parse(text);
    const data = apiResponse.data || apiResponse;
    return jsonResponse(data, {
      status: upstream.status,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch {
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    try {
      mockTagsDB.delete(id);
      return new Response(
        JSON.stringify({ message: "Tag deleted successfully." }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-mode": "mock",
          },
        },
      );
    } catch (error: any) {
      return jsonResponse({ message: error.message }, {
        status: 400,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
  }

  // Get authentication from cookie
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const url = `${BE_BASE}/api/admin/tags/${id}`;

  const upstream = await fetch(url, {
    method: "DELETE",
    headers: fh,
    cache: "no-store",
  });

  // Backend returns ApiResponse<Void> for DELETE
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const text = await upstream.text();
  try {
    const apiResponse = JSON.parse(text);
    return jsonResponse(apiResponse.data || { message: apiResponse.message || "Tag deleted successfully" }, {
      status: upstream.status,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch {
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    try {
      const result = mockTagsDB.approve(id);
      return jsonResponse(result, {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (error: any) {
      return jsonResponse({ message: error.message }, {
        status: 400,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
  }

  // Get authentication from cookie
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  // Read request body once for review endpoint
  let requestBody: { approved?: boolean } = {};
  try {
    const bodyText = await request.text();
    if (bodyText) {
      requestBody = JSON.parse(bodyText);
    }
  } catch {
    // If body parsing fails, use default
  }
  
  const approved = requestBody.approved ?? true; // Default to approve if not specified

  const url = `${BE_BASE}/api/admin/tags/${id}/review`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: fh,
    body: JSON.stringify({ approved }),
    cache: "no-store",
  });

  // Backend returns ApiResponse<Void> for review
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const text = await upstream.text();
  try {
    const apiResponse = JSON.parse(text);
    return jsonResponse(apiResponse.data || { message: apiResponse.message || "Tag reviewed successfully" }, {
      status: upstream.status,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch {
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}