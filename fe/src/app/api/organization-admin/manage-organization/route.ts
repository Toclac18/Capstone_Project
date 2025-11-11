import { headers } from "next/headers";
import { mockOrganizationAdminDB } from "@/mock/db";

const DEFAULT_BE_BASE = "http://localhost:8080";

// Helper function to create forward headers
async function createForwardHeaders(): Promise<Headers> {
  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers();
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);
  return fh;
}

// Helper function to forward request to backend
async function forwardRequest(
  url: string,
  method: string,
  headers: Headers,
  body?: FormData | string
) {
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_BE_BASE;

  const upstream = await fetch(`${BE_BASE}${url}`, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET() {
  const USE_MOCK = process.env.USE_MOCK === "true";

  if (USE_MOCK) {
    const orgInfo = mockOrganizationAdminDB.get();
    return new Response(JSON.stringify(orgInfo), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const fh = await createForwardHeaders();
  fh.set("Content-Type", "application/json");

  return forwardRequest(
    "/api/organization-admin/manage-organization",
    "GET",
    fh
  );
}

export async function PUT(request: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";

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
    return new Response(JSON.stringify(updated), {
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
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }
  }

  return forwardRequest(
    "/api/organization-admin/manage-organization",
    "PUT",
    fh,
    body
  );
}

export async function DELETE() {
  const USE_MOCK = process.env.USE_MOCK === "true";

  if (USE_MOCK) {
    mockOrganizationAdminDB.delete();
    return new Response(
      JSON.stringify({ message: "Organization deleted successfully" }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      }
    );
  }

  const fh = await createForwardHeaders();
  fh.set("Content-Type", "application/json");

  return forwardRequest(
    "/api/organization-admin/manage-organization",
    "DELETE",
    fh
  );
}

