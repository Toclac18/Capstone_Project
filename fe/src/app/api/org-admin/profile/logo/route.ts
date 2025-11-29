// app/api/org-admin/profile/logo/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handlePOST(req: Request) {
  if (USE_MOCK) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return jsonResponse({ error: "File is required" }, { status: 400, mode: "mock" });
    }

    // Mock response
    return jsonResponse(
      {
        userId: "mock-org-admin-id",
        email: "admin@organization.com",
        fullName: "Admin User",
        avatarUrl: null,
        point: 0,
        status: "ACTIVE",
        orgName: "Tech Organization",
        orgType: "COMPANY",
        orgEmail: "contact@organization.com",
        orgHotline: "+84 123 456 789",
        orgLogo: URL.createObjectURL(file),
        orgAddress: "123 Main Street, City, Country",
        orgRegistrationNumber: "REG-123456",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("organization-logo");
  const formData = await req.formData();

  const fh = new Headers();
  if (authHeader) fh.set("Authorization", authHeader);

  // Forward FormData to backend
  const upstream = await fetch(`${BE_BASE}/api/organization/profile/logo`, {
    method: "POST",
    headers: fh,
    body: formData,
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

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/org-admin/profile/logo/route.ts/POST",
  });

