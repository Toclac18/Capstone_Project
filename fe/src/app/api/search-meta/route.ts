export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { mockLibraryDocs } from "@/mock/documents";
import { BE_BASE, USE_MOCK } from "@/server/config";

function beBase() {
  return BE_BASE;
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
  if (USE_MOCK) {
    // Organizations, domains, specializations, years
    const organizations = Array.from(
      new Set(mockLibraryDocs.map((d) => d.orgName)),
    ).sort();

    const domains = Array.from(
      new Set(mockLibraryDocs.map((d) => d.domain)),
    ).sort();

    const specializations = Array.from(
      new Set(mockLibraryDocs.map((d) => d.specialization)),
    ).sort();

    const years = Array.from(
      new Set(mockLibraryDocs.map((d) => d.publicYear)),
    ).sort((a, b) => b - a);

    // Mapping domain -> specialization[]
    const map: Record<string, Set<string>> = {};
    for (const d of mockLibraryDocs) {
      map[d.domain] ??= new Set<string>();
      map[d.domain].add(d.specialization);
    }
    const specializationsByDomain: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(map)) {
      specializationsByDomain[k] = Array.from(v).sort();
    }

    // Range điểm cho slider Points
    const pointsValues = mockLibraryDocs
      .filter((d) => typeof d.points === "number")
      .map((d) => d.points as number);

    const pointsRange =
      pointsValues.length > 0
        ? { min: Math.min(...pointsValues), max: Math.max(...pointsValues) }
        : { min: 1, max: 250 };

    return NextResponse.json(
      {
        organizations,
        domains,
        specializations,
        years,
        specializationsByDomain,
        pointsRange,
      },
      { headers: { "x-mode": "mock" } },
    );
  }

  // Real mode: forward tới BE thật
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