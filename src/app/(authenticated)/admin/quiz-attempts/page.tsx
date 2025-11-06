import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientQuizAttempts } from "./client-quiz-attempts"

export default async function QuizAttemptsPage() {
  const session = await auth()

  // Verificar autenticación y rol
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    redirect("/dashboard")
  }

  // Obtener todos los intentos de quiz
  const attempts = await prisma.quizAttempt.findMany({
    include: {
      quiz: {
        include: {
          course: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  })

  // Obtener colaboradores
  const collaboratorIds = [...new Set(attempts.map((a) => a.collaboratorId))]
  const collaborators = await prisma.collaborator.findMany({
    where: {
      id: {
        in: collaboratorIds,
      },
    },
    select: {
      id: true,
      fullName: true,
      dni: true,
      email: true,
    },
  })

  const collaboratorsMap = new Map(collaborators.map((c) => [c.id, c]))

  // Serializar datos
  const serializedAttempts = attempts.map((attempt) => {
    const collaborator = collaboratorsMap.get(attempt.collaboratorId)
    
    if (!collaborator) {
      return null
    }

    return {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: attempt.score !== null ? Number(attempt.score) : null,
      pointsEarned: attempt.pointsEarned,
      pointsTotal: attempt.pointsTotal,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() || null,
      collaborator: {
        fullName: collaborator.fullName,
        dni: collaborator.dni,
        email: collaborator.email,
      },
      quiz: {
        title: attempt.quiz.title,
        passingScore: attempt.quiz.passingScore,
        course: attempt.quiz.course,
      },
    }
  }).filter(Boolean) as any[]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Evaluaciones de Colaboradores</h1>
        <p className="text-muted-foreground mt-2">
          Visualiza y descarga los intentos de evaluaciones realizados por los colaboradores
        </p>
      </div>
      <ClientQuizAttempts attempts={serializedAttempts} />
    </div>
  )
}
