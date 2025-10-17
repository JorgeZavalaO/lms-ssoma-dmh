import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpdateLessonProgressSchema } from "@/validations/progress";

// PUT /api/progress/lessons/[lessonId] - Actualizar progreso de lección
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const validated = UpdateLessonProgressSchema.parse(body);

    const params = await props.params;
    // Verificar que la lección existe
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        unit: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lección no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario está inscrito en el curso
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        collaboratorId: session.user.id,
        courseId: lesson.unit.courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "No está inscrito en este curso" },
        { status: 403 }
      );
    }

    // Buscar o crear progreso de lección
    let lessonProgress = await prisma.lessonProgress.findFirst({
      where: {
        lessonId: params.lessonId,
        collaboratorId: session.user.id,
      },
    });

    if (lessonProgress) {
      // Actualizar progreso existente
      lessonProgress = await prisma.lessonProgress.update({
        where: { id: lessonProgress.id },
        data: {
          completed: validated.isCompleted !== undefined ? validated.isCompleted : lessonProgress.completed,
          viewPercentage: validated.isCompleted ? 100 : lessonProgress.viewPercentage,
          completedAt: validated.isCompleted && !lessonProgress.completed 
            ? new Date() 
            : lessonProgress.completedAt,
          lastViewedAt: new Date(),
        },
        include: {
          lesson: {
            select: { id: true, title: true, order: true },
          },
        },
      });
    } else {
      // Crear nuevo progreso
      lessonProgress = await prisma.lessonProgress.create({
        data: {
          lessonId: params.lessonId,
          collaboratorId: session.user.id,
          completed: validated.isCompleted || false,
          viewPercentage: validated.isCompleted ? 100 : 0,
          completedAt: validated.isCompleted ? new Date() : null,
        },
        include: {
          lesson: {
            select: { id: true, title: true, order: true },
          },
        },
      });
    }

    // Actualizar progreso del curso si está disponible
    const courseProgress = await prisma.courseProgress.findFirst({
      where: {
        collaboratorId: session.user.id,
        courseId: lesson.unit.courseId,
      },
    });

    if (courseProgress) {
      // Calcular porcentaje de avance
      const totalLessons = await prisma.lesson.count({
        where: {
          unit: {
            courseId: lesson.unit.courseId,
          },
        },
      });

      const completedLessons = await prisma.lessonProgress.count({
        where: {
          collaboratorId: session.user.id,
          completed: true,
          lesson: {
            unit: {
              courseId: lesson.unit.courseId,
            },
          },
        },
      });

      const progressPercent = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;

      // Actualizar progreso del curso
      await prisma.courseProgress.update({
        where: { id: courseProgress.id },
        data: {
          progressPercent,
          lastActivityAt: new Date(),
          status: progressPercent === 0 
            ? "NOT_STARTED" 
            : progressPercent === 100 
            ? "IN_PROGRESS" // Cambiar a PASSED cuando pase el quiz
            : "IN_PROGRESS",
        },
      });
    }

    return NextResponse.json(lessonProgress);
  } catch (error: any) {
    console.error("Error updating lesson progress:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar progreso de lección" },
      { status: 500 }
    );
  }
}
