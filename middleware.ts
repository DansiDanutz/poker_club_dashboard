import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /tv to /tv-display.html
  if (pathname === '/tv' || pathname === '/TV') {
    return NextResponse.redirect(new URL('/tv-display.html', request.url));
  }

  // Redirect /display to /tv-display.html
  if (pathname === '/display' || pathname === '/DISPLAY') {
    return NextResponse.redirect(new URL('/tv-display.html', request.url));
  }

  // Redirect /screen to /tv-display.html
  if (pathname === '/screen' || pathname === '/SCREEN') {
    return NextResponse.redirect(new URL('/tv-display.html', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/tv', '/TV', '/display', '/DISPLAY', '/screen', '/SCREEN']
};