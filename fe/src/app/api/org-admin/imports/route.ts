// app/api/org-admin/imports/route.ts

import {
  mockCreateImport,
  mockFetchImportDetail,
  mockFetchImports,
} from "@/mock/imports";
import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const download = url.searchParams.get("download");

  // -----------------------------
  // CSV DOWNLOAD
  // -----------------------------
  if (download === "csv" && id) {
    if (USE_MOCK) {
      const job = await mockFetchImportDetail(id);
      if (!job) {
        return new Response("Not found", { status: 404 });
      }

      const lines = [
        [
          "Row",
          "Full Name",
          "Username",
          "Email",
          "Imported",
          "Email Sent",
          "Error",
        ].join(","),
        ...job.results.map((r) =>
          [
            r.row,
            r.fullName,
            r.username,
            r.email,
            r.imported,
            r.emailSent,
            r.error ?? "",
          ]
            .map((v) =>
              typeof v === "string" && v.includes(",") ? `"${v}"` : String(v),
            )
            .join(","),
        ),
      ];

      return new Response(lines.join("\n"), {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename=import_${id}_result.csv`,
          "x-mode": "mock",
        },
      });
    }

    try {
      const authHeader = await getAuthHeader("org-admin-imports-result");

      const fh = new Headers();
      if (authHeader) fh.set("Authorization", authHeader);

      const upstream = await fetch(
        `${BE_BASE}/api/org-admin/imports/${encodeURIComponent(id)}/result`,
        {
          method: "GET",
          headers: fh,
          cache: "no-store",
        },
      );

      const csv = await upstream.text();
      const ct =
        upstream.headers.get("content-type") ?? "text/csv; charset=utf-8";
      const cd =
        upstream.headers.get("content-disposition") ??
        `attachment; filename=import_${id}_result.csv`;

      return new Response(csv, {
        status: upstream.status,
        headers: {
          "content-type": ct,
          "content-disposition": cd,
          "x-mode": "real",
        },
      });
    } catch (e: any) {
      return jsonResponse(
        {
          message: "CSV download failed",
          error: String(e),
        },
        { status: 502 },
      );
    }
  }

  if (id) {
    if (USE_MOCK) {
      const job = await mockFetchImportDetail(id);
      if (!job) {
        return new Response("Not found", { status: 404 });
      }

      return jsonResponse(job, { status: 200, mode: "mock" });
    }

    try {
      const authHeader = await getAuthHeader("org-admin-imports-detail");

      const fh = new Headers({ "Content-Type": "application/json" });
      if (authHeader) fh.set("Authorization", authHeader);

      const upstream = await fetch(
        `${BE_BASE}/api/org-admin/imports/${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: fh,
          cache: "no-store",
        },
      );

      const raw = await upstream.json().catch(() => ({}));
      const payload = (raw as any)?.data ?? raw;

      return jsonResponse(payload, {
        status: upstream.status,
        mode: "real",
      });
    } catch (e: any) {
      return jsonResponse(
        {
          message: "Detail fetch failed",
          error: String(e),
        },
        { status: 502 },
      );
    }
  }

  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
  const q = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status") ?? "ALL";

  if (USE_MOCK) {
    const data = await mockFetchImports({
      page,
      pageSize,
      q,
      status: status as any,
    });

    return jsonResponse(data, { status: 200, mode: "mock" });
  }

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (q) qs.set("q", q);
  if (status && status !== "ALL") qs.set("status", status);

  try {
    const authHeader = await getAuthHeader("org-admin-imports-list");

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(
      `${BE_BASE}/api/org-admin/imports?${qs.toString()}`,
      {
        method: "GET",
        headers: fh,
        cache: "no-store",
      },
    );

    const raw = await upstream.json().catch(() => ({}));
    const payload = (raw as any)?.data ?? raw;

    return jsonResponse(payload, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      {
        message: "Import list fetch failed",
        error: String(e),
      },
      { status: 502 },
    );
  }
}

async function handlePOST(req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    const form = await req.formData();
    const file = form.get("file");
    const createdBy = String(form.get("createdBy") ?? "system");

    if (!(file instanceof File)) {
      return new Response("Bad file", { status: 400 });
    }

    const job = await mockCreateImport(file, createdBy);
    return jsonResponse(job, { status: 201 });
  }

  const form = await req.formData();

  try {
    const authHeader = await getAuthHeader("org-admin-imports-upload");

    const fh = new Headers();
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/org-admin/imports`, {
      method: "POST",
      headers: fh,
      body: form,
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    const payload = (raw as any)?.data ?? raw;

    // Note: original code did NOT set x-mode header for POST,
    // so we also do not set mode here to preserve behavior.
    return jsonResponse(payload, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      {
        message: "Upload failed",
        error: String(e),
      },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/org-admin/imports/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/org-admin/imports/route.ts/POST",
  });
