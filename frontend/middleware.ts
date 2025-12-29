import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public pages (no auth required)
  const publicPages = ["/signin", "/signup", "/admin/login"]
  if (publicPages.includes(pathname)) {
    return NextResponse.next()
  }

  // Redirect home page to signin if not authenticated
  if (pathname === "/") {
    const hasAccessToken = request.cookies.has("access_token")
    const hasRefreshToken = request.cookies.has("refresh_token")
    
    if (!hasAccessToken && !hasRefreshToken) {
      return NextResponse.redirect(new URL("/signin", request.url))
    }
    return NextResponse.next()
  }

  // For protected pages, allow access if:
  // 1. User has access_token cookie, OR
  // 2. User has refresh_token cookie (can refresh), OR
  // 3. Let the page load and let client-side auth handle it
  
  const hasAccessToken = request.cookies.has("access_token")
  const hasRefreshToken = request.cookies.has("refresh_token")
  
  // Allow access with either token
  if (hasAccessToken || hasRefreshToken) {
    return NextResponse.next()
  }

  // No tokens at all - this is a fresh page load or first visit
  // For admin pages, require redirect to admin login
  if (pathname.startsWith("/admin")) {
    // Only redirect if NOT on the login page already
    if (pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  //For admin pages, only redirect if NOT already on admin login
  if (["/admin", "/admin/users", "/admin/settings"].some(p => pathname.startsWith(p))) {
    if (pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }   
    }
  
  // For user pages, only redirect if NOT already on signin
  if (["/portfolio", "/markets", "/alerts", "/profile", "/settings"].some(p => pathname.startsWith(p))) {
    if (pathname !== "/signin") {
      return NextResponse.redirect(new URL("/signin", request.url))
    }
  }

  // Allow everything else (context auth will handle on client-side)
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/portfolio/:path*",
    "/markets/:path*",
    "/alerts/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
}
