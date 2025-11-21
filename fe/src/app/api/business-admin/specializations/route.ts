import { cookies } from "next/headers";
import { mockSpecializationsDB } from "@/mock/db";
import type {
  CreateSpecializationRequest,
  SpecializationQueryParams,
} from "@/types/document-specialization";

const DEFAULT_BE_BASE = "http://localhost:8080";

export async function GET(request: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  if (USE_MOCK) {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");
    
    if (!domainId) {
      return new Response(
        JSON.stringify({ message: "domainId is required" }),
        {
          status: 400,
          headers: { "content-type": "application/json", "x-mode": "mock" },
        }
      );
    }

    const params: SpecializationQueryParams = {
      domainId,
      search: searchParams.get("search") || undefined,
    };

    try {
      const specializations = mockSpecializationsDB.list(params);
      const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
      const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 10;
      const total = specializations.length;

      const result = {
        specializations,
        total,
        page,
        limit,
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
  }

  // Get authentication from cookie
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const url = `${BE_BASE}/api/business-admin/specializations?${new URL(request.url).searchParams.toString()}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

export async function POST(request: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  if (USE_MOCK) {
    const body = (await request.json()) as CreateSpecializationRequest;
    try {
      const result = mockSpecializationsDB.create(body);
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
  }

  // Get authentication from cookie
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const url = `${BE_BASE}/api/business-admin/specializations`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: fh,
    body: request.body,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

