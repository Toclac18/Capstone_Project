export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { mockUsersForRoleManagement } from "@/mock/roleManagement";
import type { UserQueryParams } from "@/types/user";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

function beBase() {
  return (
    process.env.BE_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8080"
  );
}

async function forward(path: string, method: string = "GET", body?: any) {
  const h = await headers();
  const cookieStore = await cookies();

  // Get token from Authorization header or cookie
  const headerAuth = h.get("authorization") || "";
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value || "";
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";
  const effectiveAuth = headerAuth || bearerToken;

  const upstreamUrl = beBase() + path;
  const passHeaders: Record<string, string> = {
    ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
  };
  const cookieHeader = h.get("cookie");
  if (cookieHeader) passHeaders["cookie"] = cookieHeader;

  const fetchOptions: RequestInit = {
    method,
    headers: passHeaders,
    cache: "no-store",
  };

  // Always set Content-Type and body for POST/PATCH/PUT
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    passHeaders["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(body || {});
  }

  return fetch(upstreamUrl, fetchOptions);
}

export async function POST(req: NextRequest) {
  const USE_MOCK = process.env.USE_MOCK === "true";

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
            user.email.toLowerCase().includes(searchLower)
        );
      }

      // Apply role filter
      if (params.role) {
        filteredUsers = filteredUsers.filter(
          (user) => user.role === params.role
        );
      }

      // Apply status filter
      if (params.status) {
        filteredUsers = filteredUsers.filter(
          (user) => user.status === params.status
        );
      }

      // Apply date filters
      if (params.dateFrom) {
        const dateFrom = new Date(params.dateFrom);
        filteredUsers = filteredUsers.filter(
          (user) => user.createdAt && new Date(user.createdAt) >= dateFrom
        );
      }
      if (params.dateTo) {
        const dateTo = new Date(params.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        filteredUsers = filteredUsers.filter(
          (user) => user.createdAt && new Date(user.createdAt) <= dateTo
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

      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to process request" },
        { status: 400 }
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
          // Skip empty strings for other fields too
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

  const UPSTREAM_PATH = `/api/v1/system-admin/users`;

  try {
    const upstream = await forward(UPSTREAM_PATH, "POST", body);
    const responseBody = await upstream.json().catch(() => ({}));
    
    // Handle Spring Page response format
    // Spring Page has: { content: [], totalElements: number, number: number, size: number, ... }
    // Frontend expects: { users: [], total: number, page: number, limit: number }
    if (responseBody && typeof responseBody === 'object') {
      const data = responseBody.data || responseBody;
      
      // Check if it's Spring Page format
      if (Array.isArray(data.content) && typeof data.totalElements === 'number') {
        // Map fullName to name for each user
        const users = (data.content || []).map((user: any) => ({
          ...user,
          name: user.fullName || user.name || "",
        }));
        const mapped = {
          users,
          total: data.totalElements || 0,
          page: (data.number || 0) + 1, // Spring uses 0-based page, frontend uses 1-based
          limit: data.size || 10,
        };
        return NextResponse.json(mapped, {
          status: upstream.status,
        });
      }
      
      // If already in UserResponse format, map fullName to name
      if (data.users && Array.isArray(data.users)) {
        const mappedUsers = data.users.map((user: any) => ({
          ...user,
          name: user.fullName || user.name || "",
        }));
        return NextResponse.json({
          ...data,
          users: mappedUsers,
        }, {
          status: upstream.status,
        });
      }
    }
    
    // Fallback: return as is
    return NextResponse.json(responseBody?.data ?? responseBody, {
      status: upstream.status,
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Upstream request failed", error: String(e) },
      { status: 502 }
    );
  }
}

