// PUT /api/reviewer/review-list/[id]/submit -> BE PUT /api/review-requests/{reviewRequestId}/submit
import { proxyJsonResponse, jsonResponse, badRequest } from "@/server/response";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { headers } from "next/headers";
import axios from "axios";
import FormDataLib from "form-data";

const MAX_REPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

async function handlePUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing reviewRequestId");

  if (USE_MOCK) {
    // Optional safety: check Content-Length if available
    const contentLengthHeader = req.headers.get("content-length");
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

    // Mock response
    return jsonResponse(
      {
        success: true,
        data: {
          id,
          decision: "APPROVED",
        },
        message: "Review submitted successfully",
      },
      {
        status: 201,
        mode: "mock",
      },
    );
  }

  const bearerToken = await getAuthHeader();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  // Read FormData from request
  const formData = await req.formData();
  
  // Validate required parts
  const requestPart = formData.get("request");
  const reportFilePart = formData.get("reportFile");
  
  if (!requestPart) {
    return badRequest("Missing 'request' part in form data");
  }
  if (!reportFilePart || !(reportFilePart instanceof File)) {
    return badRequest("Missing 'reportFile' part in form data");
  }
  
  // Use form-data library to ensure proper Content-Type with boundary
  // This works better with axios than with fetch for PUT method
  const forwardFormData = new FormDataLib();
  
  // Append "request" part as JSON string with Content-Type: application/json
  forwardFormData.append("request", requestPart as string, {
    contentType: "application/json",
  });
  
  // Append "reportFile" part as Buffer
  const fileBuffer = Buffer.from(await (reportFilePart as File).arrayBuffer());
  forwardFormData.append("reportFile", fileBuffer, {
    filename: (reportFilePart as File).name,
    contentType: (reportFilePart as File).type || "application/octet-stream",
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
    const response = await axios.put(
      `${BE_BASE}/api/review-requests/${id}/submit`,
      forwardFormData,
      {
        headers: axiosHeaders,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    // Backend returns ApiResponse<DocumentReviewResponse>
    const backendData = response.data;
    const data = backendData?.data || backendData;

    return jsonResponse(data, {
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
      { error: error.message || "Failed to submit review" },
      { status: 500 },
    );
  }
}

export { handlePUT as PUT };
