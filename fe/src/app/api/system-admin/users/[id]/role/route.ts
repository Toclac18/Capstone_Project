export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { mockUsersForRoleManagement } from "@/mock/roleManagement";
import type { ChangeRoleRequest } from "@/types/role-management";

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
    "Content-Type": "application/json",
    ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
  };
  const cookieHeader = h.get("cookie");
  if (cookieHeader) passHeaders["cookie"] = cookieHeader;

  const fetchOptions: RequestInit = {
    method,
    headers: passHeaders,
    cache: "no-store",
  };

  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    fetchOptions.body = JSON.stringify(body);
  }

  return fetch(upstreamUrl, fetchOptions);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const { id } = await params;

  if (USE_MOCK) {
    try {
      const body: ChangeRoleRequest = await req.json();
      
      // Find user in mock data
      const userIndex = mockUsersForRoleManagement.findIndex(
        (u) => u.id === id
      );

      if (userIndex === -1) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Update role
      const updatedUser = {
        ...mockUsersForRoleManagement[userIndex],
        role: body.role,
      };

      const result = {
        user: updatedUser,
        message: "Role changed successfully",
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
  const body = await req.json().catch(() => ({}));
  if (!body.role) {
    return NextResponse.json(
      { error: "Role is required" },
      { status: 400 }
    );
  }

  const UPSTREAM_PATH = `/api/v1/system-admin/users/${id}/role`;

  try {
    const upstream = await forward(UPSTREAM_PATH, "PATCH", body);
    const responseBody = await upstream.json().catch(() => ({}));
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

