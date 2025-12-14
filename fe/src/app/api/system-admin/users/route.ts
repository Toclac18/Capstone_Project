export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { mockUsersForRoleManagement } from "@/mock/roleManagement";
import type { UserQueryParams } from "@/types/user";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(_req: NextRequest): Promise<Response> {
  // GET is not supported, redirect to POST
  return jsonResponse(
    { error: "Method not allowed. Use POST instead." },
    { status: 405 },
  );
}

async function handlePOST(req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    try {
      const body = await req.json().catch(() => ({}));
      const params: UserQueryParams = {
        page: body.page || 1,
        limit: body.limit || 10,
        search: body.search || "",
        role: body.role || "",
        status: body.status || "",
        sortBy: body.sortBy || "createdAt",
        sortOrder: body.sortOrder || "desc",
        dateFrom: body.dateFrom || "",
        dateTo: body.dateTo || "",
      };

      // Filter users
      let filteredUsers = [...mockUsersForRoleManagement];

      // Apply search filter
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.name?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower),
        );
      }

      // Apply role filter
      if (params.role) {
        filteredUsers = filteredUsers.filter(
          (user) => user.role === params.role,
        );
      }

      // Apply status filter
      if (params.status) {
        filteredUsers = filteredUsers.filter(
          (user) => user.status === params.status,
        );
      }

      // Apply date filters
      if (params.dateFrom) {
        const dateFrom = new Date(params.dateFrom);
        filteredUsers = filteredUsers.filter(
          (user) => user.createdAt && new Date(user.createdAt) >= dateFrom,
        );
      }
      if (params.dateTo) {
        const dateTo = new Date(params.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        filteredUsers = filteredUsers.filter(
          (user) => user.createdAt && new Date(user.createdAt) <= dateTo,
        );
      }

      // Apply sorting
      const sortBy = params.sortBy || "createdAt";
      const sortOrder = params.sortOrder || "desc";
      filteredUsers.sort((a, b) => {
        let aValue: any = a[sortBy as keyof typeof a];
        let bValue: any = b[sortBy as keyof typeof b];

        if (sortBy === "createdAt") {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = (bValue || "").toLowerCase();
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      const result = {
        users: paginatedUsers,
        total: filteredUsers.length,
        page,
        limit,
      };

      return jsonResponse(result, { status: 200, mode: "mock" });
    } catch (error: any) {
      return jsonResponse(
        { error: error.message || "Failed to process request" },
        { status: 400, mode: "mock" },
      );
    }
  }

  // Forward to real BE
  let body: any = {};
  try {
    const bodyText = await req.text();
    if (bodyText && bodyText.trim()) {
      const parsed = JSON.parse(bodyText);
      // Clean up body: remove empty strings for enum fields and empty strings
      if (parsed && typeof parsed === "object") {
        for (const [key, value] of Object.entries(parsed)) {
          // Skip empty strings for enum fields (role, status) - they cause parse errors
          if ((key === "role" || key === "status") && value === "") {
            continue;
          }
          
          // Convert date strings to ISO datetime format
          if (key === "dateFrom" && value && typeof value === "string" && value.trim() !== "") {
            // Convert YYYY-MM-DD to ISO datetime format (start of day)
            // Use local timezone start of day, then convert to ISO
            const dateStr = value.trim();
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // YYYY-MM-DD format - set to start of day in local timezone, then convert to ISO
              const date = new Date(dateStr + "T00:00:00");
              body[key] = date.toISOString();
            } else {
              // Already in a different format, try to parse as-is
              body[key] = value;
            }
            continue;
          }
          if (key === "dateTo" && value && typeof value === "string" && value.trim() !== "") {
            // Convert YYYY-MM-DD to ISO datetime format (end of day)
            // Use local timezone end of day, then convert to ISO
            const dateStr = value.trim();
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // YYYY-MM-DD format - set to end of day in local timezone, then convert to ISO
              const date = new Date(dateStr + "T23:59:59.999");
              body[key] = date.toISOString();
            } else {
              // Already in a different format, try to parse as-is
              body[key] = value;
            }
            continue;
          }
          
          // Skip empty strings for other fields
          if (value === "") {
            continue;
          }
          body[key] = value;
        }
      }
    }
  } catch {
    // If body is empty or invalid, use empty object
    body = {};
  }

  const url = `${BE_BASE}/api/system-admin/users`;

  try {
    const authHeader = await getAuthHeader("system-admin-users");
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    // Ensure body is always a valid object (not empty string)
    const requestBody = Object.keys(body).length > 0 ? body : {};

    const upstream = await fetch(url, {
      method: "POST",
      headers: fh,
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const responseBody = await upstream.json().catch(() => ({}));

    if (responseBody && typeof responseBody === "object") {
      const data = responseBody.data || responseBody;

      // Spring Page format
      if (
        Array.isArray(data.content) &&
        typeof data.totalElements === "number"
      ) {
        const users = (data.content || []).map((user: any) => ({
          ...user,
          name: user.fullName || user.name || "",
        }));
        const mapped = {
          users,
          total: data.totalElements || 0,
          page: (data.number || 0) + 1, // 0-based -> 1-based
          limit: data.size || 10,
        };
        return jsonResponse(mapped, {
          status: upstream.status,
          mode: "real",
        });
      }

      // Already in { users, total, page, limit } format
      if (data.users && Array.isArray(data.users)) {
        const mappedUsers = data.users.map((user: any) => ({
          ...user,
          name: user.fullName || user.name || "",
        }));
        return jsonResponse(
          {
            ...data,
            users: mappedUsers,
          },
          { status: upstream.status, mode: "real" },
        );
      }
    }

    // Fallback: return upstream data as-is
    return jsonResponse(responseBody?.data ?? responseBody, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Upstream request failed", error: String(e) },
      { status: 502, mode: "real" },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/system-admin/users/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/system-admin/users/route.ts/POST",
  });
