import { BE_BASE, USE_MOCK, COOKIE_NAME } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { cookies } from "next/headers";

async function handlePOST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Token is required" }, { status: 400 });
  }

  if (USE_MOCK) {
    return Response.json(
      {
        message: "You have successfully joined the organization (mock)",
        organizationName: "Tech Innovation Hub",
        success: true,
      },
      { status: 200 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAME)?.value;

  // Proxy to new BE endpoint: POST /api/organization/members/accept-invitation
  const upstream = await fetch(
    `${BE_BASE}/api/organization/members/accept-invitation?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    },
  );

  // Handle 204 No Content or 200 OK (success)
  if (upstream.status === 204 || upstream.ok) {
    return Response.json(
      {
        message: "You have successfully joined the organization",
        success: true,
      },
      { status: 200 },
    );
  }

  const text = await upstream.text();
  let errorMsg = "Failed to join organization";
  try {
    const json = JSON.parse(text);
    errorMsg = json?.detail || json?.message || errorMsg;
  } catch {
    errorMsg = text || errorMsg;
  }
  return Response.json({ error: errorMsg }, { status: upstream.status });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/organizations/join/route.ts/POST",
  });
