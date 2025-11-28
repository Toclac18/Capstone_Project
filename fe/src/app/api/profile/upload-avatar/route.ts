// app/api/profile/upload-avatar/route.ts

import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, badRequest } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handlePOST(req: Request) {
  if (USE_MOCK) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return badRequest("File is required");
    }

    return jsonResponse(
      { message: "Avatar uploaded successfully" },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("upload-avatar");
  const formData = await req.formData();

  const fh = new Headers();
  if (authHeader) fh.set("Authorization", authHeader);
  const upstream = await fetch(`${BE_BASE}/api/user/upload-avatar`, {
    method: "POST",
    headers: fh,
    body: formData,
    cache: "no-store",
  });

  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  const text = await upstream.text();
  let data;
  try {
    const json = JSON.parse(text);
    data = json.data || json;
  } catch {
    data = { error: text || "Failed to upload avatar" };
  }

  return jsonResponse(data, { status: upstream.status, mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/profile/upload-avatar/route.ts/POST",
  });

