import { NextRequest } from "next/server";
import { mockSystemLogs } from "@/mock/systemLogs";
import type { SystemLog, SystemLogQueryParams } from "@/types/system-log";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

function filterLogs(
  logs: SystemLog[],
  params: SystemLogQueryParams,
): SystemLog[] {
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
    filtered = filtered.filter(
      (log) => log.targetUserId === params.targetUserId,
    );
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
        log.userAgent?.toLowerCase().includes(searchLower),
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
    // Convert limit to size for Spring Data Pageable
    const sp = req.nextUrl.searchParams;
    const backendParams = new URLSearchParams();

    // Map frontend params to backend params
    // Frontend uses 1-based page, Spring Data uses 0-based
    if (sp.get("page")) {
      const frontendPage = parseInt(sp.get("page")!, 10);
      const backendPage = Math.max(0, frontendPage - 1); // Convert to 0-based
      backendParams.set("page", String(backendPage));
    }
    if (sp.get("limit")) backendParams.set("size", sp.get("limit")!); // Spring uses "size" not "limit"
    if (sp.get("action")) backendParams.set("action", sp.get("action")!);
    if (sp.get("userId")) backendParams.set("userId", sp.get("userId")!);
    if (sp.get("targetUserId"))
      backendParams.set("targetUserId", sp.get("targetUserId")!);
    if (sp.get("userRole")) backendParams.set("userRole", sp.get("userRole")!);
    if (sp.get("ipAddress"))
      backendParams.set("ipAddress", sp.get("ipAddress")!);
    // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO datetime format
    if (sp.get("startDate")) {
      const startDateValue = sp.get("startDate")!;
      // If format is YYYY-MM-DDTHH:mm, convert to ISO format
      if (startDateValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        // Parse as local time, then convert to ISO
        const date = new Date(startDateValue);
        backendParams.set("startDate", date.toISOString());
      } else {
        backendParams.set("startDate", startDateValue);
      }
    }
    if (sp.get("endDate")) {
      const endDateValue = sp.get("endDate")!;
      // If format is YYYY-MM-DDTHH:mm, convert to ISO format
      if (endDateValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        // Parse as local time, then convert to ISO
        const date = new Date(endDateValue);
        backendParams.set("endDate", date.toISOString());
      } else {
        backendParams.set("endDate", endDateValue);
      }
    }
    if (sp.get("search")) backendParams.set("search", sp.get("search")!);
    // Spring Data uses "sort" parameter, not "sortBy" and "sortOrder"
    if (sp.get("sortBy")) {
      const sortBy = sp.get("sortBy")!;
      const sortOrder = sp.get("sortOrder") || "desc";
      backendParams.set("sort", `${sortBy},${sortOrder}`);
    }

    const queryString = backendParams.toString();
    const url = queryString
      ? `${BE_BASE}/api/system-admin/logs?${queryString}`
      : `${BE_BASE}/api/system-admin/logs`;

    const authHeader = await getAuthHeader("system-admin-logs");
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(url, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    const text = await upstream.text();

    // Debug log
    console.log("[SystemLogs API] Backend URL:", url);
    console.log("[SystemLogs API] Response status:", upstream.status);
    console.log(
      "[SystemLogs API] Response text (first 500 chars):",
      text.substring(0, 500),
    );

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
    } catch (e) {
      console.error("[SystemLogs API] JSON parse error:", e);
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

    // Debug log parsed data
    console.log("[SystemLogs API] Parsed data keys:", Object.keys(data || {}));
    console.log("[SystemLogs API] Has 'data'?", "data" in (data || {}));
    console.log("[SystemLogs API] Has 'pageInfo'?", "pageInfo" in (data || {}));
    if (data?.data) {
      console.log(
        "[SystemLogs API] data.data length:",
        Array.isArray(data.data) ? data.data.length : "not array",
      );
    }
    if (data?.pageInfo) {
      console.log("[SystemLogs API] pageInfo:", JSON.stringify(data.pageInfo));
    }

    // Handle PagedResponse<SystemLogResponse>
    if (
      data &&
      typeof data === "object" &&
      "data" in data &&
      "pageInfo" in data
    ) {
      const items = Array.isArray(data.data) ? data.data : [];
      const pageInfo = data.pageInfo ?? {};

      console.log(
        "[SystemLogs API] Returning response with",
        items.length,
        "items",
      );

      return jsonResponse(
        {
          logs: items,
          total: pageInfo.totalElements ?? items.length ?? 0,
          page: (pageInfo.page ?? pageInfo.pageNumber ?? 0) + 1, // Spring Data uses 0-based, frontend uses 1-based
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
    if (
      data &&
      typeof data === "object" &&
      ("message" in data || "error" in data)
    ) {
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
