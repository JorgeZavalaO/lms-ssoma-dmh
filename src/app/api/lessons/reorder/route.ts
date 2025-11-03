import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ReorderSchema = z.object({
  lessonIds: z.array(z.string()),
})

// PUT - Reordenar lecciones
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    console.log("Reorder lessons request:", body)
    
    const { lessonIds } = ReorderSchema.parse(body)
    console.log("Parsed lessonIds:", lessonIds)

    // Validaciones y datos necesarios
    const lessonsDb = await prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, unitId: true },
    })

    if (lessonsDb.length !== lessonIds.length) {
      return NextResponse.json({ error: "Algunas lecciones no existen" }, { status: 400 })
    }

    const unitId = lessonsDb[0].unitId
    const sameUnit = lessonsDb.every((l) => l.unitId === unitId)
    if (!sameUnit) {
      return NextResponse.json({ error: "Todas las lecciones deben pertenecer a la misma unidad" }, { status: 400 })
    }

    const totalLessonsCount = await prisma.lesson.count({ where: { unitId } })
    if (totalLessonsCount !== lessonIds.length) {
      return NextResponse.json({ error: "Debe incluir todas las lecciones de la unidad para reordenar" }, { status: 400 })
    }

    // Estrategia en 2 pasos para evitar conflicto con @@unique([unitId, order])
    await prisma.$transaction([
      // Paso 1: Desplazar temporalmente todos los órdenes de la unidad
      prisma.lesson.updateMany({
        where: { unitId },
        data: { order: { increment: 1000 } },
      }),
      // Paso 2: Asignar el nuevo orden definitivo
      ...lessonIds.map((lessonId, index) =>
        prisma.lesson.update({
          where: { id: lessonId },
          data: { order: index + 1 },
        })
      ),
    ])

    console.log("Lessons reordered successfully")
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error reordering lessons:", error)
    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", error.issues)
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al reordenar lecciones", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
