export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { mockUsersForRoleManagement } from "@/mock/roleManagement";
import type { ChangeRoleRequest } from "@/types/role-management";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handlePATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (USE_MOCK) {
    try {
      const body: ChangeRoleRequest = await req.json();

      const userIndex = mockUsersForRoleManagement.findIndex(
        (u) => u.id === id,
      );

      if (userIndex === -1) {
        return jsonResponse(
          { error: "User not found" },
          { status: 404, mode: "mock" },
        );
      }

      const updatedUser = {
        ...mockUsersForRoleManagement[userIndex],
        role: body.role,
      };

      const result = {
        user: updatedUser,
        message: "Role changed successfully",
      };

      return jsonResponse(result, { status: 200, mode: "mock" });
    } catch (error: any) {
      return jsonResponse(
        { error: error.message || "Failed to process request" },
        { status: 400, mode: "mock" },
      );
    }
  }

  const body = await req.json().catch(() => ({}));
  if (!body.role) {
    return jsonResponse(
      { error: "Role is required" },
      { status: 400, mode: "real" },
    );
  }

  const url = `${BE_BASE}/api/system-admin/users/${id}/role`;

  try {
    const authHeader = await getAuthHeader("system-admin-change-role");
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(url, {
      method: "PATCH",
      headers: fh,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const responseBody = await upstream.json().catch(() => ({}));
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

export const PATCH = (...args: Parameters<typeof handlePATCH>) =>
  withErrorBoundary(() => handlePATCH(...args), {
    context: "api/system-admin/users/[id]/role/route.ts/PATCH",
  });

