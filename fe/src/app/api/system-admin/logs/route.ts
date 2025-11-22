import { NextRequest, NextResponse } from "next/server";
import { mockSystemLogs } from "@/mock/systemLogs";
import type { SystemLog, SystemLogQueryParams } from "@/types/system-log";

const USE_MOCK = process.env.USE_MOCK === "true";

function filterLogs(logs: SystemLog[], params: SystemLogQueryParams): SystemLog[] {
  let filtered = [...logs];

  // Filter by action
  if (params.action) {
    filtered = filtered.filter((log) => log.action === params.action);
  }

  // Filter by userId
  if (params.userId) {
    filtered = filtered.filter((log) => log.userId === params.userId);
  }

  // Filter by targetUserId
  if (params.targetUserId) {
    filtered = filtered.filter((log) => log.targetUserId === params.targetUserId);
  }

  // Filter by userRole
  if (params.userRole) {
    filtered = filtered.filter((log) => log.userRole === params.userRole);
  }

  // Filter by IP address
  if (params.ipAddress) {
    filtered = filtered.filter((log) => log.ipAddress === params.ipAddress);
  }

  // Filter by date range
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    filtered = filtered.filter((log) => new Date(log.createdAt) >= startDate);
  }

  if (params.endDate) {
    const endDate = new Date(params.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter((log) => new Date(log.createdAt) <= endDate);
  }

  // Search in details, action, etc.
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.action.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.ipAddress?.toLowerCase().includes(searchLower) ||
        log.userAgent?.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = params.sortOrder || "desc";

  filtered.sort((a, b) => {
    let aVal: any = a[sortBy as keyof SystemLog];
    let bVal: any = b[sortBy as keyof SystemLog];

    if (sortBy === "createdAt") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  return filtered;
}

export async function GET(req: NextRequest) {
  if (USE_MOCK) {
    const sp = req.nextUrl.searchParams;

    const params: SystemLogQueryParams = {
      page: Math.max(1, Number(sp.get("page") || 1)),
      limit: Math.max(1, Number(sp.get("limit") || 10)),
      action: sp.get("action") || undefined,
      userId: sp.get("userId") || undefined,
      targetUserId: sp.get("targetUserId") || undefined,
      userRole: sp.get("userRole") || undefined,
      ipAddress: sp.get("ipAddress") || undefined,
      startDate: sp.get("startDate") || undefined,
      endDate: sp.get("endDate") || undefined,
      search: sp.get("search") || undefined,
      sortBy: sp.get("sortBy") || "createdAt",
      sortOrder: (sp.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const filtered = filterLogs(mockSystemLogs, params);
    const total = filtered.length;
    const page = params.page!;
    const limit = params.limit!;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      logs: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  // Forward to real BE
  const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8080";
  const queryString = req.nextUrl.searchParams.toString();
  const upstreamUrl = `${BE_BASE}/api/v1/system-admin/logs${queryString ? `?${queryString}` : ""}`;

  try {
    // Get auth headers
    const cookies = req.headers.get("cookie");
    const authorization = req.headers.get("authorization");
    
    const headers: HeadersInit = {};
    if (cookies) {
      headers["Cookie"] = cookies;
    }
    if (authorization) {
      headers["Authorization"] = authorization;
    }

    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Get response text first
    const text = await upstream.text();
    
    // Handle empty response
    if (!text || text.trim() === "") {
      return NextResponse.json(
        { message: "Empty response from server", logs: [], total: 0, page: 1, limit: 10, totalPages: 0 },
        { status: upstream.status || 502 }
      );
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // If not JSON, return error
      return NextResponse.json(
        { 
          message: "Invalid JSON response from server", 
          error: text.substring(0, 200),
          logs: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        },
        { status: 502 }
      );
    }

    // Handle BE response wrapper (PagedResponse format)
    if (data && typeof data === 'object') {
      // Check if it's PagedResponse format
      if ('data' in data && Array.isArray(data.data) && 'pageInfo' in data) {
        return NextResponse.json({
          logs: data.data,
          total: data.pageInfo?.totalElements || data.data.length,
          page: data.pageInfo?.page || data.pageInfo?.pageNumber || 1,
          limit: data.pageInfo?.size || data.pageInfo?.pageSize || 10,
          totalPages: data.pageInfo?.totalPages || Math.ceil((data.pageInfo?.totalElements || data.data.length) / (data.pageInfo?.size || 10)),
        }, { status: upstream.status });
      }
      
      // Check if it's direct format with logs array
      if ('logs' in data && Array.isArray(data.logs)) {
        return NextResponse.json(data, { status: upstream.status });
      }
      
      // If response has error structure
      if ('message' in data || 'error' in data) {
        return NextResponse.json(
          { 
            message: data.message || data.error || "Error from server",
            logs: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          },
          { status: upstream.status || 500 }
        );
      }
    }

    // Fallback: return as-is
    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    return NextResponse.json(
      { 
        message: "Failed to fetch system logs", 
        error: String(e),
        logs: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      },
      { status: 502 }
    );
  }
}

