const USE_MOCK = process.env.USE_MOCK === "true";
const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate required fields
  const { fullName, dateOfBirth, username, email, password } = body;
  if (!fullName || !dateOfBirth || !username || !email || !password) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (USE_MOCK) {
    // Mock registration - always success
    const mockUser = {
      id: Math.floor(Math.random() * 10000),
      username,
      email,
      fullName,
      dateOfBirth,
      status: "PENDING_VERIFICATION",
      createdAt: new Date().toISOString(),
    };

    return Response.json(
      {
        ...mockUser,
        message: "Registration successful! Please check your email to verify your account. (mock)",
      },
      { status: 201 }
    );
  }

  // Proxy to BE
  const upstream = await fetch(`${BE_BASE}/api/auth/reader/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  // If error, try to parse and return proper error message
  if (!upstream.ok) {
    let errorMsg = "Registration failed";
    try {
      const json = JSON.parse(text);
      errorMsg = json?.detail || json?.message || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    return Response.json({ error: errorMsg }, { status: upstream.status });
  }

  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}

