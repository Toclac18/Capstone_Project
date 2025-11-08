import { NextResponse } from "next/server";
import { USE_MOCK, BE_BASE, proxyGetJson } from "../_shared";
import { mockBestForYou } from "@/mock/homepage.mock";

export async function GET() {
  if (USE_MOCK) {
    return NextResponse.json(mockBestForYou, {
      headers: { "x-mode": "mock" },
    });
  }
  const url = new URL(`${BE_BASE}/api/homepage/best`);
  return proxyGetJson(url);
}
