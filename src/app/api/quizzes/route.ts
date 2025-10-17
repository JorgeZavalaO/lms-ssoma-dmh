import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateQuizSchema } from "@/validations/quiz";

// GET /api/quizzes - Listar todos los cuestionarios
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const unitId = searchParams.get("unitId");
    const status = searchParams.get("status");

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;

    // Si es colaborador, solo mostrar quizzes publicados
    if (session.user.role === "COLLABORATOR") {
      where.status = "PUBLISHED";
    }

    const quizzes = await prisma.quiz.findMany({
      where,
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
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error al obtener cuestionarios:", error);
    return NextResponse.json(
      { error: "Error al obtener cuestionarios" },
      { status: 500 }
    );
  }
}

// POST /api/quizzes - Crear nuevo cuestionario
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateQuizSchema.parse(body);

    const { questionIds, ...quizData } = validatedData;

    // Verificar que todas las preguntas existen
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
    });

    if (questions.length !== questionIds.length) {
      return NextResponse.json(
        { error: "Algunas preguntas no existen" },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        createdBy: session.user.id,
        quizQuestions: {
          create: questionIds.map((qId, index) => ({
            questionId: qId,
            order: index + 1,
          })),
        },
      },
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

    return NextResponse.json(quiz, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear cuestionario:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear cuestionario" },
      { status: 500 }
    );
  }
}
