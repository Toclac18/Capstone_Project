import { cookies } from "next/headers";
import type { ReviewAction } from "@/types/review";
import { approveReviewRequest } from "@/mock/reviewListMock";

const DEFAULT_BE_BASE = "http://localhost:8080";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const { id } = await params;

  if (USE_MOCK) {
    const body = (await request.json()) as { action?: ReviewAction };
    const action = body.action ?? "APPROVE";

    const result = approveReviewRequest(id, action);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Get authentication from cookie
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  const fh = new Headers();
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(
    `${BE_BASE}/api/reviewer/review-list/requests/${id}/approve`,
    {
      method: "POST",
      headers: fh,
      cache: "no-store",
      body: request.body,
    },
  );

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}
