import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Auth pages: redirect to dashboard if already authenticated
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Protected dashboard routes: redirect to login if not authenticated
  const protectedPaths = ["/dashboard", "/transactions", "/analytics", "/settings", "/import"];
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // Protected API routes (except /api/auth/*): return 401 if not authenticated
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    !isLoggedIn
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/transactions/:path*", "/analytics/:path*", "/settings/:path*", "/import/:path*", "/api/:path*", "/login", "/register"],
};
