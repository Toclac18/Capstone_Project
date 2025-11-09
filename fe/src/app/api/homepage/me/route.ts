import {
  mockContinueReading,
  mockSpecializationGroups,
  mockTopUpvoted,
} from "@/mock/homepage.mock";

const USE_MOCK = process.env.USE_MOCK === "true";
const BE_URL = process.env.BE_URL;

export async function GET() {
  if (USE_MOCK) {
    await delay(200);
    return Response.json({
      continueReading: mockContinueReading,
      topUpvoted: mockTopUpvoted,
      specializations: mockSpecializationGroups,
    });
  }

  if (!BE_URL) {
    return new Response("Missing BE_URL env", { status: 500 });
  }

  // gọi BE thật nếu USE_MOCK=false
  const res = await fetch(`${BE_URL}/api/homepage/me`, { cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Failed to fetch homepage data (${res.status}). ${msg}`);
  }
  const data = await res.json();
  return Response.json(data);
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
