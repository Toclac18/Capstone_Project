const USE_MOCK = process.env.USE_MOCK === "true";
const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Token is required" }, { status: 400 });
  }

  if (USE_MOCK) {
    // Mock verification - always success
    return Response.json(
      {
        message: "Email has been verified successfully (mock)",
        success: true,
      },
      { status: 200 }
    );
  }

  // Proxy to BE
  const upstream = await fetch(
    `${BE_BASE}/api/auth/reader/verify-email?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const text = await upstream.text();

  if (!upstream.ok) {
    let errorMsg = "Verification failed";
    try {
      const json = JSON.parse(text);
      errorMsg = json?.detail || json?.message || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    return Response.json({ error: errorMsg }, { status: upstream.status });
  }

  // Backend returns plain text, convert to JSON
  return Response.json(
    {
      message: text || "Email has been verified successfully",
      success: true,
    },
    { status: 200 }
  );
}
