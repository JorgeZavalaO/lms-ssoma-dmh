import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

// POST /api/quizzes/[id]/attempt - Iniciar un nuevo intento
export async function POST(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: quizId } = await params;

    // Obtener el quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        quizQuestions: {
          include: {
            question: {
              include: {
                options: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Cuestionario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que esté publicado
    if (quiz.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "El cuestionario no está disponible" },
        { status: 403 }
      );
    }

    // Obtener collaboratorId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collaboratorId: true },
    });

    if (!user?.collaboratorId) {
      return NextResponse.json(
        { error: "No tienes un perfil de colaborador asociado" },
        { status: 400 }
      );
    }

    // Verificar intentos previos
    const previousAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        collaboratorId: user.collaboratorId,
      },
      orderBy: { attemptNumber: "desc" },
    });

    const lastAttempt = previousAttempts[0];

    // Verificar si ya hay un intento en progreso
    if (lastAttempt?.status === "IN_PROGRESS") {
      return NextResponse.json(lastAttempt);
    }

    // Verificar límite de intentos
    if (quiz.maxAttempts && previousAttempts.length >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: "Has alcanzado el número máximo de intentos" },
        { status: 400 }
      );
    }

    // Verificar si necesita remediación antes de reintentar
    if (
      lastAttempt &&
      lastAttempt.status === "FAILED" &&
      lastAttempt.requiresRemediation &&
      !lastAttempt.remediationCompleted
    ) {
      return NextResponse.json(
        {
          error: "Debes completar el contenido de remediación antes de volver a intentar",
          requiresRemediation: true,
          attemptId: lastAttempt.id,
        },
        { status: 400 }
      );
    }

    const attemptNumber = previousAttempts.length + 1;

    // Seleccionar preguntas (aleatorizar si está configurado)
    let questions = quiz.quizQuestions;
    
    if (quiz.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Limitar cantidad de preguntas si está configurado
    if (quiz.questionsPerAttempt && quiz.questionsPerAttempt < questions.length) {
      questions = questions.slice(0, quiz.questionsPerAttempt);
    }

    // Calcular puntos totales
    const pointsTotal = questions.reduce((sum, qq) => {
      return sum + (qq.points || qq.question.points);
    }, 0);

    // Crear el intento
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        collaboratorId: user.collaboratorId,
        attemptNumber,
        status: "IN_PROGRESS",
        pointsTotal,
      },
    });

    // Preparar las preguntas para enviar al cliente
    const questionsForClient = questions.map((qq) => {
      let options = qq.question.options;
      
      // Aleatorizar opciones si está configurado
      if (quiz.shuffleOptions) {
        options = [...options].sort(() => Math.random() - 0.5);
      }

      return {
        id: qq.question.id,
        questionText: qq.question.questionText,
        type: qq.question.type,
        points: qq.points || qq.question.points,
        options: options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          // No enviar isCorrect al cliente
        })),
      };
    });

    return NextResponse.json({
      attempt,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        instructions: quiz.instructions,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
      },
      questions: questionsForClient,
    }, { status: 201 });
  } catch (error) {
    console.error("Error al iniciar intento:", error);
    return NextResponse.json(
      { error: "Error al iniciar intento" },
      { status: 500 }
    );
  }
}
