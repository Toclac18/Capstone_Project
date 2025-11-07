import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

const PUBLIC_PAGE_PATHS = [
  "/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/verify-email",
];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"];
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAlwaysPublic(pathname)) return NextResponse.next();
  if (req.method === "OPTIONS") return NextResponse.json({}, { status: 200 });

  const isApi = pathname.startsWith("/api");
  if (!isApi && isPublicPage(pathname)) return NextResponse.next();
  if (isApi && isPublicApi(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!isApi && !token) {
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
