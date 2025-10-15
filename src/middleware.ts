export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    // protege todo excepto rutas públicas:
    "/((?!api/auth|login|register|_next|favicon.ico|assets|public).*)",
  ],
}
