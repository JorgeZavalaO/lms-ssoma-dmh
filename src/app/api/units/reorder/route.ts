import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ReorderSchema = z.object({
  unitIds: z.array(z.string()),
})

// PUT - Reordenar unidades
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    console.log("Reorder units request:", body)
    
    const { unitIds } = ReorderSchema.parse(body)
    console.log("Parsed unitIds:", unitIds)

    // Validaciones y datos necesarios
    const unitsDb = await prisma.unit.findMany({
      where: { id: { in: unitIds } },
      select: { id: true, courseId: true },
    })

    if (unitsDb.length !== unitIds.length) {
      return NextResponse.json({ error: "Algunas unidades no existen" }, { status: 400 })
    }

    const courseId = unitsDb[0].courseId
    const sameCourse = unitsDb.every((u) => u.courseId === courseId)
    if (!sameCourse) {
      return NextResponse.json({ error: "Todas las unidades deben pertenecer al mismo curso" }, { status: 400 })
    }

    const totalUnitsCount = await prisma.unit.count({ where: { courseId } })
    if (totalUnitsCount !== unitIds.length) {
      return NextResponse.json({ error: "Debe incluir todas las unidades del curso para reordenar" }, { status: 400 })
    }

    // Estrategia en 2 pasos para evitar conflicto con @@unique([courseId, order])
    await prisma.$transaction([
      // Paso 1: Desplazar temporalmente todos los órdenes del curso
      prisma.unit.updateMany({
        where: { courseId },
        data: { order: { increment: 1000 } },
      }),
      // Paso 2: Asignar el nuevo orden definitivo
      ...unitIds.map((unitId, index) =>
        prisma.unit.update({
          where: { id: unitId },
          data: { order: index + 1 },
        })
      ),
    ])

    console.log("Units reordered successfully")
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error reordering units:", error)
    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", error.issues)
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al reordenar unidades", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
