import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

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
    email: string;
    password: string;
    fullName: string;
    dateOfBirth: string;
    orcid?: string;
    educationLevel: string;
    organizationName: string;
    organizationEmail: string;
    domainIds: string[];
    specializationIds: string[];
  };

  try {
    const dataText = await (dataBlob as Blob).text();
    data = JSON.parse(dataText);
  } catch {
    return badRequest("Invalid data JSON");
  }

  // Validate required fields (matching backend RegisterReviewerRequest)
  const {
    email,
    password,
    fullName,
    dateOfBirth,
    educationLevel,
    organizationName,
    organizationEmail,
    domainIds,
    specializationIds,
  } = data;
  
  if (!email || !password || !fullName || !dateOfBirth) {
    return badRequest("Missing required basic fields");
  }

  if (
    !educationLevel ||
    !organizationName ||
    !organizationEmail ||
    !domainIds ||
    !specializationIds
  ) {
    return badRequest("Missing required reviewer fields");
  }

  // Validate constraints
  if (!Array.isArray(domainIds) || domainIds.length < 1 || domainIds.length > 3) {
    return badRequest("Must select 1 to 3 domains");
  }

  if (
    !Array.isArray(specializationIds) ||
    specializationIds.length < 1 ||
    specializationIds.length > 5
  ) {
    return badRequest("Must select 1 to 5 specializations");
  }

  // Validate file upload (required for reviewer)
  const files = formData.getAll("credentialFiles");
  if (!files || files.length === 0) {
    return badRequest("At least one credential file is required");
  }
  
  if (files.length > 10) {
    return badRequest("Maximum 10 credential files allowed");
  }

  // Validate file size (max 10MB per file)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  for (const file of files) {
    if (file instanceof File && file.size > MAX_FILE_SIZE) {
      return badRequest(`File "${file.name}" exceeds 10MB limit`);
    }
  }

  if (USE_MOCK) {
    const mockResponse = {
      userId: `user-${Date.now()}`,
      email,
      fullName,
      role: "REVIEWER",
      status: "PENDING_EMAIL_VERIFY",
      accessToken: null,
      tokenType: "Bearer",
    };
    return jsonResponse(mockResponse, { status: 201, mode: "mock" });
  }

  // Proxy to BE (backend expects multipart with "data" and "credentialFiles")
  const upstream = await fetch(`${BE_BASE}/api/auth/register/reviewer`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(
      { error: parseError(text, "Registration failed") },
      { status: upstream.status }
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
      { status: 500 }
    );
  }

  // Backend may return { data: AuthResponse } or AuthResponse directly
  const authResponse = responseData?.data || responseData;
  
  return jsonResponse(authResponse, { 
    status: upstream.status,
    mode: "real" 
  });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/auth/register/reviewer/route.ts/POST",
  });
