// app/api/contact-tickets/code/[ticketCode]/route.ts
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";
import {
  MOCK_CONTACT_TICKET,
  MOCK_CONTACT_TICKET_LIST,
} from "@/mock/contact-ticket.mock";
import { getAuthHeader } from "@/server/auth";

async function handleGETCore(ticketCode: string) {
  if (!ticketCode) {
    return badRequest("Missing ticketCode");
  }

  // MOCK mode
  if (USE_MOCK) {
    const found =
      MOCK_CONTACT_TICKET_LIST.find((t) => t.ticketCode === ticketCode) ||
      MOCK_CONTACT_TICKET;

    return jsonResponse(found);
  }

  // Get authentication from cookie
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(
    `${BE_BASE}/api/contact-tickets/code/${encodeURIComponent(ticketCode)}`,
    {
      method: "GET",
      headers: fh,
      cache: "no-store",
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketCode: string }> },
) {
  const { ticketCode } = await params;

  return withErrorBoundary(() => handleGETCore(ticketCode), {
    context: "api/contact-tickets/code/[ticketCode]/route.ts/GET",
  });
}
