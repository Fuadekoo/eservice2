import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LANGUAGES = ["en", "am", "or"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
