import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const PROTECTED_PAGES = ["/onboarding", "/dashboard", "/profile", "/settings", "/w"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // getSessionCookie only checks for the cookie's presence — it does NOT
  // validate the session against the database. That's intentional: full
  // validation happens in the page/layout itself (via auth.api.getSession),
  // this is just a fast redirect to avoid flashing protected content.
  const sessionCookie = getSessionCookie(request);

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));

  if (isProtectedPage && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/w/:path*",
  ],
};
