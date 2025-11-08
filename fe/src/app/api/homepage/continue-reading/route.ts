import { NextResponse } from "next/server";
import { USE_MOCK, BE_BASE, proxyGetJson } from "../_shared";
import { mockContinueReading } from "@/mock/homepage.mock";

export async function GET() {
  if (USE_MOCK) {
    return NextResponse.json(mockContinueReading, {
      headers: { "x-mode": "mock" },
    });
  }
  const url = new URL(`${BE_BASE}/api/homepage/continue-reading`);
  return proxyGetJson(url);
}
