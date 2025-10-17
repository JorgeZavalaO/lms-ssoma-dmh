import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpdateQuestionSchema } from "@/validations/quiz";

type Params = Promise<{ id: string }>;

// GET /api/questions/[id] - Obtener una pregunta específica
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error al obtener pregunta:", error);
    return NextResponse.json(
      { error: "Error al obtener pregunta" },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - Actualizar pregunta
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = UpdateQuestionSchema.parse(body);

    // Verificar que la pregunta existe
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    const { options, ...questionData } = validatedData;

    // Actualizar pregunta y opciones
    const question = await prisma.$transaction(async (tx) => {
      // Si se proporcionan opciones, eliminar las anteriores y crear las nuevas
      if (options) {
        await tx.questionOption.deleteMany({
          where: { questionId: id },
        });

        await tx.questionOption.createMany({
          data: options.map((opt) => ({
            ...opt,
            questionId: id,
          })),
        });
      }

      // Actualizar la pregunta
      return await tx.question.update({
        where: { id },
        data: questionData,
        include: {
          options: {
            orderBy: { order: "asc" },
          },
        },
      });
    });

    return NextResponse.json(question);
  } catch (error: any) {
    console.error("Error al actualizar pregunta:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar pregunta" },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Eliminar pregunta
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la pregunta existe
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: {
        quizQuestions: true,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no esté siendo usada en algún quiz
    if (existingQuestion.quizQuestions.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una pregunta que está siendo usada en cuestionarios" },
        { status: 400 }
      );
    }

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Pregunta eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar pregunta:", error);
    return NextResponse.json(
      { error: "Error al eliminar pregunta" },
      { status: 500 }
    );
  }
}
