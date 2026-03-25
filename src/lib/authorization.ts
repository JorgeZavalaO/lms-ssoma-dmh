import type { Session } from "next-auth"
import { NextResponse } from "next/server"

export type AppRole = "SUPERADMIN" | "ADMIN" | "COLLABORATOR"
export type AppSession = Session & {
  user: Session["user"] & {
    id: string
    role: AppRole
    collaboratorId?: string | null
  }
}

export function unauthorized(message = "No autenticado") {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function gone(message = "Endpoint deshabilitado") {
  return NextResponse.json({ error: message }, { status: 410 })
}

export function isSuperAdmin(role?: string | null): role is "SUPERADMIN" {
  return role === "SUPERADMIN"
}

export function isStaff(role?: string | null): role is "ADMIN" | "SUPERADMIN" {
  return role === "ADMIN" || role === "SUPERADMIN"
}

export function requireAuthenticated(session: Session | null): NextResponse | null {
  return session?.user ? null : unauthorized()
}

export function requireStaff(session: Session | null): NextResponse | null {
  const authError = requireAuthenticated(session)
  if (authError) return authError
  return isStaff(session!.user.role) ? null : forbidden()
}

export function requireSuperAdmin(session: Session | null): NextResponse | null {
  const authError = requireAuthenticated(session)
  if (authError) return authError
  return isSuperAdmin(session!.user.role)
    ? null
    : forbidden("Solo SUPERADMIN puede realizar esta acción")
}

export function ensureCollaboratorProfile(session: Session | null) {
  const authError = requireAuthenticated(session)
  if (authError) return { ok: false as const, response: authError }

  const collaboratorId = session!.user.collaboratorId
  if (!collaboratorId) {
    return {
      ok: false as const,
      response: badRequest("Usuario sin colaborador asociado"),
    }
  }

  return { ok: true as const, collaboratorId }
}

export function canAccessCollaborator(
  session: Session | null,
  collaboratorId?: string | null
) {
  if (!session?.user || !collaboratorId) return false
  if (isStaff(session.user.role)) return true
  return session.user.collaboratorId === collaboratorId
}

export function requireCollaboratorAccess(
  session: Session | null,
  collaboratorId?: string | null
): NextResponse | null {
  const authError = requireAuthenticated(session)
  if (authError) return authError

  if (!collaboratorId) {
    return badRequest("collaboratorId es requerido")
  }

  if (!canAccessCollaborator(session, collaboratorId)) {
    return forbidden()
  }

  return null
}

export function resolveCollaboratorScope(
  session: Session | null,
  requestedCollaboratorId?: string | null,
  options?: { requireForStaff?: boolean }
) {
  const authError = requireAuthenticated(session)
  if (authError) return { ok: false as const, response: authError }

  if (session!.user.role === "COLLABORATOR") {
    if (!session!.user.collaboratorId) {
      return {
        ok: false as const,
        response: badRequest("Usuario sin colaborador asociado"),
      }
    }

    if (
      requestedCollaboratorId &&
      requestedCollaboratorId !== session!.user.collaboratorId
    ) {
      return { ok: false as const, response: forbidden() }
    }

    return {
      ok: true as const,
      collaboratorId: session!.user.collaboratorId,
    }
  }

  if (options?.requireForStaff && !requestedCollaboratorId) {
    return {
      ok: false as const,
      response: badRequest("collaboratorId es requerido"),
    }
  }

  return {
    ok: true as const,
    collaboratorId: requestedCollaboratorId ?? null,
  }
}

export function canAssignUserRole(
  actorRole: AppRole,
  targetRole: AppRole | undefined | null
) {
  if (!targetRole) return true
  if (targetRole === "COLLABORATOR") return isStaff(actorRole)
  return actorRole === "SUPERADMIN"
}

export function requireAssignableUserRole(
  session: Session | null,
  targetRole: AppRole | undefined | null
): NextResponse | null {
  const staffError = requireStaff(session)
  if (staffError) return staffError

  return canAssignUserRole(session!.user.role, targetRole)
    ? null
    : forbidden("Solo SUPERADMIN puede asignar roles privilegiados")
}

export function canManagePrivilegedUser(
  actorRole: AppRole,
  targetRole: AppRole | undefined | null
) {
  if (!targetRole || targetRole === "COLLABORATOR") return isStaff(actorRole)
  return actorRole === "SUPERADMIN"
}

export function requireManagePrivilegedUser(
  session: Session | null,
  targetRole: AppRole | undefined | null
): NextResponse | null {
  const staffError = requireStaff(session)
  if (staffError) return staffError

  return canManagePrivilegedUser(session!.user.role, targetRole)
    ? null
    : forbidden("Solo SUPERADMIN puede administrar usuarios privilegiados")
}
