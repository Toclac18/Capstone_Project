// app/api/organizations/[id]/status/route.ts
import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.status) {
    return json({ error: "Status is required" }, 400);
  }

  if (USE_MOCK) {
    const { updateOrganizationStatus } = await import("@/mock/business-admin-organizations");
    const updated = updateOrganizationStatus(id, body.status);
    if (!updated) {
      return json({ error: "Organization not found" }, 404, { "x-mode": "mock" });
    }
    return json({ data: updated }, 200, { "x-mode": "mock" });
  }

  try {
    const { upstream } = await forwardJson(`/api/organizations/${id}/status`, body);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json(
      { message: "Organization status update failed", error: String(e) },
      502
    );
  }
}

// ---------- Helpers ----------
async function forwardJson(path: string, body: any) {
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
    method: "PATCH",
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

