import { BE_BASE, COOKIE_NAME } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { cookies } from "next/headers";

async function handleGET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const email = searchParams.get("email") || "";
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "10";

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAME)?.value;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (email) params.set("email", email);
  params.set("page", page);
  params.set("size", size);
  params.set("sort", "createdAt,asc"); // Sort by oldest first (new tickets at the end)

  const upstream = await fetch(
    `${BE_BASE}/api/contact-tickets?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    }
  );

  if (!upstream.ok) {
    const text = await upstream.text();
    let errorMsg = "Failed to fetch tickets";
    try {
      const json = JSON.parse(text);
      errorMsg = json?.message || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    return Response.json({ error: errorMsg }, { status: upstream.status });
  }

  const json = await upstream.json();
  return Response.json(json);
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/business-admin/tickets/route.ts/GET",
  });
