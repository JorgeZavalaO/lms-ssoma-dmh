import { Prisma } from "@prisma/client"
import { ensureCertificationForProgress } from "@/lib/certificates"
import { prisma } from "@/lib/prisma"

type MarkCoursePassedFromQuizInput = {
  collaboratorId: string
  courseId: string
  attemptId: string
  quizId: string
  score: number
  bypassCourseCompletionRestrictions: boolean
}

type MarkCoursePassedFromQuizResult =
  | { marked: false }
  | { marked: true; courseProgressId: string }

async function recalculateLearningPathProgress(
  tx: Prisma.TransactionClient,
  collaboratorId: string
) {
  const pathEnrollments = await tx.enrollment.findMany({
    where: {
      collaboratorId,
      learningPathId: { not: null },
      status: { in: ["ACTIVE", "COMPLETED", "PENDING"] },
    },
    select: { learningPathId: true },
  })

  const learningPathIds = Array.from(
    new Set(
      pathEnrollments
        .map((enrollment) => enrollment.learningPathId)
        .filter((id): id is string => Boolean(id))
    )
  )

  for (const learningPathId of learningPathIds) {
    const pathCourses = await tx.learningPathCourse.findMany({
      where: { pathId: learningPathId },
      select: { courseId: true },
    })

    if (pathCourses.length === 0) {
      await tx.learningPathProgress.upsert({
        where: {
          collaboratorId_learningPathId: {
            collaboratorId,
            learningPathId,
          },
        },
        create: {
          collaboratorId,
          learningPathId,
          progressPercent: 0,
          coursesCompleted: 0,
          coursesTotal: 0,
          startedAt: new Date(),
          lastActivityAt: new Date(),
        },
        update: {
          progressPercent: 0,
          coursesCompleted: 0,
          coursesTotal: 0,
          lastActivityAt: new Date(),
          completedAt: null,
        },
      })
      continue
    }

    const courseIds = pathCourses.map((course) => course.courseId)
    const completedCourses = await tx.courseProgress.count({
      where: {
        collaboratorId,
        courseId: { in: courseIds },
        status: "PASSED",
      },
    })

    const coursesTotal = courseIds.length
    const progressPercent = Math.round((completedCourses / coursesTotal) * 100)
    const completedAt = progressPercent === 100 ? new Date() : null

    await tx.learningPathProgress.upsert({
      where: {
        collaboratorId_learningPathId: {
          collaboratorId,
          learningPathId,
        },
      },
      create: {
        collaboratorId,
        learningPathId,
        progressPercent,
        coursesCompleted: completedCourses,
        coursesTotal,
        startedAt: new Date(),
        completedAt,
        lastActivityAt: new Date(),
      },
      update: {
        progressPercent,
        coursesCompleted: completedCourses,
        coursesTotal,
        completedAt,
        lastActivityAt: new Date(),
      },
    })

    await tx.enrollment.updateMany({
      where: {
        collaboratorId,
        learningPathId,
        status: { not: "CANCELLED" },
      },
      data: {
        progressPercent,
        status: progressPercent === 100 ? "COMPLETED" : "ACTIVE",
        startedAt: progressPercent > 0 ? new Date() : undefined,
        completedAt,
      },
    })
  }
}

export async function markCoursePassedFromQuiz({
  collaboratorId,
  courseId,
  attemptId,
  quizId,
  score,
  bypassCourseCompletionRestrictions,
}: MarkCoursePassedFromQuizInput): Promise<MarkCoursePassedFromQuizResult> {
  const result = await prisma.$transaction(async (tx) => {
    const existingProgress = await tx.courseProgress.findUnique({
      where: {
        collaboratorId_courseId: {
          collaboratorId,
          courseId,
        },
      },
      select: { id: true, status: true, startedAt: true },
    })

    if (
      !bypassCourseCompletionRestrictions &&
      existingProgress?.status !== "PENDING_EVALUATION"
    ) {
      return { marked: false as const }
    }

    const [course, linkedEnrollment] = await Promise.all([
      tx.course.findUnique({
        where: { id: courseId },
        select: { duration: true },
      }),
      tx.enrollment.findFirst({
        where: {
          collaboratorId,
          courseId,
          status: { not: "CANCELLED" },
        },
        orderBy: { enrolledAt: "desc" },
        select: { id: true },
      }),
    ])

    const now = new Date()
    const finalTimeSpent = course?.duration ? course.duration * 3600 : undefined

    const updatedCourseProgress = await tx.courseProgress.upsert({
      where: {
        collaboratorId_courseId: {
          collaboratorId,
          courseId,
        },
      },
      create: {
        collaboratorId,
        courseId,
        ...(linkedEnrollment?.id && { enrollmentId: linkedEnrollment.id }),
        status: "PASSED",
        progressPercent: 100,
        timeSpent: finalTimeSpent ?? 0,
        attended: true,
        startedAt: now,
        completedAt: now,
        passedAt: now,
        lastActivityAt: now,
      },
      update: {
        ...(linkedEnrollment?.id && { enrollmentId: linkedEnrollment.id }),
        status: "PASSED",
        progressPercent: 100,
        attended: true,
        ...(existingProgress?.startedAt ? {} : { startedAt: now }),
        completedAt: now,
        passedAt: now,
        lastActivityAt: now,
        ...(finalTimeSpent !== undefined && { timeSpent: finalTimeSpent }),
      },
      select: { id: true },
    })

    await tx.enrollment.updateMany({
      where: {
        collaboratorId,
        courseId,
        status: { not: "CANCELLED" },
      },
      data: {
        status: "COMPLETED",
        progressPercent: 100,
        startedAt: now,
        completedAt: now,
      },
    })

    await recalculateLearningPathProgress(tx, collaboratorId)

    return {
      marked: true as const,
      courseProgressId: updatedCourseProgress.id,
    }
  })

  if (!result.marked) {
    return result
  }

  try {
    await ensureCertificationForProgress(result.courseProgressId, {
      certificateData: {
        score,
        attemptId,
        quizId,
        trigger: "QUIZ_PASSED",
        bypassCourseCompletionRestrictions,
      },
      trigger: "QUIZ_PASSED",
    })
  } catch (error) {
    console.error(
      `[CERT_PENDING] No se pudo emitir certificado automaticamente.` +
        ` courseProgressId=${result.courseProgressId}` +
        ` collaboratorId=${collaboratorId}` +
        ` courseId=${courseId}:`,
      error
    )
  }

  return result
}
