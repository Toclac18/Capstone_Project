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

export default async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isAlwaysPublic(pathname))
    return new Response(null, { status: 200, headers: { "x-proxy": "pass" } });
  if (request.method === "OPTIONS") return new Response(null, { status: 200 });

  const isApi = pathname.startsWith("/api");
  if (!isApi && isPublicPage(pathname))
    return new Response(null, { status: 200, headers: { "x-proxy": "pass" } });
  if (isApi && isPublicApi(pathname))
    return new Response(null, { status: 200, headers: { "x-proxy": "pass" } });

  const cookieHeader = request.headers.get("cookie") || "";
  const token = (cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  ) || [])[1];

  if (!isApi && !token) {
    const signIn = new URL("/auth/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return Response.redirect(signIn, 307);
  }
  return new Response(null, { status: 200, headers: { "x-proxy": "pass" } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
