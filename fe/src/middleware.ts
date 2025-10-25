import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

/** ====== CONFIG ====== **/
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
const JWT_SECRET = process.env.JWT_SECRET; // ❗ server-only (KHÔNG dùng NEXT_PUBLIC_*)
const encoder = new TextEncoder();

/** Public pages & apis */
const PUBLIC_PAGE_PATHS = ["/", "/auth/sign-in", "/auth/sign-up"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"];
/** Always public (static/next internals) */
const ALWAYS_PUBLIC_PREFIXES = [
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/images/",
  "/assets/",
];

function isPublicPage(pathname: string) {
  return PUBLIC_PAGE_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p),
  );
}
function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}
function isAlwaysPublic(pathname: string) {
  return ALWAYS_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

async function verifyJwt(token: string): Promise<JWTPayload | null> {
  if (!JWT_SECRET) {
    console.error("[middleware] Missing JWT_SECRET env");
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
    // (tuỳ chọn) kiểm tra thêm issuer/audience/role
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Bỏ qua static/next internals
  if (isAlwaysPublic(pathname)) return NextResponse.next();

  // 2) Luôn allow preflight
  if (req.method === "OPTIONS") return NextResponse.json({}, { status: 200 });

  // 3) Phân loại: API vs Page
  const isApi = pathname.startsWith("/api");

  // 4) Bỏ qua path public tương ứng
  if (!isApi && isPublicPage(pathname)) return NextResponse.next();
  if (isApi && isPublicApi(pathname)) return NextResponse.next();

  // 5) Check JWT từ cookie httpOnly
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyJwt(token) : null;

  if (!valid) {
    if (isApi) {
      // API: trả JSON 401, KHÔNG redirect
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      // Page: redirect về sign-in + next
      const url = req.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
