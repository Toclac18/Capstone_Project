import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const encoder = new TextEncoder();
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'hahahaha';

async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/auth/sign-in',
    '/auth/sign-up',
  ];
  
  // Check if current path is public
  const isPublic = publicPaths.some((p) => {
    if (p === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(p);
  });
  
  // Allow public paths without authentication
  if (isPublic) {
    return NextResponse.next();
  }

  // All other routes require authentication
  const token = req.cookies.get('access_token')?.value;
  const isValid = token ? await verifyJwt(token) : null;

  if (!isValid) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Apply to all paths
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};