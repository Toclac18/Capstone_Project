import { mockSpecializationsDB } from "@/mock/dbMock";
import type {
  CreateSpecializationRequest,
  SpecializationQueryParams,
} from "@/types/document-specialization";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

export async function GET(request: Request) {
  if (USE_MOCK) {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");

    if (!domainId) {
      return jsonResponse({ message: "domainId is required" }, {
        status: 400,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }

    const params: SpecializationQueryParams = {
      domainId,
      search: searchParams.get("search") || undefined,
    };

    try {
      const specializations = mockSpecializationsDB.list(params);
      const page = searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1;
      const limit = searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : 10;
      const total = specializations.length;

      const result = {
        specializations,
        total,
        page,
        limit,
      };
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

  const url = `${BE_BASE}/api/business-admin/specializations?${new URL(request.url).searchParams.toString()}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

    return proxyJsonResponse(upstream, { mode: "real" });
}

export async function POST(request: Request) {
  if (USE_MOCK) {
    const body = (await request.json()) as CreateSpecializationRequest;
    try {
      const result = mockSpecializationsDB.create(body);
      return jsonResponse(result, {
        status: 201,
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

  const url = `${BE_BASE}/api/business-admin/specializations`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: fh,
    body: request.body,
    cache: "no-store",
  });

    return proxyJsonResponse(upstream, { mode: "real" });
}