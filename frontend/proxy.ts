import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request is for admin routes
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    // Get admin session from cookie or localStorage (in production, use secure cookies)
    const adminSession = request.cookies.get("adminSession")

    // If no admin session, redirect to admin login
    if (!adminSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
