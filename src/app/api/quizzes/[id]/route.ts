import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpdateQuizSchema } from "@/validations/quiz";

type Params = Promise<{ id: string }>;

// GET /api/quizzes/[id] - Obtener un cuestionario específico
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
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

    // Si es colaborador, solo puede ver quizzes publicados
    if (session.user.role === "COLLABORATOR" && quiz.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Cuestionario no disponible" },
        { status: 403 }
      );
    }

    // Si es colaborador, obtener sus intentos
    let attempts: any[] = [];
    if (session.user.role === "COLLABORATOR") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { collaboratorId: true },
      });

      if (user?.collaboratorId) {
        attempts = await prisma.quizAttempt.findMany({
          where: {
            quizId: id,
            collaboratorId: user.collaboratorId,
          },
          orderBy: { attemptNumber: "desc" },
        });
      }
    }

    return NextResponse.json({ ...quiz, attempts });
  } catch (error) {
    console.error("Error al obtener cuestionario:", error);
    return NextResponse.json(
      { error: "Error al obtener cuestionario" },
      { status: 500 }
    );
  }
}

// PUT /api/quizzes/[id] - Actualizar cuestionario
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = UpdateQuizSchema.parse(body);

    // Verificar que el quiz existe
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: "Cuestionario no encontrado" },
        { status: 404 }
      );
    }

    const { questionIds, ...quizData } = validatedData;

    const quiz = await prisma.$transaction(async (tx) => {
      // Si se proporcionan nuevas preguntas, actualizar la relación
      if (questionIds) {
        // Eliminar relaciones anteriores
        await tx.quizQuestion.deleteMany({
          where: { quizId: id },
        });

        // Crear nuevas relaciones
        await tx.quizQuestion.createMany({
          data: questionIds.map((qId, index) => ({
            quizId: id,
            questionId: qId,
            order: index + 1,
          })),
        });
      }

      // Actualizar el quiz
      return await tx.quiz.update({
        where: { id },
        data: quizData,
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
    });

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error("Error al actualizar cuestionario:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar cuestionario" },
      { status: 500 }
    );
  }
}

// DELETE /api/quizzes/[id] - Eliminar cuestionario
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el quiz existe
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        attempts: true,
      },
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: "Cuestionario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no tenga intentos
    if (existingQuiz.attempts.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un cuestionario con intentos registrados" },
        { status: 400 }
      );
    }

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Cuestionario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar cuestionario:", error);
    return NextResponse.json(
      { error: "Error al eliminar cuestionario" },
      { status: 500 }
    );
  }
}
