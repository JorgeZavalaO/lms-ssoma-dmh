import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SubmitQuizAttemptSchema } from "@/validations/quiz";

type Params = Promise<{ id: string }>;

// POST /api/attempts/[id]/submit - Enviar respuestas y calificar
export async function POST(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: attemptId } = await params;
    const body = await req.json();
    const validatedData = SubmitQuizAttemptSchema.parse(body);

    // Obtener el intento
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            quizQuestions: {
              include: {
                question: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Intento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el intento pertenece al usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collaboratorId: true },
    });

    if (!user?.collaboratorId || attempt.collaboratorId !== user.collaboratorId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Verificar que el intento esté en progreso
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Este intento ya fue enviado" },
        { status: 400 }
      );
    }

    // Calificar respuestas
    let pointsEarned = 0;
    const results: any = {};

    for (const quizQuestion of attempt.quiz.quizQuestions) {
      const question = quizQuestion.question;
      const userAnswer = validatedData.answers[question.id];
      const questionPoints = quizQuestion.points || question.points;

      let isCorrect = false;

      switch (question.type) {
        case "SINGLE_CHOICE":
        case "TRUE_FALSE": {
          const correctOption = question.options.find((opt) => opt.isCorrect);
          isCorrect = userAnswer === correctOption?.id;
          break;
        }

        case "MULTIPLE_CHOICE": {
          const correctOptionIds = question.options
            .filter((opt) => opt.isCorrect)
            .map((opt) => opt.id)
            .sort();
          const userAnswers = Array.isArray(userAnswer)
            ? [...userAnswer].sort()
            : [];
          isCorrect =
            JSON.stringify(correctOptionIds) === JSON.stringify(userAnswers);
          break;
        }

        case "ORDER": {
          const correctOrder = [...question.options]
            .sort((a, b) => a.order - b.order)
            .map((opt) => opt.id);
          const userOrder = Array.isArray(userAnswer) ? userAnswer : [];
          isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
          break;
        }

        case "FILL_BLANK": {
          // Para completar espacios, comparar ignorando mayúsculas/minúsculas
          const correctOption = question.options.find((opt) => opt.isCorrect);
          isCorrect =
            typeof userAnswer === "string" &&
            userAnswer.toLowerCase().trim() ===
              correctOption?.optionText.toLowerCase().trim();
          break;
        }

        default:
          break;
      }

      if (isCorrect) {
        pointsEarned += questionPoints;
      }

      results[question.id] = {
        isCorrect,
        userAnswer,
        points: isCorrect ? questionPoints : 0,
        feedback: isCorrect
          ? question.correctFeedback
          : question.incorrectFeedback,
        explanation: question.explanation,
      };
    }

    // Calcular puntuación porcentual
    const score = (pointsEarned / attempt.pointsTotal!) * 100;

    // Determinar si aprobó
    const passed = score >= attempt.quiz.passingScore;
    const status = passed ? "PASSED" : "FAILED";

    // Calcular tiempo empleado
    const timeSpent = Math.floor(
      (new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000
    );

    // Actualizar el intento
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        answers: validatedData.answers,
        status,
        score,
        pointsEarned,
        submittedAt: new Date(),
        timeSpent,
        requiresRemediation: !passed,
      },
    });

    // Preparar respuesta
    const response: any = {
      attempt: updatedAttempt,
      results,
      summary: {
        totalQuestions: attempt.quiz.quizQuestions.length,
        correctAnswers: Object.values(results).filter((r: any) => r.isCorrect)
          .length,
        score,
        passed,
        pointsEarned,
        pointsTotal: attempt.pointsTotal,
        timeSpent,
      },
    };

    // Mostrar respuestas correctas solo si está configurado
    if (attempt.quiz.showCorrectAnswers) {
      response.correctAnswers = {};
      for (const quizQuestion of attempt.quiz.quizQuestions) {
        const question = quizQuestion.question;
        response.correctAnswers[question.id] = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id);
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error al enviar intento:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al enviar intento" },
      { status: 500 }
    );
  }
}

// GET /api/attempts/[id] - Obtener resultado de un intento
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: attemptId } = await params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            quizQuestions: {
              include: {
                question: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Intento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el intento pertenece al usuario o es admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collaboratorId: true },
    });

    const isOwner = user?.collaboratorId === attempt.collaboratorId;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    return NextResponse.json(attempt);
  } catch (error) {
    console.error("Error al obtener intento:", error);
    return NextResponse.json(
      { error: "Error al obtener intento" },
      { status: 500 }
    );
  }
}
