import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "siri_admin_session";

// Public admin authentication paths
const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

// Public admin API endpoints that must remain accessible for logging in and resetting passwords
const PUBLIC_ADMIN_API_PATHS = [
  "/api/admin/auth/login",
  "/api/admin/auth/forgot-password",
  "/api/admin/auth/reset-password",
  "/api/admin/auth/verify-reset-token",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const isPublicAdminPage = PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
  const isPublicAdminApi = PUBLIC_ADMIN_API_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));

  // Read HTTP-only session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasSession = !!sessionCookie && sessionCookie.includes(".");

  // 1. If authenticated admin visits login or password reset, redirect directly to admin dashboard
  if (hasSession && isPublicAdminPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 2. If unauthenticated user attempts to access any protected /admin page, redirect to /admin/login
  if (!hasSession && isAdminPage && !isPublicAdminPage) {
    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 3. If unauthenticated client calls protected /api/admin route, return 401 Unauthorized
  if (!hasSession && isAdminApi && !isPublicAdminApi) {
    return NextResponse.json(
      { error: "Unauthorized. Valid admin authentication session required." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
