import { beforeEach, describe, expect, it, vi } from "vitest"
import { CourseCompletionPolicySchema } from "../../src/validations/system-settings"

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    systemSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import {
  getCourseCompletionPolicy,
  SYSTEM_SETTINGS_ID,
  updateCourseCompletionPolicy,
} from "../../src/lib/system-settings"

describe("course completion policy settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("usa false por defecto cuando no existe la fila singleton", async () => {
    mockPrisma.systemSettings.findUnique.mockResolvedValue(null)

    await expect(getCourseCompletionPolicy()).resolves.toEqual({
      bypassCourseCompletionRestrictions: false,
      updatedAt: null,
    })
  })

  it("actualiza el singleton con el valor booleano recibido", async () => {
    const updatedAt = new Date("2026-05-14T10:00:00.000Z")
    mockPrisma.systemSettings.upsert.mockResolvedValue({
      bypassCourseCompletionRestrictions: true,
      updatedAt,
    })

    await expect(
      updateCourseCompletionPolicy({
        bypassCourseCompletionRestrictions: true,
        updatedBy: "superadmin-1",
      })
    ).resolves.toEqual({
      bypassCourseCompletionRestrictions: true,
      updatedAt,
    })

    expect(mockPrisma.systemSettings.upsert).toHaveBeenCalledWith({
      where: { id: SYSTEM_SETTINGS_ID },
      create: {
        id: SYSTEM_SETTINGS_ID,
        bypassCourseCompletionRestrictions: true,
        updatedBy: "superadmin-1",
      },
      update: {
        bypassCourseCompletionRestrictions: true,
        updatedBy: "superadmin-1",
      },
      select: {
        bypassCourseCompletionRestrictions: true,
        updatedAt: true,
      },
    })
  })

  it("rechaza payloads no booleanos", () => {
    const result = CourseCompletionPolicySchema.safeParse({
      bypassCourseCompletionRestrictions: "true",
    })

    expect(result.success).toBe(false)
  })
})
