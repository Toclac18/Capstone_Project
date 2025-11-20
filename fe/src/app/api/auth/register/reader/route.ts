import { BE_BASE, USE_MOCK } from "@/server/config";
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate required fields for Reader
  const { fullName, dateOfBirth, username, email, password } = body;
  if (!fullName || !dateOfBirth || !username || !email || !password) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (USE_MOCK) {
    const mockUser = {
      id: Math.floor(Math.random() * 10000),
      username,
      email,
      fullName,
      role: "READER",
      status: "PENDING_VERIFICATION",
      message: "Registration successful! Please check your email to verify your account.",
    };
    return Response.json(mockUser, { status: 201 });
  }

  // Proxy to BE
  const upstream = await fetch(`${BE_BASE}/api/auth/register-reader`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";

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