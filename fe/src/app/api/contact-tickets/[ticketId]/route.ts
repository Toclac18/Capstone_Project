// app/api/contact-tickets/[ticketId]/route.ts
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";
import {
  MOCK_CONTACT_TICKET,
  MOCK_CONTACT_TICKET_LIST,
} from "@/mock/contact-ticket.mock";
import { getAuthHeader } from "@/server/auth";

async function handleGETCore(ticketId: string) {
  if (!ticketId) {
    return badRequest("Missing ticketId");
  }

  // MOCK mode: use your mock file
  if (USE_MOCK) {
    const found =
      MOCK_CONTACT_TICKET_LIST.find((t) => t.id === ticketId) ||
      MOCK_CONTACT_TICKET;

    return jsonResponse(found);
  }

  // Get authentication from cookie
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/contact-tickets/${ticketId}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;

  return withErrorBoundary(() => handleGETCore(ticketId), {
    context: "api/contact-tickets/[ticketId]/route.ts/GET",
  });
}
