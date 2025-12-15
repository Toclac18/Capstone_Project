import { BE_BASE, COOKIE_NAME } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

async function handleGET(req: Request, context: RouteContext) {
  const { ticketId } = await context.params;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAME)?.value;

  const upstream = await fetch(`${BE_BASE}/api/contact-tickets/${ticketId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    let errorMsg = "Failed to fetch ticket";
    try {
      const json = JSON.parse(text);
      errorMsg = json?.message || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    return Response.json({ error: errorMsg }, { status: upstream.status });
  }

  const json = await upstream.json();
  return Response.json(json);
}

async function handlePATCH(req: Request, context: RouteContext) {
  const { ticketId } = await context.params;
  const body = await req.json();

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAME)?.value;

  const upstream = await fetch(`${BE_BASE}/api/contact-tickets/${ticketId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    let errorMsg = "Failed to update ticket";
    try {
      const json = JSON.parse(text);
      errorMsg = json?.message || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    return Response.json({ error: errorMsg }, { status: upstream.status });
  }

  const json = await upstream.json();
  return Response.json(json);
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/business-admin/tickets/[ticketId]/route.ts/GET",
  });

export const PATCH = (...args: Parameters<typeof handlePATCH>) =>
  withErrorBoundary(() => handlePATCH(...args), {
    context: "api/business-admin/tickets/[ticketId]/route.ts/PATCH",
  });
