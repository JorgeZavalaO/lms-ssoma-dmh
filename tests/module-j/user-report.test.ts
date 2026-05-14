import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    collaborator: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    enrollment: {
      findMany: vi.fn(),
    },
    quizAttempt: {
      findMany: vi.fn(),
    },
    progressAlert: {
      findMany: vi.fn(),
    },
    certificationRecord: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { getUserReport, getUserReportDetail } from "../../src/lib/reports"

const NOW = new Date("2026-05-14T12:00:00.000Z")

const COLLABORATOR = {
  id: "collab-1",
  dni: "12345678",
  fullName: "Ana Perez",
  email: "ana@example.com",
  status: "ACTIVE",
  entryDate: new Date("2024-01-01T00:00:00.000Z"),
  site: { id: "site-1", name: "Lima" },
  area: { id: "area-1", name: "Operaciones" },
  position: { id: "position-1", name: "Supervisor" },
}

function enrollmentWithProgress(progress: Record<string, unknown> | null) {
  return {
    id: "enrollment-1",
    collaboratorId: "collab-1",
    courseId: "course-1",
    status: "ACTIVE",
    enrolledAt: new Date("2026-05-01T00:00:00.000Z"),
    startedAt: null,
    completedAt: null,
    course: {
      id: "course-1",
      code: "SSOMA-001",
      name: "Inducción SSOMA",
      duration: 2,
    },
    courseProgress: progress,
  }
}

const PASSED_PROGRESS = {
  id: "progress-1",
  status: "PASSED",
  progressPercent: 100,
  timeSpent: 600,
  lastActivityAt: new Date("2026-05-10T10:00:00.000Z"),
  attended: true,
  startedAt: new Date("2026-05-01T10:00:00.000Z"),
  completedAt: new Date("2026-05-10T10:00:00.000Z"),
  passedAt: new Date("2026-05-10T10:00:00.000Z"),
  failedAt: null,
  expiresAt: new Date("2027-05-10T10:00:00.000Z"),
  certifiedAt: new Date("2026-05-10T10:00:00.000Z"),
}

const PASSED_ATTEMPT = {
  id: "attempt-1",
  collaboratorId: "collab-1",
  quizId: "quiz-1",
  attemptNumber: 1,
  status: "PASSED",
  score: 90,
  pointsEarned: 18,
  pointsTotal: 20,
  timeSpent: 300,
  startedAt: new Date("2026-05-10T09:00:00.000Z"),
  submittedAt: new Date("2026-05-10T09:05:00.000Z"),
  quiz: {
    title: "Evaluación final",
    courseId: "course-1",
    course: { id: "course-1", name: "Inducción SSOMA" },
    unit: null,
  },
}

describe("getUserReport", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    vi.clearAllMocks()
    mockPrisma.collaborator.count.mockResolvedValue(1)
    mockPrisma.collaborator.findMany.mockResolvedValue([COLLABORATOR])
    mockPrisma.enrollment.findMany.mockResolvedValue([])
    mockPrisma.quizAttempt.findMany.mockResolvedValue([])
    mockPrisma.progressAlert.findMany.mockResolvedValue([])
    mockPrisma.certificationRecord.findMany.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("calcula usuario sin progreso como pendiente", async () => {
    mockPrisma.enrollment.findMany.mockResolvedValue([
      enrollmentWithProgress(null),
    ])

    const report = await getUserReport({ page: 1, pageSize: 20 })

    expect(report.records).toHaveLength(1)
    expect(report.records[0].kpis).toMatchObject({
      totalEnrollments: 1,
      completedCourses: 0,
      pendingCourses: 1,
      averageProgress: 0,
      averageScore: 0,
      reportedHours: 0,
    })
  })

  it("calcula aprobado, horas oficiales, nota en puntos y certificados", async () => {
    mockPrisma.enrollment.findMany.mockResolvedValue([
      enrollmentWithProgress(PASSED_PROGRESS),
    ])
    mockPrisma.quizAttempt.findMany.mockResolvedValue([PASSED_ATTEMPT])
    mockPrisma.progressAlert.findMany.mockResolvedValue([
      { collaboratorId: "collab-1" },
    ])
    mockPrisma.certificationRecord.findMany.mockResolvedValue([
      { collaboratorId: "collab-1" },
    ])

    const report = await getUserReport({ page: 1, pageSize: 20 })
    const kpis = report.records[0].kpis

    expect(kpis.completedCourses).toBe(1)
    expect(kpis.averageProgress).toBe(100)
    expect(kpis.averageScore).toBe(18)
    expect(kpis.passRate).toBe(100)
    expect(kpis.reportedHours).toBe(2)
    expect(kpis.openAlerts).toBe(1)
    expect(kpis.validCertificates).toBe(1)
  })

  it("cuenta cursos vencidos por fecha aunque el progreso esté aprobado", async () => {
    mockPrisma.enrollment.findMany.mockResolvedValue([
      enrollmentWithProgress({
        ...PASSED_PROGRESS,
        expiresAt: new Date("2026-05-01T00:00:00.000Z"),
      }),
    ])

    const report = await getUserReport({ page: 1, pageSize: 20 })

    expect(report.records[0].kpis.completedCourses).toBe(1)
    expect(report.records[0].kpis.expiredCourses).toBe(1)
  })

  it("aplica paginación al query de colaboradores", async () => {
    await getUserReport({ page: 2, pageSize: 1 })

    expect(mockPrisma.collaborator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        take: 1,
      }),
    )
  })
})

describe("getUserReportDetail", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    vi.clearAllMocks()
    mockPrisma.collaborator.findFirst.mockResolvedValue(COLLABORATOR)
    mockPrisma.enrollment.findMany.mockResolvedValue([
      enrollmentWithProgress(PASSED_PROGRESS),
    ])
    mockPrisma.quizAttempt.findMany.mockResolvedValue([PASSED_ATTEMPT])
    mockPrisma.progressAlert.findMany
      .mockResolvedValueOnce([{ collaboratorId: "collab-1" }])
      .mockResolvedValueOnce([
        {
          id: "alert-1",
          courseId: "course-1",
          type: "EXPIRING_SOON",
          severity: 2,
          title: "Por vencer",
          dueDate: new Date("2026-06-01T00:00:00.000Z"),
          triggeredAt: new Date("2026-05-14T00:00:00.000Z"),
          course: { name: "Inducción SSOMA" },
        },
      ])
    mockPrisma.certificationRecord.findMany
      .mockResolvedValueOnce([{ collaboratorId: "collab-1" }])
      .mockResolvedValueOnce([
        {
          id: "cert-1",
          courseId: "course-1",
          certificateNumber: "CERT-001",
          issuedAt: new Date("2026-05-10T00:00:00.000Z"),
          expiresAt: new Date("2027-05-10T00:00:00.000Z"),
          isValid: true,
          course: { name: "Inducción SSOMA" },
        },
      ])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("devuelve ficha, cursos, intentos, certificaciones y alertas", async () => {
    const detail = await getUserReportDetail("collab-1")

    expect(detail.collaborator.fullName).toBe("Ana Perez")
    expect(detail.courses[0]).toMatchObject({
      courseName: "Inducción SSOMA",
      effectiveStatus: "PASSED",
      bestScore: 18,
      reportedHours: 2,
    })
    expect(detail.attempts).toHaveLength(1)
    expect(detail.certifications).toHaveLength(1)
    expect(detail.alerts).toHaveLength(1)
  })
})
