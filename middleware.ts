import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "./lib/rate-limit";

const SUPPORTED_LANGUAGES = ["en", "am", "or"];

// Initialize rate limiters for different purposes
const authLimiter = rateLimit({
  interval: 10 * 1000, // 10 seconds
  uniqueTokenPerInterval: 500,
});

const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
});

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

  // Rate limiting is temporarily DISABLED (commented out) for today.
  // Re-enable by removing the block comment below.
  /*
  // Rate limiting for sensitive API routes
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/signup") ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname.startsWith("/api/auth/change-password") ||
    pathname.startsWith("/api/otp/") ||
    pathname.startsWith("/api/hahusms/")
  ) {
    const rl = authLimiter.check(new Response(), `auth_${ip}`, 5); // 5 attempts per 10 seconds
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Too many attempts. Please try again.",
          retryAfterSeconds: rl.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfterSeconds),
          },
        }
      );
    }
  }

  // General API rate limiting (apply mainly to write actions to avoid blocking normal GET fetches)
  const method = req.method.toUpperCase();
  const isWriteMethod =
    method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  if (
    isWriteMethod &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/docs")
  ) {
    const rl = apiLimiter.check(new Response(), `api_${ip}`, 300); // 300 write requests per minute
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again.",
          retryAfterSeconds: rl.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfterSeconds),
          },
        }
      );
    }
  }
  */

  // Skip middleware for API routes, static files, docs, and Next.js internals for language redirection
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/docs") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ... rest of the language redirection logic ...

  // Check if pathname already has a language prefix
  const langMatch = pathname.match(/^\/(en|am|or)/);
  const urlLang = langMatch ? langMatch[1] : null;

  // Get language from cookie
  const cookieLang = req.cookies.get("eservice-language")?.value;
  const preferredLang = (
    cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang) ? cookieLang : "en"
  ) as "en" | "am" | "or";

  // If root path, redirect to preferred language
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${preferredLang}`, req.url));
  }

  // If no language in URL but we have a cookie, redirect to include language
  if (!urlLang && !pathname.startsWith("/api")) {
    // Extract the path without language
    const pathWithoutLang = pathname;
    return NextResponse.redirect(
      new URL(`/${preferredLang}${pathWithoutLang}`, req.url)
    );
  }

  // If URL has language but it doesn't match cookie, update cookie
  if (
    urlLang &&
    urlLang !== preferredLang &&
    SUPPORTED_LANGUAGES.includes(urlLang)
  ) {
    const response = NextResponse.next();
    response.cookies.set("eservice-language", urlLang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static (public static files)
     */
    "/((?!_next/static|_next/image|favicon.ico|static).*)",
  ],
};
