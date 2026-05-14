import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockEnsureCertificationForProgress, mockPrisma } = vi.hoisted(() => ({
  mockEnsureCertificationForProgress: vi.fn(),
  mockPrisma: {
    $transaction: vi.fn(),
    course: {
      findUnique: vi.fn(),
    },
    courseProgress: {
      count: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    enrollment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    learningPathCourse: {
      findMany: vi.fn(),
    },
    learningPathProgress: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/certificates", () => ({
  ensureCertificationForProgress: mockEnsureCertificationForProgress,
}))

import { markCoursePassedFromQuiz } from "../../src/lib/course-completion"

describe("markCoursePassedFromQuiz", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((callback) =>
      callback(mockPrisma)
    )
    mockPrisma.course.findUnique.mockResolvedValue({ duration: 2 })
    mockPrisma.enrollment.findFirst.mockResolvedValue({ id: "enrollment-1" })
    mockPrisma.enrollment.findMany.mockResolvedValue([])
    mockPrisma.courseProgress.count.mockResolvedValue(0)
    mockPrisma.courseProgress.upsert.mockResolvedValue({ id: "progress-1" })
    mockEnsureCertificationForProgress.mockResolvedValue({
      certificationId: "cert-1",
      created: true,
    })
  })

  it("conserva la regla normal si el curso no esta pendiente de evaluacion", async () => {
    mockPrisma.courseProgress.findUnique.mockResolvedValue({
      id: "progress-1",
      status: "IN_PROGRESS",
    })

    await expect(
      markCoursePassedFromQuiz({
        collaboratorId: "collab-1",
        courseId: "course-1",
        attemptId: "attempt-1",
        quizId: "quiz-1",
        score: 80,
        bypassCourseCompletionRestrictions: false,
      })
    ).resolves.toEqual({ marked: false })

    expect(mockPrisma.courseProgress.upsert).not.toHaveBeenCalled()
    expect(mockEnsureCertificationForProgress).not.toHaveBeenCalled()
  })

  it("con bypass activo culmina el curso aunque no exista progreso previo", async () => {
    mockPrisma.courseProgress.findUnique.mockResolvedValue(null)

    await expect(
      markCoursePassedFromQuiz({
        collaboratorId: "collab-1",
        courseId: "course-1",
        attemptId: "attempt-1",
        quizId: "quiz-1",
        score: 95,
        bypassCourseCompletionRestrictions: true,
      })
    ).resolves.toEqual({ marked: true, courseProgressId: "progress-1" })

    expect(mockPrisma.courseProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          collaboratorId: "collab-1",
          courseId: "course-1",
          enrollmentId: "enrollment-1",
          status: "PASSED",
          progressPercent: 100,
          attended: true,
          timeSpent: 7200,
        }),
        update: expect.objectContaining({
          status: "PASSED",
          progressPercent: 100,
          attended: true,
          timeSpent: 7200,
        }),
      })
    )
    expect(mockPrisma.enrollment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          collaboratorId: "collab-1",
          courseId: "course-1",
        }),
        data: expect.objectContaining({
          status: "COMPLETED",
          progressPercent: 100,
        }),
      })
    )
    expect(mockEnsureCertificationForProgress).toHaveBeenCalledWith(
      "progress-1",
      expect.objectContaining({
        certificateData: expect.objectContaining({
          score: 95,
          attemptId: "attempt-1",
          quizId: "quiz-1",
          trigger: "QUIZ_PASSED",
          bypassCourseCompletionRestrictions: true,
        }),
      })
    )
  })
})
