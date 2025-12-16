// app/api/contact-admin/route.ts
import { headers } from "next/headers";
import { mockDB, type ContactAdminPayload } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest, jsonResponse } from "@/server/response";

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

  const upstream = await fetch(`${BE_BASE}/api/contact-tickets`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    let errorMsg = "Failed to submit ticket";
    try {
      const json = JSON.parse(text);
      errorMsg = json?.message || json?.error || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    return jsonResponse({ error: errorMsg }, { status: upstream.status });
  }

  // Parse backend response
  const text = await upstream.text();
  try {
    const json = JSON.parse(text);
    // Backend may wrap in { data: ... } or return directly
    const data = json?.data || json;
    return jsonResponse({
      ticketId: data.ticketId,
      ticketCode: data.ticketCode,
      status: data.status,
      message: data.message || "Your ticket has been submitted successfully!",
    }, { status: 201 });
  } catch {
    return jsonResponse({
      ticketId: null,
      ticketCode: null,
      status: "NEW",
      message: "Ticket submitted successfully",
    }, { status: 201 });
  }
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/admin/contact/route.ts/POST",
  });
