import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

const PUBLIC_PAGE_PATHS = ["/", "/admin/contact", "/homepage"];
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

  if (
    isPublicPage(pathname) ||
    isPublicPrefix(pathname) ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  // if (!pathname.startsWith("/api")) {
  //   const token = req.cookies.get(COOKIE_NAME)?.value;
  //   if (!token) {
  //     const url = req.nextUrl.clone();
  //     url.pathname = "/auth/sign-in";
  //     url.searchParams.set("next", pathname);
  //     return NextResponse.redirect(url, 307);
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|assets).*)",
  ],
};
