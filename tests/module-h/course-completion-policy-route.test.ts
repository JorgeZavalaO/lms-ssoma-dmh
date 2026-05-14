import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockAuth, mockGetCourseCompletionPolicy, mockUpdateCourseCompletionPolicy } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockGetCourseCompletionPolicy: vi.fn(),
    mockUpdateCourseCompletionPolicy: vi.fn(),
  }))

vi.mock("@/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/system-settings", () => ({
  getCourseCompletionPolicy: mockGetCourseCompletionPolicy,
  updateCourseCompletionPolicy: mockUpdateCourseCompletionPolicy,
}))

import {
  GET,
  PATCH,
} from "../../src/app/api/superadmin/course-completion-policy/route"

function request(body?: unknown) {
  return new Request("http://localhost/api/superadmin/course-completion-policy", {
    method: body === undefined ? "GET" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as any
}

describe("/api/superadmin/course-completion-policy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("bloquea GET para usuarios que no son SUPERADMIN", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })

    const response = await GET(request())

    expect(response.status).toBe(403)
    expect(mockGetCourseCompletionPolicy).not.toHaveBeenCalled()
  })

  it("devuelve la politica para SUPERADMIN", async () => {
    const updatedAt = new Date("2026-05-14T10:00:00.000Z")
    mockAuth.mockResolvedValue({
      user: { id: "superadmin-1", role: "SUPERADMIN" },
    })
    mockGetCourseCompletionPolicy.mockResolvedValue({
      bypassCourseCompletionRestrictions: false,
      updatedAt,
    })

    const response = await GET(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.policy).toEqual({
      bypassCourseCompletionRestrictions: false,
      updatedAt: updatedAt.toISOString(),
    })
  })

  it("actualiza la politica con el userId del SUPERADMIN", async () => {
    const updatedAt = new Date("2026-05-14T10:30:00.000Z")
    mockAuth.mockResolvedValue({
      user: { id: "superadmin-1", role: "SUPERADMIN" },
    })
    mockUpdateCourseCompletionPolicy.mockResolvedValue({
      bypassCourseCompletionRestrictions: true,
      updatedAt,
    })

    const response = await PATCH(
      request({ bypassCourseCompletionRestrictions: true })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockUpdateCourseCompletionPolicy).toHaveBeenCalledWith({
      bypassCourseCompletionRestrictions: true,
      updatedBy: "superadmin-1",
    })
    expect(body.policy).toEqual({
      bypassCourseCompletionRestrictions: true,
      updatedAt: updatedAt.toISOString(),
    })
  })

  it("rechaza PATCH con payload invalido", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "superadmin-1", role: "SUPERADMIN" },
    })

    const response = await PATCH(
      request({ bypassCourseCompletionRestrictions: "true" })
    )

    expect(response.status).toBe(400)
    expect(mockUpdateCourseCompletionPolicy).not.toHaveBeenCalled()
  })
})
