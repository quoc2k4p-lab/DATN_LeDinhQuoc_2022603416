import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { jwtVerify } from "jose";

const intlMiddleware = createMiddleware(routing);

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tq-auto-secret-key-that-is-very-long-and-secure-12345"
);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api") || path.startsWith("/_next") || path.includes(".")) {
    return NextResponse.next();
  }
  // Extract path without locale prefix
  const pathWithoutLocale = path.replace(/^\/(vi|en)/, "");

  const isAdminPath = pathWithoutLocale.startsWith("/admin") || pathWithoutLocale.startsWith("/dashboard");
  const isStaffPath = pathWithoutLocale.startsWith("/staff");
  const isProfilePath = pathWithoutLocale.startsWith("/profile");

  // If it's a protected path, verify auth
  if (isAdminPath || isStaffPath || isProfilePath) {
    const token = request.cookies.get("tq_auto_session")?.value;

    if (!token) {
      // Redirect guest to login
      const locale = "vi";
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, SECRET, {
        algorithms: ["HS256"],
      });

      const role = payload.role as string;

      // Admin paths: Only admin allowed
      if (isAdminPath) {
        if (role !== "admin") {
          const locale = "vi";
          if (role === "staff") {
            return NextResponse.redirect(new URL("/staff/dashboard", request.url));
          }
          return NextResponse.redirect(new URL(`/${locale}`, request.url));
        }
      }

      // Staff paths: Admin and staff allowed
      if (isStaffPath) {
        if (role !== "admin" && role !== "staff") {
          const locale = "vi";
          return NextResponse.redirect(new URL(`/${locale}`, request.url));
        }
      }

    } catch (err) {
      console.error("JWT verification failed in middleware:", err);
      const locale = "vi";
      const response = NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      response.cookies.delete("tq_auto_session");
      return response;
    }
  }

  // For admin and staff pages, don't run next-intl (keep them outside locale prefix)
  if (path.startsWith("/admin") || path.startsWith("/dashboard") || path.startsWith("/staff")) {
    return NextResponse.next();
  }

  // Otherwise, run localization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except internals (_next), api routes, and static files containing a dot
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
