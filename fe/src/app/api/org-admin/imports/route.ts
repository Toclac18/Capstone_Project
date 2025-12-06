//src/app/api/org-admin/imports/route.ts;

import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import {
  mockFetchImportDetail,
  mockFetchImports,
  mockCreateImport,
} from "@/mock/imports.mock";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

/* ====================== GET ====================== */

async function handleGET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? undefined;
  const q = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status") ?? "ALL";

  const pageRaw = Number(url.searchParams.get("page") ?? 1);
  const pageSizeRaw = Number(url.searchParams.get("pageSize") ?? 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 10;

  // ========== MOCK MODE ==========
  if (USE_MOCK) {
    if (id) {
      // mock detail: wrapper { success, data, pageInfo, timestamp }
      const detail = await mockFetchImportDetail({ id, page, pageSize });
      return jsonResponse(detail, {
        status: 200,
        headers: { "x-mode": "mock" },
      });
    }

    // mock list: wrapper { success, data, pageInfo, timestamp }
    const list = await mockFetchImports({
      q,
      status,
      page,
      pageSize,
    });

    return jsonResponse(list, {
      status: 200,
      headers: { "x-mode": "mock" },
    });
  }

  // ========== REAL BE MODE ==========
  const auth = await getAuthHeader();

  let beUrl: URL;

  if (id) {
    // chi tiết 1 batch: enrollments
    beUrl = new URL(
      `${BE_BASE}/api/organization/members/import-batches/${encodeURIComponent(
        id,
      )}/enrollments`,
    );
  } else {
    // danh sách batch
    beUrl = new URL(`${BE_BASE}/api/organization/members/import-batches`);
  }

  // BE dùng page 0-based
  beUrl.searchParams.set("page", String(page - 1));
  beUrl.searchParams.set("size", String(pageSize));

  if (q) beUrl.searchParams.set("q", q);
  if (status && status !== "ALL") beUrl.searchParams.set("status", status);

  const upstream = await fetch(beUrl.toString(), {
    method: "GET",
    headers: auth ? { Authorization: auth } : {},
    cache: "no-store",
  });

  const text = await upstream.text();

  try {
    const json = JSON.parse(text);
    return jsonResponse(json, {
      status: upstream.status,
      headers: { "x-mode": "real" },
    });
  } catch {
    return new Response(text, { status: upstream.status });
  }
}

/* ====================== POST (upload Excel) ====================== */

async function handlePOST(req: NextRequest) {
  const form = await req.formData();

  if (USE_MOCK) {
    const f = form.get("file");
    if (!(f instanceof File)) {
      return jsonResponse(
        { success: false, message: "file is required" },
        { status: 400, headers: { "x-mode": "mock" } },
      );
    }

    const created = await mockCreateImport(f, "mock.admin@example.com");
    return jsonResponse(created, {
      status: 201,
      headers: { "x-mode": "mock" },
    });
  }

  // REAL BE
  const auth = await getAuthHeader();
  const upstream = await fetch(
    `${BE_BASE}/api/organization/members/invite/excel`,
    {
      method: "POST",
      headers: auth ? { Authorization: auth } : {},
      body: form,
    },
  );

  const text = await upstream.text();

  try {
    const json = JSON.parse(text);
    return jsonResponse(json, {
      status: upstream.status,
      headers: { "x-mode": "real" },
    });
  } catch {
    return new Response(text, { status: upstream.status });
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...(args as [NextRequest])), {
    context: "api/org-admin/imports/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...(args as [NextRequest])), {
    context: "api/org-admin/imports/route.ts/POST",
  });
