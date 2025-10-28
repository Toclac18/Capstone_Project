import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
const JWT_SECRET = process.env.JWT_SECRET; // server-only
const encoder = new TextEncoder();

const PUBLIC_PAGE_PATHS = ["/", "/auth/sign-in", "/auth/sign-up"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"]; // auth & health public
const ALWAYS_PUBLIC_PREFIXES = [
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/images/",
  "/assets/",
];

function isPublicPage(path: string) {
  return PUBLIC_PAGE_PATHS.some((p) =>
    p === "/" ? path === "/" : path.startsWith(p),
  );
}
function isPublicApi(path: string) {
  return PUBLIC_API_PREFIXES.some((p) => path.startsWith(p));
}
function isAlwaysPublic(path: string) {
  return ALWAYS_PUBLIC_PREFIXES.some((p) => path.startsWith(p));
}

async function verifyJwt(token: string): Promise<JWTPayload | null> {
  if (!JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAlwaysPublic(pathname)) return NextResponse.next();
  if (req.method === "OPTIONS") return NextResponse.json({}, { status: 200 });

  const isApi = pathname.startsWith("/api");
  if (!isApi && isPublicPage(pathname)) return NextResponse.next();
  if (isApi && isPublicApi(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyJwt(token) : null;

  if (!valid) {
    if (isApi)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
