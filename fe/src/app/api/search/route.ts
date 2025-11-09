export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { MOCK_DOCUMENTS } from "@/mock/searchMock";

/** Base URL cho BE thật (giống pattern mẫu) */
function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

/** Forward GET giữ Authorization + Cookie */
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

export async function GET(req: NextRequest) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const sp = new URL(req.url).searchParams;

  const organization = sp.get("organization");
  const domain = sp.get("domain");
  const specialization = sp.get("specialization");
  const publicYearParam = sp.get("publicYear");
  const publicYear = publicYearParam ? Number(publicYearParam) : undefined;

  if (USE_MOCK) {
    let data = [...MOCK_DOCUMENTS];
    if (organization) data = data.filter((d) => d.orgName === organization);
    if (domain) data = data.filter((d) => d.domain === domain);
    if (specialization)
      data = data.filter((d) => d.specialization === specialization);
    if (publicYear) data = data.filter((d) => d.publicYear === publicYear);

    return NextResponse.json(
      data.map((d) => ({
        id: d.id,
        title: d.title,
        orgName: d.orgName,
        specialization: d.specialization,
        uploader: d.uploader,
        domain: d.domain,
        publicYear: d.publicYear,
      })),
      { headers: { "x-mode": "mock" } },
    );
  }

  // Real mode: forward sang BE (đổi path này cho khớp BE thật của bạn)
  const qs = new URLSearchParams();
  if (organization) qs.set("organization", organization);
  if (domain) qs.set("domain", domain);
  if (specialization) qs.set("specialization", specialization);
  if (publicYear) qs.set("publicYear", String(publicYear));

  // Ví dụ path BE:
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
