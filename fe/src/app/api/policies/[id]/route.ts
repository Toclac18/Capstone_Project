// app/api/policies/[id]/route.ts
import { NextRequest } from "next/server";
import {
  getPolicyById,
  getPolicyView,
} from "@/mock/policies";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handleGET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId"); // For checking acceptance
  const view = url.searchParams.get("view") === "true"; // Get with acceptance status

  if (USE_MOCK) {
    if (view) {
      const result = getPolicyView(id, userId || undefined);
      if (!result) {
        return jsonResponse({ error: "Policy not found" }, {
          status: 404,
          mode: "mock",
        });
      }
      return jsonResponse({ data: result }, { status: 200, mode: "mock" });
    }

    const policy = getPolicyById(id);
    if (!policy) {
      return jsonResponse({ error: "Policy not found" }, {
        status: 404,
        mode: "mock",
      });
    }
    return jsonResponse({ data: policy }, { status: 200, mode: "mock" });
  }

  try {
    const queryString = url.searchParams.toString();
    const path = queryString
      ? `/api/policies/${id}?${queryString}`
      : `/api/policies/${id}`;

    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}${path}`, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw?.data ?? raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Policy fetch failed", error: String(e) },
      { status: 502 }
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/policies/[id]/route.ts/GET",
  });

