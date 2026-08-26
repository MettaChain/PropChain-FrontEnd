import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Define paths that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/portfolio", "/settings", "/invest"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute) {
    // Look for the auth token in cookies
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      // Redirect to home or login page if no token is found
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secretKey = process.env.AUTH_SECRET?.trim();
      if (!secretKey) {
        throw new Error("AUTH_SECRET is not configured");
      }

      const secret = new TextEncoder().encode(secretKey);

      // Verify signature and expiry with 15s clock tolerance
      await jwtVerify(token, secret, {
        clockTolerance: 15,
      });
    } catch (error) {
      // Token is invalid, expired, or tampered with
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(loginUrl);

      // Clear the invalid cookie
      response.cookies.delete("auth-token");

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portfolio/:path*",
    "/settings/:path*",
    "/invest/:path*",
  ],
};
