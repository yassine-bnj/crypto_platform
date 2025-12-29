import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth token in cookies
  const token = request.cookies.get("access_token")?.value

  // Public pages (no auth required)
  const publicPages = ["/", "/signin", "/signup", "/admin/login"]
  if (publicPages.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected pages (auth required)
  const protectedPages = ["/portfolio", "/markets", "/alerts", "/profile", "/settings"]
  
  if (protectedPages.some(page => pathname.startsWith(page))) {
    if (!token) {
      const loginUrl = new URL("/signin", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin pages (separate guard)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next()
    }
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/portfolio/:path*",
    "/markets/:path*",
    "/alerts/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
}
