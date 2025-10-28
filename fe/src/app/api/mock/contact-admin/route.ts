import { cookies, headers } from "next/headers";
import { mockDB, type ContactAdminPayload } from "@/mock/db";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export async function GET() {
  // Dùng để xem list mock ticket khi test
  const data = mockDB.list();
  return new Response(JSON.stringify({ items: data, total: data.length }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  // Middleware đã chặn nhưng double-check vẫn tốt
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized (mock)" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: ContactAdminPayload;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  // Validate tối thiểu
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
