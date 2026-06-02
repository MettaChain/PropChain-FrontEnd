import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define paths that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/portfolio', '/settings', '/invest'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Look for the auth token in cookies
    // This assumes your auth flow sets a cookie named 'auth-token'
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Redirect to home or login page if no token is found
      const loginUrl = new URL('/', request.url);
      // Optionally add a redirect parameter to return the user after login
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/portfolio/:path*', '/settings/:path*', '/invest/:path*'],
};