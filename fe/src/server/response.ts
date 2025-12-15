// server/response.ts
// Common helpers for building JSON responses from API routes

export type Mode = "real" | "mock" | "mock-paged" | "mock-bulk" | string;

export function jsonResponse(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string>; mode?: Mode },
): Response {
  const status = init?.status ?? 200;
  const mode = init?.mode;
  const extra = init?.headers ?? {};

  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...extra,
  };

  if (mode) {
    headers["x-mode"] = String(mode);
  }

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

export async function proxyJsonResponse(
  upstream: Response,
  init?: { mode?: Mode; headers?: Record<string, string> },
): Promise<Response> {
  const status = upstream.status;
  const text = await upstream.text();

  // For 204 No Content, return empty response without content-type
  if (status === 204) {
    const headers: Record<string, string> = {
      ...(init?.headers ?? {}),
    };

    const mode = init?.mode;
    if (mode) {
      headers["x-mode"] = String(mode);
    }

    return new Response(null, {
      status: 204,
      headers,
    });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/json";

  const headers: Record<string, string> = {
    "content-type": contentType,
    ...(init?.headers ?? {}),
  };

  const mode = init?.mode;
  if (mode) {
    headers["x-mode"] = String(mode);
  }

  return new Response(text, {
    status,
    headers,
  });
}

export function parseError(text: string, fallback = "Request failed"): string {
  if (!text) return fallback;
  try {
    const json = JSON.parse(text);
    return (
      (json as any)?.error ||
      (json as any)?.message ||
      (json as any)?.detail ||
      fallback
    );
  } catch {
    return text || fallback;
  }
}

// map sang be structure
export function badRequest(msg: string, code = 400) {
  const apiResponse = {
    success: false,
    message: msg,
    data: null,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(apiResponse), {
    status: code,
    headers: { "content-type": "application/json" },
  });
}
