export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
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

const toNum = (v: string | null) =>
  v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined;

export async function GET(req: NextRequest) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const sp = new URL(req.url).searchParams;

  const organization = sp.get("organization") || undefined;

  // legacy single domain
  const legacyDomain = sp.get("domain") || undefined;
  // multi domains
  const domains = sp.getAll("domains").filter(Boolean);

  const specialization = sp.get("specialization") || undefined;

  // year: single + range
  const publicYear = toNum(sp.get("publicYear"));
  const publicYearFrom = toNum(sp.get("publicYearFrom"));
  const publicYearTo = toNum(sp.get("publicYearTo"));

  // premium + points
  const isPremium = sp.get("isPremium") === "true";
  const pointsFrom = toNum(sp.get("pointsFrom"));
  const pointsTo = toNum(sp.get("pointsTo"));

  if (USE_MOCK) {
    let data = [...MOCK_DOCUMENTS];

    if (organization) data = data.filter((d) => d.orgName === organization);

    // domain: ưu tiên multi, fallback legacy
    if (domains.length > 0) {
      data = data.filter((d) => domains.includes(d.domain));
    } else if (legacyDomain) {
      data = data.filter((d) => d.domain === legacyDomain);
    }

    if (specialization)
      data = data.filter((d) => d.specialization === specialization);

    // year single
    if (publicYear != null)
      data = data.filter((d) => d.publicYear === publicYear);
    // year range
    if (publicYearFrom != null)
      data = data.filter((d) => (d.publicYear ?? 0) >= publicYearFrom);
    if (publicYearTo != null)
      data = data.filter((d) => (d.publicYear ?? 0) <= publicYearTo);

    // premium
    if (isPremium) data = data.filter((d) => d.isPremium === true);
    // points range (chỉ khi isPremium)
    if (isPremium && pointsFrom != null)
      data = data.filter((d) => (d.points ?? 0) >= pointsFrom);
    if (isPremium && pointsTo != null)
      data = data.filter((d) => (d.points ?? 0) <= pointsTo);

    return NextResponse.json(
      data.map((d) => ({
        id: d.id,
        title: d.title,
        orgName: d.orgName,
        specialization: d.specialization,
        uploader: d.uploader,
        domain: d.domain,
        publicYear: d.publicYear,
        isPremium: d.isPremium ?? false,
        points: d.points ?? null,
      })),
      { headers: { "x-mode": "mock" } },
    );
  }

  // Forward sang BE thật
  const qs = new URLSearchParams();
  if (organization) qs.set("organization", organization);

  // domains[] (append)
  if (domains.length) domains.forEach((d) => qs.append("domains", d));
  // legacy
  if (legacyDomain) qs.set("domain", legacyDomain);

  if (specialization) qs.set("specialization", specialization);

  if (publicYear != null) qs.set("publicYear", String(publicYear));
  if (publicYearFrom != null) qs.set("publicYearFrom", String(publicYearFrom));
  if (publicYearTo != null) qs.set("publicYearTo", String(publicYearTo));

  if (isPremium) qs.set("isPremium", "true");
  if (pointsFrom != null) qs.set("pointsFrom", String(pointsFrom));
  if (pointsTo != null) qs.set("pointsTo", String(pointsTo));

  // ví dụ path upstream
  const UPSTREAM_PATH = `/api/search/documents${qs.toString() ? `?${qs}` : ""}`;

  try {
    const upstream = await forward(UPSTREAM_PATH);
    const body = await upstream.json().catch(() => ({}));
    return NextResponse.json(body?.data ?? body, {
      status: upstream.status,
      headers: { "x-mode": "real" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Upstream search failed", error: String(e) },
      { status: 502 },
    );
  }
}
