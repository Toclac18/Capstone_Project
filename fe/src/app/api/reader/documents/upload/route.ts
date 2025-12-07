import { headers } from "next/headers";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePOST(request: Request) {
  try {
    if (USE_MOCK) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return jsonResponse(
          { error: "File is required" },
          {
            status: 400,
            headers: {
              "content-type": "application/json",
              "x-mode": "mock",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          id: "doc-" + Date.now(),
          message: "Your document has been uploaded successfully. (mock)",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-mode": "mock",
          },
        },
      );
    }

    const h = await headers();
    const authHeader = h.get("authorization") || "";
    const cookieHeader = h.get("cookie") || "";

    const fh = new Headers();
    if (authHeader) fh.set("Authorization", authHeader);
    if (cookieHeader) fh.set("Cookie", cookieHeader);

    // Read FormData from request and create new one for forwarding
    const formData = await request.formData();
    const forwardFormData = new FormData();
    formData.forEach((value, key) => {
      forwardFormData.append(key, value);
    });

    const upstream = await fetch(`${BE_BASE}/api/reader/documents/upload`, {
      method: "POST",
      headers: fh,
      body: forwardFormData,
      cache: "no-store",
    });

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to upload document",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/reader/documents/upload/route.ts/POST",
  });
