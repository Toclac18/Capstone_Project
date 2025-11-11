import { headers } from "next/headers";
import { mockDocumentsDB } from "@/mock/db";

const DEFAULT_BE_BASE = "http://localhost:8080";

export async function GET(request: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const { searchParams } = new URL(request.url);
  const domainIdsParam = searchParams.get("domainIds");
  const domainIds = domainIdsParam
    ? domainIdsParam.split(",").filter(Boolean)
    : [];

  if (USE_MOCK) {
    const specializations = mockDocumentsDB.getSpecializations(domainIds);
    return new Response(JSON.stringify(specializations), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const url = domainIdsParam
      ? `${BE_BASE}/api/reader/documents/specializations?domainIds=${encodeURIComponent(domainIdsParam)}`
    : `${BE_BASE}/api/reader/documents/specializations`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

