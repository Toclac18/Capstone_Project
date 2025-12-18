import { headers } from "next/headers";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { jsonResponse } from "@/server/response";
import FormData from "form-data";
import axios from "axios";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes timeout for Vercel

async function handlePOST(request: Request) {
  try {
    if (USE_MOCK) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return jsonResponse(
          { error: "File is required" },
          { status: 400, mode: "mock" },
        );
      }

      return jsonResponse(
        {
          id: "doc-" + Date.now(),
          message: "Your document has been uploaded successfully. (mock)",
        },
        { status: 200, mode: "mock" },
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
        { status: 400 },
      );
    }
    if (!filePart || !(filePart instanceof File)) {
      return jsonResponse(
        { error: "Missing 'file' part in form data" },
        { status: 400 },
      );
    }

    // Get info as string
    let infoString: string;
    if (infoPart instanceof Blob) {
      infoString = await infoPart.text();
    } else {
      infoString = infoPart as string;
    }

    // Use form-data library to properly set Content-Type for each part
    const forwardFormData = new FormData();

    // Append info with application/json content type
    forwardFormData.append("info", infoString, {
      contentType: "application/json",
    });

    // Append file with proper content type
    const fileBuffer = Buffer.from(await filePart.arrayBuffer());
    forwardFormData.append("file", fileBuffer, {
      filename: filePart.name,
      contentType: filePart.type || "application/pdf",
    });

    // Build headers
    const axiosHeaders: Record<string, string> = {
      ...forwardFormData.getHeaders(),
    };
    if (bearerToken) {
      axiosHeaders["Authorization"] = bearerToken;
    }
    if (ip) {
      axiosHeaders["X-Forwarded-For"] = ip;
    }

    try {
      const response = await axios.post(
        `${BE_BASE}/api/documents/upload`,
        forwardFormData,
        {
          headers: axiosHeaders,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 300000, // 5 minutes
        },
      );

      return jsonResponse(response.data, {
        status: response.status,
        mode: "real",
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return jsonResponse(error.response.data, {
          status: error.response.status,
          mode: "real",
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Upload error:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload document",
      },
      { status: 500 },
    );
  }
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/reader/documents/upload/route.ts/POST",
  });
