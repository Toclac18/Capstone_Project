import { mockTypesDB } from "@/mock/dbMock";
import type { UpdateTypeRequest } from "@/types/document-type";
import { USE_MOCK, BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    const body = (await request.json()) as UpdateTypeRequest;
    try {
      const result = mockTypesDB.update(id, body);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ message: error.message }), {
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

  const url = `${BE_BASE}/api/business-admin/types/${id}`;

  const upstream = await fetch(url, {
    method: "PUT",
    headers: fh,
    body: request.body,
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
}
