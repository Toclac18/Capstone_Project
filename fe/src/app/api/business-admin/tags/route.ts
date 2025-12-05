import { mockTagsDB } from "@/mock/db.mock";
import { getAuthHeader } from "@/server/auth";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import type { TagStatus } from "@/types/document-tag";

export async function GET(request: Request) {
  if (USE_MOCK) {
    const { searchParams } = new URL(request.url);
    const params = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as TagStatus | null) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      // Note: sortBy and sortOrder are handled in FE, not sent to BE
    };

    try {
      const tags = mockTagsDB.list(params);
      const page = searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1;
      const limit = searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : 10;
      const total = tags.length;

      const result = {
        tags,
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
  
  // Backend uses: status, name, page, size
  // Map frontend "search" param to backend "name" param
  if (searchParams.get("status")) {
    queryParams.append("status", searchParams.get("status")!);
  }
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
  
  const url = `${BE_BASE}/api/admin/tags${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  // Backend returns: { success, message, data: Tag[], pageInfo, timestamp }
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const text = await upstream.text();
  try {
    const backendResponse = JSON.parse(text);
    
    // Backend format: { success, message, data: Tag[], pageInfo: { page, size, totalElements, ... }, timestamp }
    const tags = Array.isArray(backendResponse.data) ? backendResponse.data : [];
    const pageInfo = backendResponse.pageInfo || {};
    
    // Transform to FE format - map backend fields to frontend format
    const transformed = {
      tags: tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        status: tag.status,
        createdDate: tag.createdAt || tag.createdDate, // Backend uses createdAt, FE uses createdDate
      })),
      total: pageInfo.totalElements ?? tags.length, // Use totalElements from pageInfo
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
    console.error("Error parsing tags response:", error);
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export async function POST(request: Request) {
  if (USE_MOCK) {
    const body = (await request.json()) as { name: string };
    try {
      const result = mockTagsDB.create(body);
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

  const url = `${BE_BASE}/api/admin/tags`;

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

  // Backend returns ApiResponse<TagResponse>, extract data
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