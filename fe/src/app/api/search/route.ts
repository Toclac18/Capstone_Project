export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { mockLibraryDocs } from "@/mock/documents";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";

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

  return fetch(upstreamUrl, { headers: passHeaders, cache: "no-store" });
}

const toNum = (v: string | null) =>
  v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined;

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

function contains(hay: string | number | undefined | null, q: string) {
  if (!q) return true;
  const needle = norm(q);
  const txt = norm(hay);
  return txt.includes(needle);
}

/**
 * Priority-aware matching:
 * 1) description (highest priority)
 * 2) summarizations.short | medium | detailed
 * 3) other fields (title, orgName, domain, specialization, uploader, publicYear)
 */
function matchDocWithPriority(doc: any, q: string) {
  if (!q) return true;

  // 1) description first
  if (contains(doc.description, q)) return true;

  // 2) summarizations
  const s = doc.summarizations || {};
  if (contains(s.short, q) || contains(s.medium, q) || contains(s.detailed, q))
    return true;

  // 3) other fields
  const other = [
    doc.title,
    doc.orgName,
    doc.domain,
    doc.specialization,
    doc.uploader,
    doc.publicYear,
  ];
  return other.some((v) => contains(v, q));
}

async function handleGET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  // pagination
  const page = Math.max(1, Number(sp.get("page") || 1));
  const perPage = Math.max(1, Number(sp.get("perPage") || 10));
  const offset = (page - 1) * perPage;

  // filters
  const q = sp.get("q") || "";

  const organization = sp.get("organization") || undefined;
  const legacyDomain = sp.get("domain") || undefined;
  const domains = sp.getAll("domains").filter(Boolean);
  const specialization = sp.get("specialization") || undefined;

  const publicYear = toNum(sp.get("publicYear"));
  const publicYearFrom = toNum(sp.get("publicYearFrom"));
  const publicYearTo = toNum(sp.get("publicYearTo"));

  const isPremium = sp.get("isPremium") === "true";
  const pointsFrom = toNum(sp.get("pointsFrom"));
  const pointsTo = toNum(sp.get("pointsTo"));

  if (USE_MOCK) {
    // Ensure every mock has fields used in matching
    let rows = [...mockLibraryDocs].map((d) => ({
      ...d,
      description:
        d.description ??
        `${d.title} — extended description for ${d.domain} / ${d.specialization} (${d.publicYear}).`,
      summarizations: d.summarizations ?? {
        short: `${d.title} short summary.`,
        medium: `${d.title} medium summary with more context.`,
        detailed: `${d.title} detailed summary with extensive context and methodology.`,
      },
    }));

    // Keyword search with priority
    if (q) rows = rows.filter((d) => matchDocWithPriority(d, q));

    // Filters
    if (organization) rows = rows.filter((d) => d.orgName === organization);

    if (domains.length > 0)
      rows = rows.filter((d) => domains.includes(d.domain));
    else if (legacyDomain) rows = rows.filter((d) => d.domain === legacyDomain);

    if (specialization)
      rows = rows.filter((d) => d.specialization === specialization);

    if (publicYear != null)
      rows = rows.filter((d) => d.publicYear === publicYear);
    if (publicYearFrom != null)
      rows = rows.filter((d) => (d.publicYear ?? 0) >= publicYearFrom);
    if (publicYearTo != null)
      rows = rows.filter((d) => (d.publicYear ?? 0) <= publicYearTo);

    if (isPremium) rows = rows.filter((d) => d.isPremium === true);
    if (isPremium && pointsFrom != null)
      rows = rows.filter((d) => (d.points ?? 0) >= pointsFrom);
    if (isPremium && pointsTo != null)
      rows = rows.filter((d) => (d.points ?? 0) <= pointsTo);

    // Server-side pagination
    const total = rows.length;
    const items = rows.slice(offset, offset + perPage).map((d) => ({
      id: d.id,
      title: d.title,
      orgName: d.orgName,
      specialization: d.specialization,
      uploader: d.uploader,
      domain: d.domain,
      publicYear: d.publicYear,
      isPremium: d.isPremium ?? false,
      points: d.points ?? null,
      description: d.description,
      summarizations: d.summarizations,
    }));

    return NextResponse.json({
      items,
      total,
      page,
      perPage,
      pageCount: Math.max(1, Math.ceil(total / perPage)),
    });
  }

  // Forward to real BE
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("perPage", String(perPage));
  if (q) qs.set("q", q);

  if (organization) qs.set("organization", organization);
  if (domains.length) domains.forEach((d) => qs.append("domains", d));
  if (legacyDomain) qs.set("domain", legacyDomain);
  if (specialization) qs.set("specialization", specialization);

  if (publicYear != null) qs.set("publicYear", String(publicYear));
  if (publicYearFrom != null) qs.set("publicYearFrom", String(publicYearFrom));
  if (publicYearTo != null) qs.set("publicYearTo", String(publicYearTo));

  if (isPremium) qs.set("isPremium", "true");
  if (pointsFrom != null) qs.set("pointsFrom", String(pointsFrom));
  if (pointsTo != null) qs.set("pointsTo", String(pointsTo));

  // Example upstream path (ensure your real BE matches this contract and also searches in summarizations)
  const UPSTREAM_PATH = `/api/search/documents?${qs.toString()}`;

  try {
    const upstream = await forward(UPSTREAM_PATH);
    const body = await upstream.json().catch(() => ({}));
    return NextResponse.json(body?.data ?? body, { status: upstream.status });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Upstream search failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/search/route.ts/GET",
  });
