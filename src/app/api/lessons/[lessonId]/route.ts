import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LessonUpdateSchema } from "@/validations/content"

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
