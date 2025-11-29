import { mockTypesDB } from "@/mock/db.mock";
import type { CreateTypeRequest, TypeQueryParams } from "@/types/document-type";
import { USE_MOCK, BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

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

  // Build query params matching backend API
  const searchParams = new URL(request.url).searchParams;
  const queryParams = new URLSearchParams();
  
  // Backend uses: name, page, size
  // Map frontend "search" param to backend "name" param
  const nameParam = searchParams.get("name") || searchParams.get("search");
  if (nameParam) {
    queryParams.append("name", nameParam);
  }
  // Backend uses page (0-indexed) and size for pagination
  // If no page/limit params, fetch first page with reasonable size
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit") || searchParams.get("size");
  
  if (pageParam || limitParam) {
    // Only send pagination if explicitly provided
    const page = pageParam ? Number(pageParam) - 1 : 0;
    const size = limitParam || "10";
    queryParams.append("page", String(page));
    queryParams.append("size", size);
  } else {
    // Default: fetch first page with large size to get all results for client-side pagination
    queryParams.append("page", "0");
    queryParams.append("size", "1000"); // Large size to fetch all
  }
  
  const url = `${BE_BASE}/api/admin/doc-types${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  // Backend returns: { success, message, data: DocType[], pageInfo, timestamp }
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const text = await upstream.text();
  try {
    const backendResponse = JSON.parse(text);
    
    // Backend format: { success, message, data: DocType[], pageInfo: { page, size, totalElements, ... }, timestamp }
    const types = Array.isArray(backendResponse.data) ? backendResponse.data : [];
    const pageInfo = backendResponse.pageInfo || {};
    
    // Transform to FE format - map backend fields to frontend format
    const transformed = {
      types: types.map((type: any) => ({
        id: type.id,
        code: type.code,
        name: type.name,
        description: type.description,
        createdAt: type.createdAt || type.createdDate,
      })),
      total: pageInfo.totalElements ?? types.length, // Use totalElements from pageInfo
      page: (pageInfo.page ?? 0) + 1, // Backend uses 0-indexed, FE uses 1-indexed
      limit: pageInfo.size ?? 10,
    };
    
    return jsonResponse(transformed, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch (error: any) {
    console.error("Error parsing types response:", error);
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export async function POST(request: Request) {
  if (USE_MOCK) {
    const body = (await request.json()) as CreateTypeRequest;
    try {
      const result = mockTypesDB.create(body);
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

  const url = `${BE_BASE}/api/admin/doc-types`;

  // Read and stringify request body to avoid duplex option error
  let body: string;
  try {
    const jsonBody = await request.json();
    body = JSON.stringify(jsonBody);
  } catch {
    body = JSON.stringify({});
  }

  const upstream = await fetch(url, {
    method: "POST",
    headers: fh,
    body,
    cache: "no-store",
  });

  // Backend returns ApiResponse<DocTypeDetailResponse>, extract data
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