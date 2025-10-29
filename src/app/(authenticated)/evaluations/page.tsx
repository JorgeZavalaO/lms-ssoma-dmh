import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientEvaluationsView } from "./client-evaluations-view"

export default async function EvaluationsPage() {
  const session = await auth()

  if (!session?.user || !session.user.collaboratorId) {
    redirect("/login")
  }

  // Obtener todas las evaluaciones disponibles para el colaborador
  const enrollments = await prisma.enrollment.findMany({
    where: {
      collaboratorId: session.user.collaboratorId,
      status: {
        in: ["ACTIVE", "COMPLETED"],
      },
      courseId: {
        not: null,
      },
    },
    include: {
      course: {
        include: {
          quizzes: {
            where: {
              status: "PUBLISHED",
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  })

  // Obtener todos los quizzes disponibles
  const availableQuizzes = enrollments.flatMap((enrollment) =>
    enrollment.course!.quizzes.map((quiz) => ({
      ...quiz,
      courseId: enrollment.course!.id,
      courseName: enrollment.course!.name,
      enrollmentId: enrollment.id,
    }))
  )

  // Obtener intentos previos del colaborador
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      collaboratorId: session.user.collaboratorId,
    },
    include: {
      quiz: {
        include: {
          course: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  })

  // Serializar datos para pasarlos al cliente
  const serializedAttempts = attempts
    .filter((attempt) => attempt.quiz.course !== null) // Filtrar intentos sin curso
    .map((attempt) => ({
      id: attempt.id,
      quizId: attempt.quizId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: attempt.score !== null ? Number(attempt.score) : null,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.submittedAt?.toISOString() || null,
      timeSpent: attempt.timeSpent,
      requiresRemediation: attempt.requiresRemediation,
      remediationCompleted: attempt.remediationCompleted,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        passingScore: attempt.quiz.passingScore,
        course: {
          id: attempt.quiz.course!.id,
          name: attempt.quiz.course!.name,
        },
      },
    }))

  return (
    <ClientEvaluationsView
      quizzes={availableQuizzes}
      attempts={serializedAttempts}
      collaboratorId={session.user.collaboratorId}
    />
  )
}
