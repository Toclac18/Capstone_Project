// app/api/homepage/trending-documents/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handleGET() {
  if (USE_MOCK) {
    return jsonResponse(
      { documents: [] },
      { status: 200, mode: "mock" },
    );
  }

  const upstream = await fetch(`${BE_BASE}/api/statistics/homepage/trending-documents`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    console.error("Backend trending documents error:", upstream.status, text);
    return jsonResponse(
      { documents: [] },
      { status: 200, mode: "fallback" },
    );
  }

  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    // Backend returns { documents: [...] }
    data = json.data || json;
  } catch {
    data = { documents: [] };
  }

  return jsonResponse(data, { status: 200, mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/homepage/trending-documents/route.ts/GET",
  });

