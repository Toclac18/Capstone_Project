import { headers } from "next/headers";

const DEFAULT_BE_BASE = "http://localhost:8080";

export async function POST(request: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  try {
    if (USE_MOCK) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return new Response(JSON.stringify({ error: "File is required" }), {
          status: 400,
          headers: {
            "content-type": "application/json",
            "x-mode": "mock",
          },
        });
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
        }
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
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to upload document",
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

