import { headers, cookies } from "next/headers";
import { NextRequest } from "next/server";
import { mockFetchImports, mockFetchImportDetail, mockCreateImport } from "@/mock/imports";

const DEFAULT_BE_BASE = "http://localhost:8081";

export async function GET(req: NextRequest) {
    const USE_MOCK = process.env.USE_MOCK === "true";
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const download = url.searchParams.get("download");

    // --- CSV download ---
    if (download === "csv" && id) {
        if (USE_MOCK) {
            const job = await mockFetchImportDetail(id);
            if (!job) return new Response("Not found", { status: 404 });
            const lines = [
                ["Row", "Full Name", "Username", "Email", "Imported", "Email Sent", "Error"].join(","),
                ...job.results.map(r =>
                    [r.row, r.fullName, r.username, r.email, r.imported, r.emailSent, r.error ?? ""]
                        .map(v => typeof v === "string" && v.includes(",") ? `"${v}"` : String(v)).join(","))
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
        const { upstream, status, headers: h } = await forward(req, `/api/org-admin/imports/${id}/result`);
        const text = await upstream.text();
        return new Response(text, { status, headers: { "content-type": h.get("content-type") ?? "text/csv" } });
    }

    // --- Detail ---
    if (id) {
        if (USE_MOCK) {
            const job = await mockFetchImportDetail(id);
            if (!job) return new Response("Not found", { status: 404 });
            return json(job, 200, { "x-mode": "mock" });
        }
        const { upstream } = await forward(req, `/api/org-admin/imports/${id}`);
        const raw = await upstream.json().catch(() => ({}));
        return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
    }

    // --- List ---
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const q = url.searchParams.get("q") ?? "";
    const status = url.searchParams.get("status") ?? "ALL";

    if (USE_MOCK) {
        const data = await mockFetchImports({ page, pageSize, q, status: status as any });
        return json(data, 200, { "x-mode": "mock" });
    }
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    if (q) qs.set("q", q);
    if (status && status !== "ALL") qs.set("status", status);
    const path = `/api/org-admin/imports?${qs.toString()}`;
    const { upstream } = await forward(req, path);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status, { "x-mode": "real" });
}

export async function POST(req: NextRequest) {
    const USE_MOCK = process.env.USE_MOCK === "true";
    if (USE_MOCK) {
        const form = await req.formData();
        const file = form.get("file");
        const createdBy = String(form.get("createdBy") ?? "system");
        if (!(file instanceof File)) return new Response("Bad file", { status: 400 });
        const job = await mockCreateImport(file, createdBy);
        return json(job, 201);
    }
    const form = await req.formData();
    const { upstream } = await forwardForm(req, `/api/org-admin/imports`, form);
    const raw = await upstream.json().catch(() => ({}));
    return json(raw?.data ?? raw, upstream.status);
}

// Helpers
function beBase() {
    return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || DEFAULT_BE_BASE;
}

async function forward(req: NextRequest, path: string) {
    const h = await headers();
    const cookieStore = cookies();
    const headerAuth = h.get("authorization") || "";
    const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
    const effectiveAuth = headerAuth || cookieAuth;
    const upstreamUrl = beBase() + path;
    const upstream = await fetch(upstreamUrl, {
        headers: { ...(effectiveAuth ? { Authorization: effectiveAuth } : {}) },
        cache: "no-store",
    });
    return { upstream, status: upstream.status, headers: upstream.headers };
}
async function forwardForm(req: NextRequest, path: string, body: FormData) {
    const h = await headers();
    const cookieStore = cookies();
    const headerAuth = h.get("authorization") || "";
    const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
    const effectiveAuth = headerAuth || cookieAuth;
    const upstreamUrl = beBase() + path;
    const upstream = await fetch(upstreamUrl, { method: "POST", headers: { ...(effectiveAuth ? { Authorization: effectiveAuth } : {}) }, body });
    return { upstream };
}
function json(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
    return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...extraHeaders } });
}
