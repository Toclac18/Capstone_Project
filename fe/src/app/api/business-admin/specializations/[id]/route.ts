import { mockSpecializationsDB } from "@/mock/db.mock";
import type { UpdateSpecializationRequest } from "@/types/document-specialization";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    const body = (await request.json()) as UpdateSpecializationRequest;
    try {
      const result = mockSpecializationsDB.update(id, body);
      return jsonResponse(result, {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (error: any) {
      return jsonResponse({ message: error.message }, {
        status: 400,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
  }

  // Get authentication from cookie
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const url = `${BE_BASE}/api/admin/specializations/${id}`;

  // Read and stringify request body to avoid duplex option error
  let body: string;
  try {
    const jsonBody = await request.json();
    body = JSON.stringify(jsonBody);
  } catch {
    body = JSON.stringify({});
  }

  const upstream = await fetch(url, {
    method: "PUT",
    headers: fh,
    body,
    cache: "no-store",
  });

  // Backend returns ApiResponse<SpecializationDetailResponse>, extract data
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const text = await upstream.text();
  try {
    const apiResponse = JSON.parse(text);
    // Extract data from { success, data, timestamp } format
    const data = apiResponse.data || apiResponse;
    return jsonResponse(data, {
      status: upstream.status,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch {
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}