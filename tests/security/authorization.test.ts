import { describe, expect, it } from "vitest"
import {
  requireAssignableUserRole,
  requireCollaboratorAccess,
  requireManagePrivilegedUser,
  resolveCollaboratorScope,
} from "../../src/lib/authorization"

type Role = "SUPERADMIN" | "ADMIN" | "COLLABORATOR"

function buildSession(role: Role, collaboratorId?: string | null) {
  return {
    user: {
      id: "user-1",
      role,
      collaboratorId: collaboratorId ?? null,
    },
  } as const
}

describe("authorization helpers", () => {
  it("limits collaborator scope to the current collaborator", () => {
    const result = resolveCollaboratorScope(
      buildSession("COLLABORATOR", "collab-1"),
      undefined
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.collaboratorId).toBe("collab-1")
    }
  })

  it("blocks collaborators from requesting another collaborator scope", () => {
    const result = resolveCollaboratorScope(
      buildSession("COLLABORATOR", "collab-1"),
      "collab-2"
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(403)
    }
  })

  it("requires collaboratorId for staff when requested explicitly", () => {
    const result = resolveCollaboratorScope(buildSession("ADMIN"), undefined, {
      requireForStaff: true,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
    }
  })

  it("prevents ADMIN from assigning privileged roles", () => {
    const result = requireAssignableUserRole(buildSession("ADMIN"), "SUPERADMIN")

    expect(result?.status).toBe(403)
  })

  it("allows SUPERADMIN to manage privileged users", () => {
    const result = requireManagePrivilegedUser(
      buildSession("SUPERADMIN"),
      "ADMIN"
    )

    expect(result).toBeNull()
  })

  it("prevents collaborator access to foreign resources", () => {
    const denied = requireCollaboratorAccess(
      buildSession("COLLABORATOR", "collab-1"),
      "collab-2"
    )
    const allowed = requireCollaboratorAccess(
      buildSession("COLLABORATOR", "collab-1"),
      "collab-1"
    )

    expect(denied?.status).toBe(403)
    expect(allowed).toBeNull()
  })
})
