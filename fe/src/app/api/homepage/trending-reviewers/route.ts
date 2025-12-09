// app/api/homepage/trending-reviewers/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function handleGET(req: NextRequest) {
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("forceRefresh") === "true";
  if (USE_MOCK) {
    return jsonResponse(
      { reviewers: [] },
      { status: 200, mode: "mock" },
    );
  }

  const backendUrl = forceRefresh
    ? `${BE_BASE}/api/statistics/homepage/trending-reviewers?forceRefresh=true`
    : `${BE_BASE}/api/statistics/homepage/trending-reviewers`;
    
  const upstream = await fetch(backendUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    console.error("Backend trending reviewers error:", upstream.status, text);
    return jsonResponse(
      { reviewers: [] },
      { status: 200, mode: "fallback" },
    );
  }

  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    // Backend returns { reviewers: [...] }
    data = json.data || json;
  } catch {
    data = { reviewers: [] };
  }

  return jsonResponse(data, { status: 200, mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/homepage/trending-reviewers/route.ts/GET",
  });

