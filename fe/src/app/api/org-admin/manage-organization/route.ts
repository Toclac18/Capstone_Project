import { headers } from "next/headers";
import { mockOrganizationAdminDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";

// Helper function to create forward headers
async function createForwardHeaders(): Promise<Headers> {
  const incomingHeaders = await headers();

  const authHeader = (await getAuthHeader("forwarding")) || "";

  const cookieHeader = incomingHeaders.get("cookie") || "";

  const forwardHeaders = new Headers();

  if (authHeader) {
    forwardHeaders.set("Authorization", authHeader);
  }

  if (cookieHeader) {
    forwardHeaders.set("Cookie", cookieHeader);
  }

  return forwardHeaders;
}

async function handleGET() {
  if (USE_MOCK) {
    const orgInfo = mockOrganizationAdminDB.get();
    return jsonResponse(orgInfo, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const fh = await createForwardHeaders();
  fh.set("Content-Type", "application/json");

  const upstream = await fetch(`${BE_BASE}/api/organization/profile`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    // Extract data from { success, data, timestamp } format
    data = json.data || json;
  } catch {
    data = text;
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

async function handlePUT(request: Request) {
  if (USE_MOCK) {
    let body: any = {};

    try {
      // Try to parse as FormData first
      const formData = await request.formData();
      formData.forEach((value, key) => {
        if (key === "certificateUpload" && value instanceof File) {
          // For mock, we'll just store the file name
          body[key] = value.name;
        } else {
          body[key] = value.toString();
        }
      });
    } catch {
      // Fallback to JSON if FormData parsing fails
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    const updated = mockOrganizationAdminDB.update(body);
    return jsonResponse(updated, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const fh = await createForwardHeaders();

  // Check Content-Type to determine how to parse
  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  let body: FormData | string;

  if (isMultipart) {
    // Read FormData and create new one for forwarding
    const formData = await request.formData();
    const forwardFormData = new FormData();
    formData.forEach((value, key) => {
      forwardFormData.append(key, value);
    });
    body = forwardFormData;
    // Don't set Content-Type - fetch will set it with boundary automatically
  } else {
    // Handle JSON
    try {
      const jsonBody = await request.json();
      body = JSON.stringify(jsonBody);
      fh.set("Content-Type", "application/json");
    } catch {
      return jsonResponse(
        { error: "Invalid request body" },
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  const upstream = await fetch(`${BE_BASE}/api/organization/profile`, {
    method: "PUT",
    headers: fh,
    body,
    cache: "no-store",
  });

  // Return response directly from backend without parsing
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}

async function handleDELETE() {
  if (USE_MOCK) {
    mockOrganizationAdminDB.delete();
    return jsonResponse(
      { message: "Organization deleted successfully" },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("delete-account");

  const fh = new Headers();
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/user/account`, {
    method: "DELETE",
    headers: fh,
    cache: "no-store",
  });

  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    data = json.data || json;
  } catch {
    data = { error: text || "Failed to delete account" };
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/org-admin/manage-organization/route.ts/GET",
  });

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/org-admin/manage-organization/route.ts/PUT",
  });

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/org-admin/manage-organization/route.ts/DELETE",
  });
