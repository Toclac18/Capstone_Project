import { cookies } from "next/headers";
import { mockDocumentsDB } from "@/mock/db";

const DEFAULT_BE_BASE = "http://localhost:8080";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const { id } = await ctx.params;

  try {
    const body = await request.json();
    const reason = body.reason?.trim() || "";

    // Validate reason
    if (!reason) {
      return new Response(
        JSON.stringify({
          error: "Reason is required",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }

    if (reason.length < 10) {
      return new Response(
        JSON.stringify({
          error: "Reason must be at least 10 characters",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }

    if (USE_MOCK) {
      // Check if document already has re-review request
      const result = mockDocumentsDB.requestReReview(id, reason);
      
      if (result.error) {
        return new Response(
          JSON.stringify({
            error: result.error,
          }),
          {
            status: result.status || 400,
            headers: {
              "content-type": "application/json",
              "x-mode": "mock",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          message:
            "Your request has been submitted and is under review.",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-mode": "mock",
          },
        }
      );
    }

    // Lấy authentication từ cookie
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
    const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

    // Backend chỉ nhận Authorization header, không nhận cookie
    const fh = new Headers({ "Content-Type": "application/json" });
    if (bearerToken) {
      fh.set("Authorization", bearerToken);
    }

    const upstream = await fetch(`${BE_BASE}/api/reader/documents/${id}/re-review`, {
      method: "POST",
      headers: fh,
      body: JSON.stringify({ reason }),
      cache: "no-store",
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
        "x-mode": "real",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unable to submit request. Please try again later.",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }
}


