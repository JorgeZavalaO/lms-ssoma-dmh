import { NextResponse, NextRequest } from "next/server"

// Rutas públicas (no requieren sesión)
const PUBLIC_PATHS = new Set<string>([
  "/",
  "/login",
  "/verify", // verificación de certificados
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

// Posibles cookies de sesión (next-auth v4/v5)
const SESSION_COOKIES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
]

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function hasSession(req: NextRequest) {
  const cookies = req.cookies
  return SESSION_COOKIES.some((k) => cookies.has(k))
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permitir assets internos sin costo
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/static/") ||
    pathname.match(/\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)$/)
  ) {
    return NextResponse.next()
  }

  // Público directo
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/verify/")) {
    return NextResponse.next()
  }

  // Solo controlar prefijos protegidos para reducir bundle
  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  // Check de sesión por cookie (sin importar auth/prisma)
  if (!hasSession(req)) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Limitar el alcance del middleware reduce el tamaño del bundle en Edge
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
