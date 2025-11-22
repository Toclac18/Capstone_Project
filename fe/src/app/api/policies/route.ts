// app/api/policies/route.ts
import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  getAllPolicies,
  getActivePolicyByType,
  getPolicyByType,
  updatePolicyByType,
} from "@/mock/policies";
import type {
  PolicyType,
  UpdatePolicyRequest,
} from "@/types/policy";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

export async function GET(req: NextRequest) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const url = new URL(req.url);
  const type = url.searchParams.get("type") as PolicyType | null;
  const active = url.searchParams.get("active") === "true";

  // Get active policy by type (for users to view)
  if (active && type) {
    if (USE_MOCK) {
      const policy = getActivePolicyByType(type);
      if (!policy) {
        return json({ error: "Policy not found" }, 404, { "x-mode": "mock" });
      }
      return json({ data: policy }, 200, { "x-mode": "mock" });
    }

    try {
      const { upstream } = await forward(`/api/policies?type=${type}&active=true`);
      const raw = await upstream.json().catch(() => ({}));
      return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
    } catch (e: any) {
      return json(
        { message: "Policy fetch failed", error: String(e) },
        502
      );
    }
  }

  // Get all policies (for admin)
  if (USE_MOCK) {
    try {
      const policies = getAllPolicies();
      return json({ data: policies }, 200, { "x-mode": "mock" });
    } catch (e: any) {
      console.error("[MOCK] Error in policies GET:", e);
      return json(
        { error: "Failed to fetch policies", message: String(e) },
        500,
        { "x-mode": "mock" }
      );
    }
  }

  try {
    const { upstream } = await forward("/api/policies");
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json({ message: "Policies fetch failed", error: String(e) }, 502);
  }
}

export async function PATCH(req: NextRequest) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const url = new URL(req.url);
  const type = url.searchParams.get("type") as PolicyType | null;
  const body = await req.json().catch(() => null);

  if (!body) {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!type) {
    return json({ error: "Type parameter is required" }, 400);
  }

  if (USE_MOCK) {
    const data = body as UpdatePolicyRequest;
    const policy = updatePolicyByType(type, data);

    if (!policy) {
      return json({ error: "Policy not found" }, 404, { "x-mode": "mock" });
    }

    return json({ data: policy }, 200, { "x-mode": "mock" });
  }

  try {
    const { upstream } = await forwardJson(`/api/policies?type=${type}`, body, "PATCH");
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json(
      { message: "Policy update failed", error: String(e) },
      502
    );
  }
}

// ---------- Helpers ----------
async function forward(path: string) {
  const h = headers();
  const cookieStore = cookies();
  const headerAuth = (await h).get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  const upstreamUrl = beBase() + path;
  const passHeaders: Record<string, string> = {
    ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
  };

  const cookieHeader = (await h).get("cookie");
  if (cookieHeader) passHeaders["cookie"] = cookieHeader;

  const upstream = await fetch(upstreamUrl, {
    headers: passHeaders,
    cache: "no-store",
  });

  return { upstream, status: upstream.status, headers: upstream.headers };
}

async function forwardJson(path: string, body: any, method: "PATCH" | "PUT" = "PATCH") {
  const h = headers();
  const cookieStore = cookies();
  const headerAuth = (await h).get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  const upstreamUrl = beBase() + path;
  const passHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
  };

  const cookieHeader = (await h).get("cookie");
  if (cookieHeader) passHeaders["cookie"] = cookieHeader;

  const upstream = await fetch(upstreamUrl, {
    method,
    headers: passHeaders,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return { upstream, status: upstream.status, headers: upstream.headers };
}

function json(
  data: any,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}
