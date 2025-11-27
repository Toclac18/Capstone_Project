import { NextRequest } from "next/server";
import { mockSystemLogs } from "@/mock/systemLogs";
import type { SystemLog, SystemLogQueryParams } from "@/types/system-log";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

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

async function handleGET(req: NextRequest): Promise<Response> {
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

    return jsonResponse(
      {
        logs: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200, mode: "mock" },
    );
  }

  try {
    const queryString = req.nextUrl.searchParams.toString();
    const url = queryString
      ? `${BE_BASE}/api/v1/system-admin/logs?${queryString}`
      : `${BE_BASE}/api/v1/system-admin/logs`;

    const authHeader = await getAuthHeader("system-admin-logs");
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(url, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    const text = await upstream.text();

    if (!text || text.trim() === "") {
      return jsonResponse(
        {
          message: "Empty response from server",
          logs: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        { status: upstream.status || 502, mode: "real" },
      );
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return jsonResponse(
        {
          message: "Invalid JSON response from server",
          error: text.substring(0, 200),
          logs: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        { status: 502, mode: "real" },
      );
    }

    // Handle PagedResponse<SystemLogResponse>
    if (data && typeof data === "object" && "data" in data && "pageInfo" in data) {
      const items = Array.isArray(data.data) ? data.data : [];
      const pageInfo = data.pageInfo ?? {};

      return jsonResponse(
        {
          logs: items,
          total: pageInfo.totalElements ?? items.length ?? 0,
          page: pageInfo.page ?? pageInfo.pageNumber ?? 1,
          limit: pageInfo.size ?? pageInfo.pageSize ?? 10,
          totalPages:
            pageInfo.totalPages ??
            Math.ceil(
              (pageInfo.totalElements ?? items.length ?? 0) /
                (pageInfo.size ?? 10),
            ),
        },
        { status: upstream.status, mode: "real" },
      );
    }

    // If backend already returns { logs, total, page, limit, totalPages }
    if (data && typeof data === "object" && "logs" in data) {
      return jsonResponse(data, {
        status: upstream.status,
        mode: "real",
      });
    }

    // Generic error wrapper
    if (data && typeof data === "object" && ("message" in data || "error" in data)) {
      return jsonResponse(
        {
          message: data.message || data.error || "Error from server",
          logs: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        { status: upstream.status || 500, mode: "real" },
      );
    }

    // Fallback: return raw data
    return jsonResponse(data, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      {
        message: "Failed to fetch system logs",
        error: String(e),
        logs: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      { status: 502, mode: "real" },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/system-admin/logs/route.ts/GET",
  });

