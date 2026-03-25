import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Rutas públicas (no requieren sesión)
const PUBLIC_PATHS = new Set<string>([
  "/",
  "/login",
  "/verify",
])

// Prefijos protegidos (solo estas rutas pasan por middleware)
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/my-courses",
  "/courses",
  "/evaluations",
  "/my-certificates",
  "/notifications",
  "/profile",
  "/reports",
] as const

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/static/") ||
    pathname.match(/\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)$/)
  ) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/verify/")) {
    return NextResponse.next()
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (!req.auth?.user) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/my-courses/:path*",
    "/courses/:path*",
    "/evaluations/:path*",
    "/my-certificates/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/reports/:path*",
  ],
}
