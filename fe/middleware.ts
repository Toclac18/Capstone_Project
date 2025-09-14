import { NextRequest, NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith('/dashboard') && !token) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };