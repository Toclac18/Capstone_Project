import { mockSpecializationsDB } from "@/mock/dbMock";
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

  const url = `${BE_BASE}/api/business-admin/specializations/${id}`;

  const upstream = await fetch(url, {
    method: "PUT",
    headers: fh,
    body: request.body,
    cache: "no-store",
  });

    return proxyJsonResponse(upstream, { mode: "real" });
}