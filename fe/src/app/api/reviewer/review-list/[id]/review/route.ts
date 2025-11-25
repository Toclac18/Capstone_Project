import { cookies } from "next/headers";
import type { ReviewAction } from "@/types/review";
import { submitReview } from "@/mock/review-list.mock";
import { getAuthHeader } from "@/server/auth";

const DEFAULT_BE_BASE = "http://localhost:8080";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
const MAX_REPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

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
    const { searchParams } = new URL(request.url);
    const action =
      (searchParams.get("action") as ReviewAction | null) ?? "APPROVE";

    // Optional safety: check Content-Length if available
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (
        !Number.isNaN(contentLength) &&
        contentLength > MAX_REPORT_SIZE_BYTES
      ) {
        return new Response(
          JSON.stringify({
            message: "Report file must be 10MB or smaller.",
          }),
          {
            status: 413,
            headers: {
              "content-type": "application/json",
              "x-mode": "mock",
            },
          },
        );
      }
    }

    const result = submitReview(id, action);

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

  const authHeader =
    (await getAuthHeader("api/reviewer/review-list/[id]/review/route.ts")) ||
    bearerToken;

  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }

  const upstream = await fetch(
    `${BE_BASE}/api/reviewer/review-list/${id}/review`,
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
