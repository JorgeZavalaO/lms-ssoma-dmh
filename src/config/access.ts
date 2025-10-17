export type Role = "SUPERADMIN" | "ADMIN" | "COLLABORATOR"

export const accessMatrix: Array<{ pattern: RegExp; roles: Role[] }> = [
  // Solo SUPERADMIN:
  { pattern: /^\/super(\/|$)/, roles: ["SUPERADMIN"] },

  // ADMIN y SUPERADMIN:
  { pattern: /^\/admin(\/|$)/, roles: ["ADMIN", "SUPERADMIN"] },

  // App “general” autenticada (cualquiera logueado):
  { pattern: /^\/(dashboard|perfil|settings)(\/|$)/, roles: ["COLLABORATOR", "ADMIN", "SUPERADMIN"] },
]

export function isAllowed(pathname: string, role?: Role) {
  const rule = accessMatrix.find((r) => r.pattern.test(pathname))
  if (!rule) return true // rutas públicas o sin regla explícita
  if (!role) return false
  return rule.roles.includes(role)
}
