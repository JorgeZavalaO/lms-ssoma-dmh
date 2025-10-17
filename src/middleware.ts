import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { isAllowed } from "./config/access"
import type { Role } from "./config/access"

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/api/auth")) return

  const role = req.auth?.user?.role as Role | undefined
  const ok = isAllowed(pathname, role)
  if (!ok) {
    const url = new URL("/login", req.url)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: [
    // protege todo excepto rutas públicas:
    "/((?!api/auth|login|register|_next|favicon.ico|assets|public).*)",
  ],
}
