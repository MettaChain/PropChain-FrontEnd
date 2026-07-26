import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define paths that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/portfolio', '/settings', '/invest'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value;
    let isValid = false;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret_for_development_only');
        await jwtVerify(token, secret, {
          clockTolerance: 15, // 15 seconds clock skew tolerance
        });
        isValid = true;
      } catch (error) {
        // Token is invalid, expired, or tampered with
        isValid = false;
      }
    }

    if (!isValid) {
      // Return 401 or redirect based on whether it's an API route or page route
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      // Clear the invalid token
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/portfolio/:path*', '/settings/:path*', '/invest/:path*'],
};