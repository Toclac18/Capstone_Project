export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { MOCK_DOCUMENTS } from "@/mock/searchMock";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

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

  const res = await fetch(upstreamUrl, {
    headers: passHeaders,
    cache: "no-store",
  });
  return res;
}

export async function GET() {
  const USE_MOCK = process.env.USE_MOCK === "true";

  if (USE_MOCK) {
    const organizations = Array.from(
      new Set(MOCK_DOCUMENTS.map((d) => d.orgName)),
    ).sort();
    const domains = Array.from(
      new Set(MOCK_DOCUMENTS.map((d) => d.domain)),
    ).sort();
    const specializations = Array.from(
      new Set(MOCK_DOCUMENTS.map((d) => d.specialization)),
    ).sort();
    const years = Array.from(
      new Set(MOCK_DOCUMENTS.map((d) => d.publicYear)),
    ).sort((a, b) => b - a);

    // map domain -> specialization[]
    const map: Record<string, Set<string>> = {};
    for (const d of MOCK_DOCUMENTS) {
      map[d.domain] ??= new Set<string>();
      map[d.domain].add(d.specialization);
    }
    const specializationsByDomain: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(map)) {
      specializationsByDomain[k] = Array.from(v).sort();
    }

    return NextResponse.json(
      {
        organizations,
        domains,
        specializations,
        years,
        specializationsByDomain,
      },
      { headers: { "x-mode": "mock" } },
    );
  }

  // Real mode: forward — nếu BE chưa trả mapping, FE sẽ fallback dùng full list
  const UPSTREAM_PATH = `/api/search/meta`;
  try {
    const upstream = await forward(UPSTREAM_PATH);
    const body = await upstream.json().catch(() => ({}));
    return NextResponse.json(body?.data ?? body, {
      status: upstream.status,
      headers: { "x-mode": "real" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Upstream meta failed", error: String(e) },
      { status: 502 },
    );
  }
}
