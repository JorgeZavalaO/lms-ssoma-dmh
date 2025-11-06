import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuizAttemptPDF } from '@/lib/quiz-pdf-generator'

type Params = Promise<{ id: string }>

/**
 * GET /api/attempts/[id]/export-pdf
 * Exporta un intento de quiz a PDF
 * Solo accesible para ADMIN y SUPERADMIN
 */
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth()

    // Verificar autenticación y rol
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No autorizado - Solo ADMIN y SUPERADMIN pueden exportar evaluaciones' },
        { status: 403 }
      )
    }

    const { id: attemptId } = await params

    // Obtener el intento con toda la información necesaria
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            course: {
              select: {
                name: true,
                code: true,
              },
            },
            quizQuestions: {
              include: {
                question: {
                  include: {
                    options: {
                      orderBy: {
                        order: 'asc',
                      },
                    },
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json(
        { error: 'Intento no encontrado' },
        { status: 404 }
      )
    }

    // Obtener información del colaborador
    const collaborator = await prisma.collaborator.findUnique({
      where: { id: attempt.collaboratorId },
      select: {
        fullName: true,
        dni: true,
        email: true,
      },
    })

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Colaborador no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para el PDF
    const questions = attempt.quiz.quizQuestions.map((qq) => ({
      id: qq.question.id,
      questionText: qq.question.questionText,
      type: qq.question.type,
      points: qq.points || qq.question.points,
      options: qq.question.options.map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        order: opt.order,
      })),
      correctFeedback: qq.question.correctFeedback,
      incorrectFeedback: qq.question.incorrectFeedback,
      explanation: qq.question.explanation,
    }))

    const pdfData = {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      score: attempt.score,
      pointsEarned: attempt.pointsEarned,
      pointsTotal: attempt.pointsTotal,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent,
      answers: attempt.answers as any,
      quiz: {
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        passingScore: attempt.quiz.passingScore,
        course: attempt.quiz.course,
      },
      collaborator: {
        fullName: collaborator.fullName,
        dni: collaborator.dni,
        email: collaborator.email,
      },
      questions,
      results: await calculateResults(attempt, questions),
    }

    // Generar el PDF
    const element = QuizAttemptPDF({ data: pdfData })
    const pdfBuffer = await renderToBuffer(element)

    // Crear nombre del archivo
    const fileName = `evaluacion_${collaborator.dni}_${attempt.quiz.title
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase()}_intento${attempt.attemptNumber}.pdf`

    // Retornar el PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generando PDF de evaluación:', error)
    const message = error instanceof Error ? error.message : 'Error al generar PDF'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Calcula los resultados de cada pregunta
 */
async function calculateResults(attempt: any, questions: any[]) {
  const results: any = {}

  if (!attempt.answers || attempt.status === 'IN_PROGRESS') {
    return results
  }

  const answers = attempt.answers as any

  for (const question of questions) {
    const userAnswer = answers[question.id]
    let isCorrect = false
    let pointsEarned = 0

    if (!userAnswer) {
      results[question.id] = {
        isCorrect: false,
        pointsEarned: 0,
      }
      continue
    }

    switch (question.type) {
      case 'SINGLE_CHOICE':
      case 'TRUE_FALSE': {
        const correctOption = question.options.find((opt: any) => opt.isCorrect)
        isCorrect = userAnswer === correctOption?.id
        pointsEarned = isCorrect ? question.points : 0
        break
      }

      case 'MULTIPLE_CHOICE': {
        const correctOptionIds = question.options
          .filter((opt: any) => opt.isCorrect)
          .map((opt: any) => opt.id)
          .sort()
        const userAnswers = Array.isArray(userAnswer) ? [...userAnswer].sort() : []
        isCorrect = JSON.stringify(correctOptionIds) === JSON.stringify(userAnswers)
        pointsEarned = isCorrect ? question.points : 0
        break
      }

      case 'ORDER': {
        const correctOrder = question.options
          .sort((a: any, b: any) => a.order - b.order)
          .map((opt: any) => opt.id)
        isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userAnswer)
        pointsEarned = isCorrect ? question.points : 0
        break
      }

      case 'FILL_BLANK': {
        // Para fill in the blank, se compara con las respuestas correctas
        const correctAnswers = question.options
          .filter((opt: any) => opt.isCorrect)
          .map((opt: any) => opt.optionText.toLowerCase().trim())
        const userAnswerText = userAnswer.toLowerCase().trim()
        isCorrect = correctAnswers.includes(userAnswerText)
        pointsEarned = isCorrect ? question.points : 0
        break
      }

      default:
        break
    }

    results[question.id] = {
      isCorrect,
      pointsEarned,
    }
  }

  return results
}
