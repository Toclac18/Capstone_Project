import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/server/config";

const PUBLIC_PAGE_PATHS = [
  "/",
  "/contact-admin",
  "/homepage",
  "/search",
  "/error-page",
];
const PUBLIC_PAGE_PREFIXES = ["/auth/"];

const ALWAYS_PUBLIC_PREFIXES = [
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/images/",
  "/assets/",
];

function isAlwaysPublic(path: string) {
  return ALWAYS_PUBLIC_PREFIXES.some((p) => path.startsWith(p));
}

function isPublicPage(path: string) {
  return PUBLIC_PAGE_PATHS.includes(path);
}

function isPublicPrefix(path: string) {
  return PUBLIC_PAGE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAlwaysPublic(pathname) || req.method === "OPTIONS") {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Redirect authenticated users away from auth pages
  if (isPublicPrefix(pathname) && token) {
    const url = req.nextUrl.clone();
    url.pathname = "/homepage";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }

  if (
    isPublicPage(pathname) ||
    isPublicPrefix(pathname) ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/api")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url, 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|assets).*)",
  ],
};
