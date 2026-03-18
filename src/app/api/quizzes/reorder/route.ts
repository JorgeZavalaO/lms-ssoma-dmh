import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ReorderSchema = z.object({
  quizIds: z.array(z.string()).min(1),
})

// PUT - Reordenar quizzes de una unidad
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { quizIds } = ReorderSchema.parse(body)

    const quizzesDb = await prisma.quiz.findMany({
      where: { id: { in: quizIds } },
      select: { id: true, unitId: true },
    })

    if (quizzesDb.length !== quizIds.length) {
      return NextResponse.json({ error: "Algunos quizzes no existen" }, { status: 400 })
    }

    const unitId = quizzesDb[0].unitId
    if (!unitId) {
      return NextResponse.json(
        { error: "Los quizzes deben pertenecer a una unidad para reordenarse" },
        { status: 400 }
      )
    }

    const sameUnit = quizzesDb.every((q) => q.unitId === unitId)
    if (!sameUnit) {
      return NextResponse.json(
        { error: "Todos los quizzes deben pertenecer a la misma unidad" },
        { status: 400 }
      )
    }

    const totalQuizzesCount = await prisma.quiz.count({ where: { unitId } })
    if (totalQuizzesCount !== quizIds.length) {
      return NextResponse.json(
        { error: "Debe incluir todos los quizzes de la unidad para reordenar" },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.quiz.updateMany({
        where: { unitId },
        data: { order: { increment: 1000 } },
      }),
      ...quizIds.map((quizId, index) =>
        prisma.quiz.update({
          where: { id: quizId },
          data: { order: index + 1 },
        })
      ),
    ])

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error reordering quizzes:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al reordenar quizzes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
