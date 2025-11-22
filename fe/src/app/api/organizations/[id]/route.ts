// app/api/organizations/[id]/route.ts
import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const { id } = await params;

  if (USE_MOCK) {
    const { getOrganizationById } = await import("@/mock/business-admin-organizations");
    const org = getOrganizationById(id);
    if (!org) {
      return json({ error: "Organization not found" }, 404, { "x-mode": "mock" });
    }
    return json({ data: org }, 200, { "x-mode": "mock" });
  }

  try {
    const { upstream } = await forward(`/api/organizations/${id}`);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json(
      { message: "Organization fetch failed", error: String(e) },
      502
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const { id } = await params;

  if (USE_MOCK) {
    const { deleteOrganization } = await import("@/mock/business-admin-organizations");
    const success = deleteOrganization(id);
    if (!success) {
      return json({ error: "Organization not found" }, 404, { "x-mode": "mock" });
    }
    return json({ message: "Organization deleted successfully" }, 200, { "x-mode": "mock" });
  }

  try {
    const { upstream } = await forwardDelete(`/api/organizations/${id}`);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json(
      { message: "Organization deletion failed", error: String(e) },
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

async function forwardDelete(path: string) {
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
    method: "DELETE",
    headers: passHeaders,
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

