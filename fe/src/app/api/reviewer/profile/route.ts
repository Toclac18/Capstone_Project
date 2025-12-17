// app/api/reviewer/profile/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handleGET() {
  if (USE_MOCK) {
    // Mock data for reviewer profile
    return jsonResponse(
      {
        userId: "mock-reviewer-id",
        email: "reviewer@example.com",
        fullName: "Jane Reviewer",
        avatarUrl: null,
        point: 200,
        status: "ACTIVE",
        dateOfBirth: "1985-05-15",
        ordid: "0000-0001-2345-6789",
        educationLevel: "MASTER",
        organizationName: "Tech University",
        organizationEmail: "tech@university.edu",
        credentialFileUrls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("reviewer-profile");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/reviewer/profile`, {
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
        userId: "mock-reviewer-id",
        email: "reviewer@example.com",
        fullName: body.fullName || "Jane Reviewer",
        avatarUrl: null,
        point: 200,
        status: "ACTIVE",
        dateOfBirth: body.dateOfBirth || "1985-05-15",
        ordid: body.ordid || "0000-0001-2345-6789",
        educationLevel: body.educationLevel || "MASTER",
        organizationName: body.organizationName || "Tech University",
        organizationEmail: body.organizationEmail || "tech@university.edu",
        credentialFileUrls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("reviewer-profile");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/reviewer/profile`, {
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
    context: "api/reviewer/profile/route.ts/GET",
  });

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/reviewer/profile/route.ts/PUT",
  });
