import { headers } from "next/headers";
import { mockDB, type ContactAdminPayload } from "@/mock/db";

const USE_MOCK = process.env.USE_MOCK === "true";
const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export async function GET() {
  if (USE_MOCK) {
    const data = mockDB.list();
    return new Response(JSON.stringify({ items: data, total: data.length }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
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
  ] as const;
  for (const k of required) {
    if (!body[k] || (typeof body[k] === "string" && !String(body[k]).trim())) {
      return badRequest(`Field "${k}" is required`);
    }
  }

  if (USE_MOCK) {
    if (body.category === "OTHER" && body.otherCategory) {
      body.subject = `[OTHER: ${body.otherCategory}] ${body.subject}`;
    }
    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const ticket = mockDB.insert(body);

    const response = {
      ticketId: ticket.ticketId,
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      message: "Your message has been received. (mock)",
      meta: { ip },
    };
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }

  // (Sau này) Proxy thật
  // const token = cookies().get(process.env.COOKIE_NAME || "access_token")?.value ?? "";
  const upstream = await fetch(`${BE_BASE}/contact/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await upstream.text();
  const contentType =
    upstream.headers.get("content-type") ?? "application/json";
  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}
