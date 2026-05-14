import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkCoursePrerequisites } from "@/lib/access";
import { secureShuffle } from "@/lib/quiz-security";
import { getCourseCompletionPolicy } from "@/lib/system-settings";

type Params = Promise<{ id: string }>;

// POST /api/quizzes/[id]/attempt - Iniciar un nuevo intento
export async function POST(req: NextRequest, { params }: { params: Params }) {
  try {
    void req;
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
        unit: {
          select: { courseId: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Cuestionario no encontrado" },
        { status: 404 },
      );
    }

    // Verificar que esté publicado
    if (quiz.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "El cuestionario no está disponible" },
        { status: 403 },
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
        { status: 400 },
      );
    }

    const courseId = quiz.courseId ?? quiz.unit?.courseId;
    if (!courseId) {
      return NextResponse.json(
        { error: "El cuestionario no está asociado a un curso válido" },
        { status: 400 },
      );
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        collaboratorId: user.collaboratorId,
        courseId,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "No tienes acceso asignado a este cuestionario" },
        { status: 403 },
      );
    }

    const policy = await getCourseCompletionPolicy();
    const bypassCourseCompletionRestrictions =
      policy.bypassCourseCompletionRestrictions;

    // Verificar que el colaborador haya iniciado el curso (no puede hacer quiz sin haber comenzado el contenido)
    const courseProgress = await prisma.courseProgress.findUnique({
      where: {
        collaboratorId_courseId: {
          collaboratorId: user.collaboratorId,
          courseId,
        },
      },
      select: { status: true },
    });

    if (
      !bypassCourseCompletionRestrictions &&
      (!courseProgress || courseProgress.status === "NOT_STARTED")
    ) {
      return NextResponse.json(
        {
          error:
            "Debes iniciar el contenido del curso antes de realizar el cuestionario",
        },
        { status: 403 },
      );
    }

    if (!bypassCourseCompletionRestrictions) {
      const prereq = await checkCoursePrerequisites(
        user.collaboratorId,
        courseId,
      );
      if (!prereq.allowed) {
        return NextResponse.json(
          {
            error:
              "Debes completar los prerrequisitos antes de iniciar este cuestionario",
            reason: prereq.reason,
            missing: prereq.missing,
          },
          { status: 403 },
        );
      }
    }

    // Seleccionar preguntas (aleatorizar si está configurado)
    let questions = quiz.quizQuestions;

    if (quiz.shuffleQuestions) {
      questions = secureShuffle(questions);
    }

    // Limitar cantidad de preguntas si está configurado
    if (
      quiz.questionsPerAttempt &&
      quiz.questionsPerAttempt < questions.length
    ) {
      questions = questions.slice(0, quiz.questionsPerAttempt);
    }

    // Calcular puntos totales
    const pointsTotal = questions.reduce((sum, qq) => {
      return sum + (qq.points || qq.question.points);
    }, 0);

    let attempt: any;
    let createdAttempt = false;

    try {
      attempt = await prisma.$transaction(async (tx) => {
        const previousAttempts = await tx.quizAttempt.findMany({
          where: {
            quizId,
            collaboratorId: user.collaboratorId!,
          },
          orderBy: { attemptNumber: "desc" },
        });

        const lastAttempt = previousAttempts[0];

        // Reusar intento activo para evitar duplicados por doble click/request concurrente
        if (lastAttempt?.status === "IN_PROGRESS") {
          return lastAttempt;
        }

        // Verificar límite de intentos
        if (quiz.maxAttempts && previousAttempts.length >= quiz.maxAttempts) {
          throw new Error("MAX_ATTEMPTS_REACHED");
        }

        // Verificar si necesita remediación antes de reintentar
        if (
          lastAttempt &&
          lastAttempt.status === "FAILED" &&
          lastAttempt.requiresRemediation &&
          !lastAttempt.remediationCompleted
        ) {
          const err = new Error("REMEDIATION_REQUIRED") as Error & {
            attemptId?: string;
          };
          err.attemptId = lastAttempt.id;
          throw err;
        }

        const attemptNumber = previousAttempts.length + 1;
        createdAttempt = true;

        return tx.quizAttempt.create({
          data: {
            quizId,
            collaboratorId: user.collaboratorId!,
            attemptNumber,
            status: "IN_PROGRESS",
            pointsTotal,
          },
        });
      });
    } catch (error: any) {
      if (error?.message === "MAX_ATTEMPTS_REACHED") {
        return NextResponse.json(
          { error: "Has alcanzado el número máximo de intentos" },
          { status: 400 },
        );
      }

      if (error?.message === "REMEDIATION_REQUIRED") {
        return NextResponse.json(
          {
            error:
              "Debes completar el contenido de remediación antes de volver a intentar",
            requiresRemediation: true,
            attemptId: error.attemptId,
          },
          { status: 400 },
        );
      }

      // Condición de carrera: otro request creó el intento entre lecturas
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const inProgressAttempt = await prisma.quizAttempt.findFirst({
          where: {
            quizId,
            collaboratorId: user.collaboratorId,
            status: "IN_PROGRESS",
          },
          orderBy: { attemptNumber: "desc" },
        });

        if (inProgressAttempt) {
          attempt = inProgressAttempt;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Preparar las preguntas para enviar al cliente
    const questionsForClient = questions.map((qq) => {
      let options = qq.question.options;

      if (quiz.shuffleOptions) {
        options = secureShuffle(options);
      }

      return {
        id: qq.question.id,
        text: qq.question.questionText,
        questionText: qq.question.questionText,
        type: qq.question.type,
        points: qq.points || qq.question.points,
        options: options.map((opt) => ({
          id: opt.id,
          text: opt.optionText,
          optionText: opt.optionText,
        })),
      };
    });

    return NextResponse.json(
      {
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
      },
      { status: createdAttempt ? 201 : 200 },
    );
  } catch (error) {
    console.error("Error al iniciar intento:", error);
    return NextResponse.json(
      { error: "Error al iniciar intento" },
      { status: 500 },
    );
  }
}
