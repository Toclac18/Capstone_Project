// app/api/org-admin/profile/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handleGET() {
  if (USE_MOCK) {
    // Mock data for organization profile
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
        orgLogo: null,
        orgAddress: "123 Main Street, City, Country",
        orgRegistrationNumber: "REG-123456",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("organization-profile");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

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

async function handlePUT(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return jsonResponse(
      { error: "Invalid JSON" },
      { status: 400, mode: "real" },
    );
  }

  if (USE_MOCK) {
    return jsonResponse(
      {
        userId: "mock-org-admin-id",
        email: "admin@organization.com",
        fullName: body.fullName || "Admin User",
        avatarUrl: null,
        point: 0,
        status: "ACTIVE",
        orgName: body.name || "Tech Organization",
        orgType: body.type || "COMPANY",
        orgEmail: body.email || "contact@organization.com",
        orgHotline: body.hotline || "+84 123 456 789",
        orgLogo: null,
        orgAddress: body.address || "123 Main Street, City, Country",
        orgRegistrationNumber: body.registrationNumber || "REG-123456",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("organization-profile");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/organization/profile`, {
    method: "PUT",
    headers: fh,
    body: JSON.stringify(body),
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

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/org-admin/profile/route.ts/GET",
  });

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/org-admin/profile/route.ts/PUT",
  });
