import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePOST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return badRequest("Content-Type must be multipart/form-data");
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return badRequest("Invalid form data");
  }

  // Parse data JSON blob (backend expects @RequestPart("data"))
  const dataBlob = formData.get("data");
  if (!dataBlob) {
    return badRequest("Missing data field");
  }

  let data: {
    adminEmail: string;
    password: string;
    adminFullName: string;
    organizationName: string;
    organizationType: string;
    organizationEmail: string;
    hotline: string;
    address: string;
    registrationNumber: string;
  };

  try {
    const dataText = await (dataBlob as Blob).text();
    data = JSON.parse(dataText);
  } catch {
    return badRequest("Invalid data JSON");
  }

  // Validate required fields (matching backend RegisterOrganizationRequest)
  const {
    adminEmail,
    password,
    adminFullName,
    organizationName,
    organizationType,
    organizationEmail,
    hotline,
    address,
    registrationNumber,
  } = data;

  if (!adminEmail || !password || !adminFullName) {
    return badRequest("Missing required admin fields");
  }

  if (
    !organizationName ||
    !organizationType ||
    !organizationEmail ||
    !hotline ||
    !address ||
    !registrationNumber
  ) {
    return badRequest("Missing required organization fields");
  }

  // Logo file is optional (backend expects @RequestPart(value = "logoFile", required = false))
  // No validation needed for logoFile

  if (USE_MOCK) {
    const mockResponse = {
      userId: `user-${Date.now()}`,
      email: adminEmail,
      fullName: adminFullName,
      role: "ORGANIZATION",
      status: "PENDING_EMAIL_VERIFY",
      accessToken: null,
      tokenType: "Bearer",
    };
    return jsonResponse(mockResponse, { status: 201, mode: "mock" });
  }

  // Proxy to BE (backend expects multipart with "data" and optional "logoFile")
  const upstream = await fetch(`${BE_BASE}/api/auth/register/organization`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(
      { error: parseError(text, "Registration failed") },
      { status: upstream.status },
    );
  }

  // Parse response from backend
  let responseData: any;
  try {
    const text = await upstream.text();
    responseData = JSON.parse(text);
  } catch {
    return jsonResponse(
      { error: "Failed to parse backend response" },
      { status: 500 },
    );
  }

  // Backend may return { data: AuthResponse } or AuthResponse directly
  const authResponse = responseData?.data || responseData;

  return jsonResponse(authResponse, {
    status: upstream.status,
    mode: "real",
  });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/register/org-admin/route.ts/POST",
  });
