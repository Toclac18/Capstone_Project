import { mockTypesDB } from "@/mock/dbMock";
import type { CreateTypeRequest, TypeQueryParams } from "@/types/document-type";
import { USE_MOCK, BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";

export async function GET(request: Request) {
  if (USE_MOCK) {
    const { searchParams } = new URL(request.url);
    const params: TypeQueryParams = {
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      // Note: sortBy and sortOrder are handled in FE, not sent to BE
    };

    try {
      const types = mockTypesDB.list(params);
      const page = searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1;
      const limit = searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : 10;
      const total = types.length;

      const result = {
        types,
        total,
        page,
        limit,
      };
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

  const url = `${BE_BASE}/api/business-admin/types?${new URL(request.url).searchParams.toString()}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
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

export async function POST(request: Request) {
  if (USE_MOCK) {
    const body = (await request.json()) as CreateTypeRequest;
    try {
      const result = mockTypesDB.create(body);
      return new Response(JSON.stringify(result), {
        status: 201,
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

  const url = `${BE_BASE}/api/business-admin/types`;

  const upstream = await fetch(url, {
    method: "POST",
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
