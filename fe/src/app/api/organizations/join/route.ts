import { BE_BASE, USE_MOCK } from "@/server/config";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Token is required" }, { status: 400 });
  }

  if (USE_MOCK) {
    // Mock join organization - always success
    return Response.json(
      {
        message: "You have successfully joined the organization (mock)",
        organizationName: "Tech Innovation Hub",
        success: true,
      },
      { status: 200 }
    );
  }

  // Proxy to BE
  const upstream = await fetch(
    `${BE_BASE}/api/organizations/join?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const text = await upstream.text();

  if (!upstream.ok) {
    let errorMsg = "Failed to join organization";
    try {
      const json = JSON.parse(text);
      errorMsg = json?.detail || json?.message || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    return Response.json({ error: errorMsg }, { status: upstream.status });
  }

  // Parse response
  try {
    const json = JSON.parse(text);
    return Response.json(
      {
        message: json?.message || "You have successfully joined the organization",
        organizationName: json?.organizationName,
        success: true,
      },
      { status: 200 }
    );
  } catch {
    return Response.json(
      {
        message: text || "You have successfully joined the organization",
        success: true,
      },
      { status: 200 }
    );
  }
}