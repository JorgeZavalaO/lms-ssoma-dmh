import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LessonSchema } from "@/validations/content"

// GET - Obtener lecciones de una unidad
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { unitId } = await params

    const lessons = await prisma.lesson.findMany({
      where: { unitId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { progress: true },
        },
      },
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error("Error fetching lessons:", error)
    return NextResponse.json(
      { error: "Error al obtener lecciones" },
      { status: 500 }
    )
  }
}

// POST - Crear lección
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { unitId } = await params
    const body = await req.json()
    
    // Calcular el orden automáticamente si no se proporciona
    let order = body.order
    if (!order) {
      const maxOrderLesson = await prisma.lesson.findFirst({
        where: { unitId },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      order = maxOrderLesson ? maxOrderLesson.order + 1 : 1
    }
    
    const validated = LessonSchema.parse({ ...body, order })

    const lesson = await prisma.lesson.create({
      data: {
        ...validated,
        unitId,
      },
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating lesson:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al crear lección" },
      { status: 500 }
    )
  }
}
