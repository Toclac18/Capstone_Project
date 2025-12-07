// app/api/policies/route.ts
import { NextRequest } from "next/server";
import {
  getAllPolicies,
  getActivePolicyByType,
  updatePolicyByType,
} from "@/mock/policies";
import type { PolicyType, UpdatePolicyRequest } from "@/types/policy";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") as PolicyType | null;
  const active = url.searchParams.get("active") === "true";

  // Get active policy by type (for users to view)
  if (active && type) {
    if (USE_MOCK) {
      const policy = getActivePolicyByType(type);
      if (!policy) {
        return jsonResponse(
          { error: "Policy not found" },
          {
            status: 404,
            mode: "mock",
          },
        );
      }
      return jsonResponse({ data: policy }, { status: 200, mode: "mock" });
    }

    try {
      const authHeader = await getAuthHeader();
      const fh = new Headers({ "Content-Type": "application/json" });
      if (authHeader) fh.set("Authorization", authHeader);

      const upstream = await fetch(
        `${BE_BASE}/api/policies?type=${type}&active=true`,
        {
          method: "GET",
          headers: fh,
          cache: "no-store",
        },
      );

      const raw = await upstream.json().catch(() => ({}));
      return jsonResponse(raw?.data ?? raw, {
        status: upstream.status,
        mode: "real",
      });
    } catch (e: any) {
      return jsonResponse(
        { message: "Policy fetch failed", error: String(e) },
        { status: 502 },
      );
    }
  }

  // Get all policies (for admin)
  if (USE_MOCK) {
    try {
      const policies = getAllPolicies();
      return jsonResponse({ data: policies }, { status: 200, mode: "mock" });
    } catch (e: any) {
      console.error("[MOCK] Error in policies GET:", e);
      return jsonResponse(
        { error: "Failed to fetch policies", message: String(e) },
        { status: 500, mode: "mock" },
      );
    }
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies`, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    if (!upstream.ok) {
      let errorData: any = {};
      try {
        const text = await upstream.text();
        errorData = text ? JSON.parse(text) : {};
      } catch {
        // Ignore parse errors
      }
      return jsonResponse(
        errorData?.data ?? errorData ?? { message: "Failed to fetch policies" },
        {
          status: upstream.status,
          mode: "real",
        },
      );
    }

    const raw = await upstream.json().catch(() => ({}));

    // Backend returns ApiResponse<List<PolicyResponse>> via ResponseWrapperAdvice
    // Structure: { success: true, data: [...], timestamp: "..." }
    // Unwrap to get the actual policies array
    let policies: any[] = [];

    // Handle different response structures
    if (raw?.data) {
      if (Array.isArray(raw.data)) {
        // Check if it's array of ApiResponse objects or direct policies array
        if (raw.data.length > 0 && raw.data[0]?.success && raw.data[0]?.data) {
          // Array of ApiResponse: [{ success: true, data: [...] }]
          // Extract policies from first element
          policies = Array.isArray(raw.data[0].data) ? raw.data[0].data : [];
        } else {
          // Direct array of policies: { data: [...] }
          policies = raw.data;
        }
      } else if (raw.data?.data && Array.isArray(raw.data.data)) {
        // Nested: { data: { data: [...] } }
        policies = raw.data.data;
      } else if (raw.data?.success && Array.isArray(raw.data.data)) {
        // ApiResponse format: { data: { success: true, data: [...] } }
        policies = raw.data.data;
      }
    } else if (Array.isArray(raw)) {
      // Already an array
      policies = raw;
    } else if (raw?.success && Array.isArray(raw.data)) {
      // Direct ApiResponse: { success: true, data: [...] }
      policies = raw.data;
    }

    // Return in format that service expects: { data: [...] }
    // Service will check res.data.data and return that
    return jsonResponse(
      { data: policies },
      {
        status: upstream.status,
        mode: "real",
      },
    );
  } catch (e: any) {
    return jsonResponse(
      { message: "Policies fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/policies/route.ts/GET",
  });

async function handlePATCH(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") as PolicyType | null;
  const body = await req.json().catch(() => null);

  if (!body) {
    return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!type) {
    return jsonResponse(
      { error: "Type parameter is required" },
      {
        status: 400,
      },
    );
  }

  if (USE_MOCK) {
    const data = body as UpdatePolicyRequest;
    const policy = updatePolicyByType(type, data);

    if (!policy) {
      return jsonResponse(
        { error: "Policy not found" },
        {
          status: 404,
          mode: "mock",
        },
      );
    }

    return jsonResponse({ data: policy }, { status: 200, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies?type=${type}`, {
      method: "PATCH",
      headers: fh,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw?.data ?? raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Policy update failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const PATCH = (...args: Parameters<typeof handlePATCH>) =>
  withErrorBoundary(() => handlePATCH(...args), {
    context: "api/policies/route.ts/PATCH",
  });
