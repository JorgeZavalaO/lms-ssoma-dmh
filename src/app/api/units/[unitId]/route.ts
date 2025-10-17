import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UnitUpdateSchema } from "@/validations/content"

// GET - Obtener una unidad específica
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

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 })
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error("Error fetching unit:", error)
    return NextResponse.json(
      { error: "Error al obtener unidad" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar unidad
export async function PUT(
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
    const validated = UnitUpdateSchema.parse(body)

    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: validated,
      include: {
        lessons: true,
      },
    })

    return NextResponse.json(unit)
  } catch (error: unknown) {
    console.error("Error updating unit:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al actualizar unidad" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar unidad
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { unitId } = await params

    await prisma.unit.delete({
      where: { id: unitId },
    })

    return NextResponse.json({ message: "Unidad eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting unit:", error)
    return NextResponse.json(
      { error: "Error al eliminar unidad" },
      { status: 500 }
    )
  }
}
