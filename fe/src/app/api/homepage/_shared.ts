import { headers, cookies } from "next/headers";

export const DEFAULT_BE_BASE = "http://localhost:8081";
export const USE_MOCK = process.env.USE_MOCK === "true";
export const BE_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_BE_BASE;

/** Lấy Authorization: ưu tiên header, fallback cookie "Authorization" */
export async function getAuthHeader(): Promise<Record<string, string>> {
  const h = await headers();
  const cookieStore = await cookies();
  const headerAuth = h.get("authorization") || "";
  const cookieAuth = cookieStore.get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  return effectiveAuth ? { Authorization: effectiveAuth } : {};
}

/** Proxy GET đến BE, trả về JSON & gắn x-mode=real */
export async function proxyGetJson(upstreamUrl: URL) {
  const auth = await getAuthHeader();

  const proxyHeaders: Record<string, string> = {
    ...auth,
    "Content-Type": "application/json",
  };

  const upstream = await fetch(upstreamUrl.toString(), {
    method: "GET",
    headers: proxyHeaders,
    cache: "no-store",
  });

  const raw = await upstream.json().catch(() => ({}));
  return new Response(JSON.stringify(raw?.data ?? raw), {
    status: upstream.status,
    headers: { "content-type": "application/json", "x-mode": "real" },
  });
}

/** Proxy POST đến BE, body JSON, trả về JSON & gắn x-mode=real */
export async function proxyPostJson(upstreamUrl: URL, body: unknown) {
  const auth = await getAuthHeader();

  const proxyHeaders: Record<string, string> = {
    ...auth,
    "Content-Type": "application/json",
  };

  const upstream = await fetch(upstreamUrl.toString(), {
    method: "POST",
    headers: proxyHeaders,
    cache: "no-store",
    body: JSON.stringify(body ?? {}),
  });

  const raw = await upstream.json().catch(() => ({}));
  return new Response(JSON.stringify(raw?.data ?? raw), {
    status: upstream.status,
    headers: { "content-type": "application/json", "x-mode": "real" },
  });
}
