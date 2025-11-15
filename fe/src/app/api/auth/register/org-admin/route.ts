const USE_MOCK = process.env.USE_MOCK === "true";
const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  // Parse info JSON blob
  const infoBlob = formData.get("info");
  if (!infoBlob) {
    return Response.json({ error: "Missing info field" }, { status: 400 });
  }

  let info: {
    fullName: string;
    dateOfBirth: string;
    username: string;
    email: string;
    password: string;
    organizationName: string;
    organizationType: string;
    registrationNumber: string;
    organizationEmail: string;
  };

  try {
    const infoText = await (infoBlob as Blob).text();
    info = JSON.parse(infoText);
  } catch {
    return Response.json({ error: "Invalid info JSON" }, { status: 400 });
  }

  // Validate required fields
  const { fullName, dateOfBirth, username, email, password, organizationName, organizationType, registrationNumber, organizationEmail } = info;
  if (!fullName || !dateOfBirth || !username || !email || !password) {
    return Response.json(
      { error: "Missing required basic fields" },
      { status: 400 }
    );
  }

  if (!organizationName || !organizationType || !registrationNumber || !organizationEmail) {
    return Response.json(
      { error: "Missing required organization fields" },
      { status: 400 }
    );
  }

  // Validate file upload (required for organization)
  const files = formData.getAll("certificateUploads");
  if (!files || files.length === 0) {
    return Response.json(
      { error: "Organization certificate upload is required" },
      { status: 400 }
    );
  }

  // Validate file size (max 10MB per file)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  for (const file of files) {
    if (file instanceof File && file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File "${file.name}" exceeds 10MB limit` },
        { status: 400 }
      );
    }
  }

  if (USE_MOCK) {
    const mockUser = {
      id: Math.floor(Math.random() * 10000),
      username,
      email,
      fullName,
      role: "ORGANIZATION",
      status: "PENDING_VERIFICATION",
      message: "Organization registration successful! Admin will verify your information.",
    };
    return Response.json(mockUser, { status: 201 });
  }

  // Proxy to BE
  const upstream = await fetch(`${BE_BASE}/api/auth/register-organization`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  const text = await upstream.text();
  const responseContentType = upstream.headers.get("content-type") ?? "application/json";

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
    headers: { "content-type": responseContentType },
  });
}
