import { headers } from "next/headers";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import axios from "axios";
import FormDataLib from "form-data";

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

    const bearerToken = await getAuthHeader();
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

    // Read FormData from request
    const formData = await request.formData();
    
    // Validate required parts
    const infoPart = formData.get("info");
    const filePart = formData.get("file");
    
    if (!infoPart) {
      return jsonResponse(
        { error: "Missing 'info' part in form data" },
        { status: 400 }
      );
    }
    if (!filePart || !(filePart instanceof File)) {
      return jsonResponse(
        { error: "Missing 'file' part in form data" },
        { status: 400 }
      );
    }
    
    // Use form-data library to ensure proper Content-Type with boundary
    const forwardFormData = new FormDataLib();
    
    // Append "info" part as JSON string with Content-Type: application/json
    forwardFormData.append("info", infoPart as string, {
      contentType: "application/json",
    });
    
    // Append "file" part as Buffer
    const fileBuffer = Buffer.from(await (filePart as File).arrayBuffer());
    forwardFormData.append("file", fileBuffer, {
      filename: (filePart as File).name,
      contentType: (filePart as File).type || "application/octet-stream",
    });

    // Use axios to forward request - it handles form-data library correctly
    const axiosHeaders: Record<string, string> = {};
    if (bearerToken) {
      axiosHeaders["Authorization"] = bearerToken;
    }
    if (ip) {
      axiosHeaders["X-Forwarded-For"] = ip;
    }
    
    // form-data library sets Content-Type with boundary automatically
    const contentType = forwardFormData.getHeaders()["content-type"];
    if (contentType) {
      axiosHeaders["Content-Type"] = contentType;
    }

    try {
      const response = await axios.post(
        `${BE_BASE}/api/documents/upload`,
        forwardFormData,
        {
          headers: axiosHeaders,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      return jsonResponse(response.data, {
        status: response.status,
        mode: "real",
      });
    } catch (error: any) {
      if (error.response) {
        return proxyJsonResponse(
          new Response(JSON.stringify(error.response.data), {
            status: error.response.status,
            headers: {
              "content-type": "application/json",
            },
          }),
          { mode: "real" },
        );
      }
      return jsonResponse(
        { error: error.message || "Failed to upload document" },
        { status: 500 },
      );
    }
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
