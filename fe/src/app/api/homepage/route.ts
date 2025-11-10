// src/app/api/homepage/route.ts
import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  mockLibraryDocs,
  mockTopUpvoted,
  mockContinueReading,
  // make sure this exists/was exported from your mock file
  mockSpecializationGroups,
} from "@/mock/documents";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryMock = url.searchParams.get("use_mock")?.toLowerCase();
  const useMockByQuery = queryMock && ["1", "true", "yes"].includes(queryMock);
  const useMockByEnv = process.env.USE_MOCK === "true";
  const USE_MOCK = !!(useMockByQuery || useMockByEnv);

  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const group = (url.searchParams.get("group") || "all") as
    | "continueReading"
    | "topUpvoted"
    | "bySpecialization"
    | "all";
  const specialization = (url.searchParams.get("specialization") || "").trim();
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 12);
  const mode = (url.searchParams.get("mode") || "").toLowerCase(); // "paged" to force items/total

  if (USE_MOCK) {
    // --- MODE A: paged list (backward compatible with current "group" endpoint) ---
    if (mode === "paged" || group !== "all") {
      let pool = mockLibraryDocs;

      if (group === "continueReading") pool = mockContinueReading;
      if (group === "topUpvoted") pool = mockTopUpvoted;
      if (group === "bySpecialization" && specialization) {
        pool = mockLibraryDocs.filter(
          (d) => d.specialization === specialization,
        );
      }

      const filtered = pool.filter((d) => {
        if (!q) return true;
        const hay = [
          d.title,
          d.points || "",
          d.specialization,
          d.uploader,
          d.orgName,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });

      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return json({ items, total: filtered.length, page, pageSize }, 200, {
        "x-mode": "mock-paged",
        "cache-control": "no-store",
      });
    }

    // --- MODE B: bulk home payload (what HomepageProvider expects) ---
    return json(
      {
        continueReading: mockContinueReading,
        topUpvoted: mockTopUpvoted,
        specializations: mockSpecializationGroups,
      },
      200,
      { "x-mode": "mock-bulk", "cache-control": "no-store" },
    );
  }

  // === REAL BACKEND FORWARD ===
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (group && group !== "all") qs.set("group", group);
  if (specialization) qs.set("specialization", specialization);
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));

  try {
    const { upstream } = await forward(`/api/homepage?${qs.toString()}`);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, {
      "x-mode": "real",
      "cache-control": "no-store",
    });
  } catch (e: any) {
    return json({ message: "Homepage fetch failed", error: String(e) }, 502);
  }
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

  const upstream = await fetch(upstreamUrl, {
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
