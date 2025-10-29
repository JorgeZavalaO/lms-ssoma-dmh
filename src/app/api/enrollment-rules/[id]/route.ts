import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UpdateEnrollmentRuleSchema } from "@/validations/enrollment"

// GET - Obtener una regla específica
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const rule = await prisma.enrollmentRule.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        learningPath: {
          select: {
            id: true,
            name: true,
            description: true,
            courses: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    })

    if (!rule) {
      return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error("Error fetching enrollment rule:", error)
    return NextResponse.json(
      { error: "Error al obtener regla" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una regla
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const validated = UpdateEnrollmentRuleSchema.parse(body)

    const rule = await prisma.enrollmentRule.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json(rule)
  } catch (error: unknown) {
    console.error("Error updating enrollment rule:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al actualizar regla" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una regla
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    // Desactivar inscripciones automáticas asociadas
    await prisma.enrollment.updateMany({
      where: { ruleId: id },
      data: { status: "CANCELLED" },
    })

    // Eliminar la regla
    await prisma.enrollmentRule.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Regla eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting enrollment rule:", error)
    return NextResponse.json(
      { error: "Error al eliminar regla" },
      { status: 500 }
    )
  }
}
