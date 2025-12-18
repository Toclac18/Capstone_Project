import { mockTypesDB } from "@/mock/db.mock";
import type { UpdateTypeRequest } from "@/types/document-type";
import { USE_MOCK, BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    const body = (await request.json()) as UpdateTypeRequest;
    try {
      const result = mockTypesDB.update(id, body);
      return jsonResponse(
        {
          success: true,
          message: "Update successful (Mock)",
          data: result,
          timestamp: new Date().toISOString(),
        },
        {
          status: 200,
          headers: { "content-type": "application/json", "x-mode": "mock" },
        },
      );
    } catch (error: any) {
      return jsonResponse(
        {
          success: false,
          message: error.message,
        },
        {
          status: 400,
          headers: { "content-type": "application/json", "x-mode": "mock" },
        },
      );
    }
  }

  // 2. Real Backend Logic
  const bearerToken = await getAuthHeader();
  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const url = `${BE_BASE}/api/admin/doc-types/${id}`;

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
  return proxyJsonResponse(upstream, { mode: "real" });
}
