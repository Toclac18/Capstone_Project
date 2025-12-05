// src/app/api/search-meta/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { searchDocumentMocks } from "@/mock/search-document.mock"; // <-- data mock của /search

// --------- RAW TYPE: giống hệt BE /search-meta ---------
type RawSearchMetaData = {
  organizations: {
    id: string;
    name: string;
    logoUrl: string | null;
    docCount: number | null;
  }[];
  domains: {
    id: string;
    code: number;
    name: string;
    docCount: number | null;
  }[];
  specializations: {
    id: string;
    code: number;
    name: string;
    domainId: string;
    docCount: number | null;
  }[];
  docTypes: {
    id: string;
    code: number;
    name: string;
    docCount: number | null;
  }[];
  tags: {
    id: string;
    code: number;
    name: string;
    docCount: number | null;
  }[];
  years: number[];
  priceRange: {
    min: number;
    max: number;
  } | null;
};

type RawSearchMetaResponse = {
  success: boolean;
  data: RawSearchMetaData;
  timestamp: string;
};

// --------- helper: slug để làm id mock ---------
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// --------- build meta từ searchDocumentMocks khi USE_MOCK = true ---------
function buildMetaFromMocks(): RawSearchMetaData {
  const orgMap = new Map<
    string,
    { id: string; name: string; logoUrl: string | null; docCount: number }
  >();
  const domainMap = new Map<
    string,
    { id: string; code: number; name: string; docCount: number }
  >();
  const specMap = new Map<
    string,
    {
      id: string;
      code: number;
      name: string;
      domainId: string;
      docCount: number;
    }
  >();
  const docTypeMap = new Map<
    string,
    { id: string; code: number; name: string; docCount: number }
  >();
  const tagMap = new Map<
    string,
    { id: string; code: number; name: string; docCount: number }
  >();
  const yearsSet = new Set<number>();

  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  searchDocumentMocks.forEach((doc) => {
    // org
    if (doc.organization) {
      const key = doc.organization.name;
      const exist = orgMap.get(key);
      if (exist) {
        exist.docCount++;
      } else {
        orgMap.set(key, {
          id: doc.organization.id ?? slugify(doc.organization.name),
          name: doc.organization.name,
          logoUrl: doc.organization.logoUrl ?? null,
          docCount: 1,
        });
      }
    }

    // domain
    if (doc.domainName) {
      const key = doc.domainName;
      const exist = domainMap.get(key);
      if (exist) {
        exist.docCount++;
      } else {
        domainMap.set(key, {
          id: slugify(doc.domainName),
          code: domainMap.size + 1,
          name: doc.domainName,
          docCount: 1,
        });
      }
    }

    // specialization (mock: gắn specialization vào domain của doc)
    if (doc.specializationName) {
      const specKey = doc.specializationName;
      const domainKey = doc.domainName || "unknown-domain";
      const domain = domainMap.get(domainKey) ?? {
        id: slugify(domainKey),
        code: domainMap.size + 1,
        name: domainKey,
        docCount: 0,
      };
      if (!domainMap.has(domainKey)) {
        domainMap.set(domainKey, domain);
      }

      const exist = specMap.get(specKey);
      if (exist) {
        exist.docCount++;
      } else {
        specMap.set(specKey, {
          id: slugify(specKey),
          code: specMap.size + 1,
          name: doc.specializationName,
          domainId: domain.id,
          docCount: 1,
        });
      }
    }

    // docType
    if (doc.docTypeName) {
      const key = doc.docTypeName;
      const exist = docTypeMap.get(key);
      if (exist) {
        exist.docCount++;
      } else {
        docTypeMap.set(key, {
          id: slugify(key),
          code: docTypeMap.size + 1,
          name: key,
          docCount: 1,
        });
      }
    }

    // tags
    (doc.tagNames || []).forEach((tagName) => {
      const key = tagName;
      const exist = tagMap.get(key);
      if (exist) {
        exist.docCount++;
      } else {
        tagMap.set(key, {
          id: slugify(key),
          code: tagMap.size + 1,
          name: key,
          docCount: 1,
        });
      }
    });

    // years
    if (doc.createdAt) {
      const year = new Date(doc.createdAt).getFullYear();
      if (!Number.isNaN(year)) yearsSet.add(year);
    }

    // price range
    if (typeof doc.price === "number") {
      if (minPrice == null || doc.price < minPrice) minPrice = doc.price;
      if (maxPrice == null || doc.price > maxPrice) maxPrice = doc.price;
    }
  });

  return {
    organizations: Array.from(orgMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    domains: Array.from(domainMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    specializations: Array.from(specMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    docTypes: Array.from(docTypeMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    tags: Array.from(tagMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    years: Array.from(yearsSet).sort((a, b) => b - a),
    priceRange:
      minPrice == null || maxPrice == null
        ? null
        : { min: minPrice, max: maxPrice },
  };
}

// --------- forwardToBE cho nhánh real ---------
async function forwardToBE(path: string) {
  const h = headers();
  const cookieStore = cookies();

  const headerAuth = (await h).get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  return fetch(`${BE_BASE}${path}`, {
    method: "GET",
    headers: {
      ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

// --------- handler chính: USE_MOCK vs BE thật ---------
async function handleGET(_req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    const data = buildMetaFromMocks();
    const body: RawSearchMetaResponse = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(body, { status: 200 });
  }

  // NHÁNH REAL BE
  try {
    const upstream = await forwardToBE("/api/documents/search-meta");
    const body = await upstream.json();
    return NextResponse.json(body, { status: upstream.status });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Upstream search-meta failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/documents/search-meta/route.ts/GET",
  });
