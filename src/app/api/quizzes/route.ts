import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateQuizSchema } from "@/validations/quiz";
import { sanitizeQuizForCollaborator } from "@/lib/quiz-security";

// GET /api/quizzes - Listar todos los cuestionarios
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = session.user

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const unitId = searchParams.get("unitId");
    const status = searchParams.get("status");

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;

    // Si es colaborador, solo mostrar quizzes publicados
    if (user.role === "COLLABORATOR") {
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
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    if (user.role === "COLLABORATOR") {
      return NextResponse.json(
        quizzes.map((quiz) => sanitizeQuizForCollaborator(quiz))
      );
    }

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

    if (quizData.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: quizData.courseId },
        select: { id: true },
      });

      if (!course) {
        return NextResponse.json(
          { error: "El curso seleccionado no existe" },
          { status: 400 }
        );
      }
    }

    let unitCourseId: string | undefined;
    if (quizData.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: quizData.unitId },
        select: { id: true, courseId: true },
      });

      if (!unit) {
        return NextResponse.json(
          { error: "La unidad seleccionada no existe" },
          { status: 400 }
        );
      }

      unitCourseId = unit.courseId;

      if (quizData.courseId && unit.courseId !== quizData.courseId) {
        return NextResponse.json(
          { error: "La unidad no pertenece al curso seleccionado" },
          { status: 400 }
        );
      }
    }

    if (!quizData.courseId && unitCourseId) {
      quizData.courseId = unitCourseId;
    }

    let order = quizData.order;
    if (quizData.unitId && !order) {
      const maxOrderQuiz = await prisma.quiz.findFirst({
        where: { unitId: quizData.unitId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (maxOrderQuiz?.order || 0) + 1;
    }

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
        order,
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
