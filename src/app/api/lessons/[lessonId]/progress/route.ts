import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LessonProgressSchema } from "@/validations/content"
import { capLessonProgress } from "@/lib/progress"

// GET - Obtener progreso de una lección para el usuario actual
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

    // Obtener el colaborador del usuario actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collaboratorId: true },
    })

    const collaboratorId = user?.collaboratorId

    if (!collaboratorId) {
      return NextResponse.json({ error: "Usuario sin colaborador asociado" }, { status: 400 })
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        lessonId_collaboratorId: {
          lessonId,
          collaboratorId,
        },
      },
      include: {
        lesson: {
          select: {
            title: true,
            type: true,
            completionThreshold: true,
          },
        },
      },
    })

    return NextResponse.json(progress || {
      lessonId,
      collaboratorId,
      viewPercentage: 0,
      completed: false,
    })
  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json(
      { error: "Error al obtener progreso" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar progreso de una lección
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { lessonId } = await params

    // Obtener el colaborador del usuario actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collaboratorId: true },
    })

    const collaboratorId = user?.collaboratorId
  const body = await req.json()
  const validated = LessonProgressSchema.parse(body)

    if (!collaboratorId) {
      return NextResponse.json({ error: "Usuario sin colaborador asociado" }, { status: 400 })
    }

    // Obtener datos de lección (threshold y tipo)
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        completionThreshold: true,
        type: true,
        unit: { select: { courseId: true } },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 })
    }

    // Anti-salto: calcular vista permitida en función del tiempo reproducido
    const existing = await prisma.lessonProgress.findUnique({
      where: {
        lessonId_collaboratorId: { lessonId, collaboratorId },
      },
      select: { viewPercentage: true, lastViewedAt: true },
    })

    const prevView = existing?.viewPercentage ?? 0
    const now = new Date()
    const serverDeltaSec = existing?.lastViewedAt
      ? Math.max(0, Math.round((now.getTime() - existing.lastViewedAt.getTime()) / 1000))
      : undefined

    let cappedView: number
    let completed: boolean
    // Calcular delta efectivo de tiempo para acumular en CourseProgress.timeSpent
    const clientDelta = Math.max(0, validated.timeDeltaSeconds ?? 0)
    const effectiveDeltaSec = serverDeltaSec !== undefined
      ? Math.max(0, Math.min(clientDelta, serverDeltaSec + 3))
      : clientDelta

    // Forzar completado manual en contenidos NO-VIDEO
    if (validated.manualComplete && lesson.type !== "VIDEO") {
      // Respetar el valor más alto entre previo, solicitado y el umbral de completado
      const requested = Math.max(validated.viewPercentage ?? 0, lesson.completionThreshold)
      cappedView = Math.min(100, Math.max(prevView, requested))
      completed = true
    } else {
      const calc = capLessonProgress(
        prevView,
        validated.viewPercentage,
        serverDeltaSec,
        validated.timeDeltaSeconds,
        validated.duration ?? undefined
      )
      cappedView = calc.cappedView
      // Determinar si está completado según el threshold con el valor capado
      completed = cappedView >= lesson.completionThreshold
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        lessonId_collaboratorId: {
          lessonId,
          collaboratorId,
        },
      },
      update: {
        viewPercentage: cappedView,
        completed,
        completedAt: completed ? new Date() : undefined,
        lastViewedAt: new Date(),
      },
      create: {
        lessonId,
        collaboratorId,
        viewPercentage: cappedView,
        completed,
        completedAt: completed ? new Date() : undefined,
      },
    })

    // Actualizar CourseProgress: acumular tiempo y recalcular % de curso
    const courseId = lesson.unit.courseId

    await prisma.courseProgress.upsert({
      where: { collaboratorId_courseId: { collaboratorId, courseId } },
      create: {
        collaboratorId,
        courseId,
        status: "IN_PROGRESS",
        progressPercent: 0,
        timeSpent: effectiveDeltaSec || 0,
        lastActivityAt: new Date(),
      },
      update: {
        timeSpent: { increment: effectiveDeltaSec || 0 } as any,
        lastActivityAt: new Date(),
      },
    })

    // Recalcular progreso del curso basado en lecciones completadas
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
    const isFullyCompleted = newPercent >= 100

    // Si el curso se completa al 100%, obtener la duración configurada y ajustar timeSpent
    let finalTimeSpent: number | undefined = undefined
    let attended = false
    
    if (isFullyCompleted) {
      const courseData = await prisma.course.findUnique({
        where: { id: courseId },
        select: { duration: true }, // duración en horas
      })
      
      if (courseData?.duration) {
        // Convertir duración de horas a segundos
        finalTimeSpent = courseData.duration * 3600
        attended = true
      }
    }

    await prisma.courseProgress.update({
      where: { collaboratorId_courseId: { collaboratorId, courseId } },
      data: {
        progressPercent: newPercent,
        status: isFullyCompleted ? "PASSED" : "IN_PROGRESS",
        lastActivityAt: new Date(),
        completedAt: isFullyCompleted ? new Date() : undefined,
        passedAt: isFullyCompleted ? new Date() : undefined,
        attended: isFullyCompleted ? attended : undefined,
        ...(finalTimeSpent !== undefined && { timeSpent: finalTimeSpent }),
      },
    })

    return NextResponse.json(progress)
  } catch (error: unknown) {
    console.error("Error updating progress:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al actualizar progreso" },
      { status: 500 }
    )
  }
}
