import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LessonProgressSchema } from "@/validations/content"

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

    // Obtener el threshold de completado
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { completionThreshold: true },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 })
    }

    // Determinar si está completado según el threshold
    const completed = validated.viewPercentage >= lesson.completionThreshold

    const progress = await prisma.lessonProgress.upsert({
      where: {
        lessonId_collaboratorId: {
          lessonId,
          collaboratorId,
        },
      },
      update: {
        viewPercentage: validated.viewPercentage,
        completed,
        completedAt: completed ? new Date() : undefined,
        lastViewedAt: new Date(),
      },
      create: {
        lessonId,
        collaboratorId,
        viewPercentage: validated.viewPercentage,
        completed,
        completedAt: completed ? new Date() : undefined,
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
