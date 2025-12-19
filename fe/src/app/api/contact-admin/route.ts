// app/api/contact-admin/route.ts
import { headers } from "next/headers";
import { mockDB, type ContactAdminPayload } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePOST(req: Request) {
  let body: ContactAdminPayload;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const required = [
    "name",
    "email",
    "category",
    "urgency",
    "subject",
    "message",
  ];
  for (const k of required) {
    if (!(body as any)[k] || String((body as any)[k]).trim() === "") {
      return badRequest(`Field "${k}" is required`);
    }
  }

  if (USE_MOCK) {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ticket = mockDB.insert(body);
    const response = {
      ticketId: ticket.ticketId,
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      message: "Your message has been received. (mock)",
      meta: { ip },
    };
    return jsonResponse(response, {
      status: 201,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);
  if (ip) fh.set("X-Forwarded-For", ip);

  const upstream = await fetch(`${BE_BASE}/api/contact-admin`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/admin/contact/route.ts/POST",
  });
