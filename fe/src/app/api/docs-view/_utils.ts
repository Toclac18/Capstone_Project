// src/app/api/docs-view/_utils.ts
import { headers } from "next/headers";

import { getAuthHeader } from "@/server/auth";

export function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** build header forward sang BE (Authorization + X-Forwarded-For) */
export async function buildForwardHeaders(label?: string) {
  const h = await headers();
  const authHeader = await getAuthHeader(label || "docs-view");

  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh: Record<string, string> = {};
  if (authHeader) fh["Authorization"] = authHeader;
  if (ip) fh["X-Forwarded-For"] = ip;

  return fh;
}

export async function buildJsonForwardHeaders(label?: string) {
  const h = await headers();
  const authHeader = await getAuthHeader(label || "docs-view-json");

  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (ip) fh.set("X-Forwarded-For", ip);

  return fh;
}
