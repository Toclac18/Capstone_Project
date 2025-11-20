import {
  mockCreateImport,
  mockFetchImportDetail,
  mockFetchImports,
} from "@/mock/imports";
import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";

function beBase() {
  return BE_BASE;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const download = url.searchParams.get("download");

  // --- CSV download ---
  if (download === "csv" && id) {
    if (USE_MOCK) {
      const job = await mockFetchImportDetail(id);
      if (!job) return new Response("Not found", { status: 404 });
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
      const {
        upstream,
        status,
        headers: h,
      } = await forward(`/api/org-admin/imports/${id}/result`);
      const csv = await upstream.text();
      const ct = h.get("content-type") ?? "text/csv; charset=utf-8";
      const cd =
        h.get("content-disposition") ??
        `attachment; filename=import_${id}_result.csv`;
      return new Response(csv, {
        status,
        headers: {
          "content-type": ct,
          "content-disposition": cd,
          "x-mode": "real",
        },
      });
    } catch (e: any) {
      return json({ message: "CSV download failed", error: String(e) }, 502);
    }
  }

  // --- Detail ---
  if (id) {
    if (USE_MOCK) {
      const job = await mockFetchImportDetail(id);
      if (!job) return new Response("Not found", { status: 404 });
      return json(job, 200, { "x-mode": "mock" });
    }

    try {
      const { upstream } = await forward(`/api/org-admin/imports/${id}`);
      const raw = await upstream.json().catch(() => ({}));
      return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
    } catch (e: any) {
      return json({ message: "Detail fetch failed", error: String(e) }, 502);
    }
  }

  // --- List ---
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
    return json(data, 200, { "x-mode": "mock" });
  }

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (q) qs.set("q", q);
  if (status && status !== "ALL") qs.set("status", status);

  const path = `/api/org-admin/imports?${qs.toString()}`;

  try {
    const { upstream } = await forward(path);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
  } catch (e: any) {
    return json({ message: "Import list fetch failed", error: String(e) }, 502);
  }
}

export async function POST(req: NextRequest) {
  if (USE_MOCK) {
    const form = await req.formData();
    const file = form.get("file");
    const createdBy = String(form.get("createdBy") ?? "system");
    if (!(file instanceof File))
      return new Response("Bad file", { status: 400 });
    const job = await mockCreateImport(file, createdBy);
    return json(job, 201);
  }

  const form = await req.formData();
  try {
    const { upstream } = await forwardForm(`/api/org-admin/imports`, form);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status);
  } catch (e: any) {
    return json({ message: "Upload failed", error: String(e) }, 502);
  }
}

// ---------- Helpers ----------
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

async function forwardForm(path: string, body: FormData) {
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
    method: "POST",
    headers: passHeaders,
    body,
  });
  return { upstream };
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