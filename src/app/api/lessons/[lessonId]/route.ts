import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LessonUpdateSchema } from "@/validations/content"

// POST - Actualizar progreso de lección
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.collaboratorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const collaboratorId = session.user.collaboratorId
    const { lessonId } = await params

    const body = await req.json().catch(() => ({}))
    const viewPercentage = Math.max(0, Math.min(100, Number(body.viewPercentage ?? 0)))
    const completed = Boolean(body.completed)
    const timeDeltaSeconds = Number(body.timeDeltaSeconds ?? 0)

    // Obtener lección para validar curso
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: { select: { courseId: true } } },
    })
    if (!lesson) {
      return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 })
    }

    // Obtener progreso actual para evitar retroceso
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: { lessonId_collaboratorId: { lessonId, collaboratorId } },
    })

    // No permitir retroceso de porcentaje (anti-spam)
    const finalViewPercentage = existingProgress
      ? Math.max(existingProgress.viewPercentage, viewPercentage)
      : viewPercentage

    // Upsert lesson_progress
    const lp = await prisma.lessonProgress.upsert({
      where: { lessonId_collaboratorId: { lessonId, collaboratorId } },
      create: {
        lessonId,
        collaboratorId,
        viewPercentage: finalViewPercentage,
        completed,
        completedAt: completed ? new Date() : null,
        lastViewedAt: new Date(),
      },
      update: {
        viewPercentage: finalViewPercentage,
        completed: completed ? true : undefined,
        completedAt: completed ? new Date() : undefined,
        lastViewedAt: new Date(),
      },
    })

    // Sumar timeSpent al courseProgress
    const courseId = lesson.unit.courseId

    const courseProgress = await prisma.courseProgress.upsert({
      where: { collaboratorId_courseId: { collaboratorId, courseId } },
      create: {
        collaboratorId,
        courseId,
        status: "IN_PROGRESS",
        progressPercent: 0,
        timeSpent: timeDeltaSeconds || 0,
        lastActivityAt: new Date(),
      },
      update: {
        timeSpent: { increment: timeDeltaSeconds || 0 } as any,
        lastActivityAt: new Date(),
      },
    })

    // Recalcular progressPercent
    const totalLessons = await prisma.lesson.count({
      where: { unit: { courseId } },
    })

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        collaboratorId,
        completed: true,
        lesson: { unit: { courseId } },
      },
    })

    const newPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    await prisma.courseProgress.update({
      where: { collaboratorId_courseId: { collaboratorId, courseId } },
      data: {
        progressPercent: newPercent,
        status: newPercent >= 100 ? "PASSED" : "IN_PROGRESS",
        lastActivityAt: new Date(),
        completedAt: newPercent >= 100 ? new Date() : undefined,
        passedAt: newPercent >= 100 ? new Date() : undefined,
      },
    })

    return NextResponse.json({
      ok: true,
      lessonProgress: lp,
      courseProgress: { progressPercent: newPercent },
    })
  } catch (error) {
    console.error("Error updating lesson progress:", error)
    return NextResponse.json(
      { error: "Error al actualizar progreso de la lección" },
      { status: 500 }
    )
  }
}

// GET - Obtener una lección específica
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { lessonId } = await params

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 })
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error("Error fetching lesson:", error)
    return NextResponse.json(
      { error: "Error al obtener lección" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar lección
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { lessonId } = await params
    const body = await req.json()
    const validated = LessonUpdateSchema.parse(body)

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: validated,
    })

    return NextResponse.json(lesson)
  } catch (error: unknown) {
    console.error("Error updating lesson:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al actualizar lección" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar lección
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { lessonId } = await params

    await prisma.lesson.delete({
      where: { id: lessonId },
    })

    return NextResponse.json({ message: "Lección eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting lesson:", error)
    return NextResponse.json(
      { error: "Error al eliminar lección" },
      { status: 500 }
    )
  }
}
