// app/api/notifications/route.ts

import { mockNotificationDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "20";
  const sort = searchParams.get("sort") || "createdAt,desc";

  if (USE_MOCK) {
    const allNotifications = mockNotificationDB.list();
    const filteredNotifications = unreadOnly
      ? allNotifications.filter((n) => !n.isRead)
      : allNotifications;

    const startIndex = parseInt(page) * parseInt(size);
    const endIndex = startIndex + parseInt(size);
    const paginatedNotifications = filteredNotifications.slice(
      startIndex,
      endIndex,
    );

    return jsonResponse(
      {
        content: paginatedNotifications,
        totalElements: filteredNotifications.length,
        totalPages: Math.ceil(filteredNotifications.length / parseInt(size)),
        size: parseInt(size),
        number: parseInt(page),
        first: parseInt(page) === 0,
        last: endIndex >= filteredNotifications.length,
      },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("notifications");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  // Build query string
  const queryParams = new URLSearchParams({
    unreadOnly: unreadOnly.toString(),
    page,
    size,
    sort,
  });

  const upstream = await fetch(
    `${BE_BASE}/api/notifications?${queryParams.toString()}`,
    {
      method: "GET",
      headers: fh,
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // Parse backend response format: { success, data, pageInfo, timestamp }
  const backendResponse = await upstream.json();

  // Map to frontend format
  const frontendResponse = {
    content: Array.isArray(backendResponse?.data) ? backendResponse.data : [],
    totalElements: backendResponse?.pageInfo?.totalElements || 0,
    totalPages: backendResponse?.pageInfo?.totalPages || 0,
    size: backendResponse?.pageInfo?.size || parseInt(size),
    number: backendResponse?.pageInfo?.page || parseInt(page),
    first: backendResponse?.pageInfo?.first ?? true,
    last: backendResponse?.pageInfo?.last ?? true,
  };

  return jsonResponse(frontendResponse, {
    status: upstream.status,
    mode: "real",
  });
}

async function handlePOST(req: Request): Promise<Response> {
  if (USE_MOCK) {
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonResponse(
        { error: "Invalid JSON" },
        { status: 400, mode: "mock" },
      );
    }

    const { userId, type, title, summary } = body;

    if (!userId || !type || !title || !summary) {
      return jsonResponse(
        { error: "Missing required fields: userId, type, title, summary" },
        { status: 400, mode: "mock" },
      );
    }

    const newNotification = mockNotificationDB.create({
      userId,
      type,
      title,
      summary,
    });

    return jsonResponse(newNotification, { status: 201, mode: "mock" });
  }

  const authHeader = await getAuthHeader("notifications");
  const body = await req.json().catch(() => null);

  if (!body) {
    return jsonResponse(
      { error: "Invalid JSON" },
      { status: 400, mode: "real" },
    );
  }

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/notifications`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const backendResponse = await upstream.json();

  // Backend may wrap response in ApiResponse format: { success, data, timestamp }
  // or return NotificationResponse directly
  const notification = backendResponse?.data || backendResponse;

  return jsonResponse(notification, { status: upstream.status, mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/notifications/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/notifications/route.ts/POST",
  });
