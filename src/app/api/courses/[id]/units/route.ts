import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UnitSchema } from "@/validations/content"

// GET - Obtener unidades de un curso
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

    const units = await prisma.unit.findMany({
      where: { courseId: id },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error("Error fetching units:", error)
    return NextResponse.json(
      { error: "Error al obtener unidades" },
      { status: 500 }
    )
  }
}

// POST - Crear unidad
export async function POST(
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
    
    // Calcular el orden automáticamente si no se proporciona
    let order = body.order
    if (!order) {
      const maxOrderUnit = await prisma.unit.findFirst({
        where: { courseId: id },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      order = maxOrderUnit ? maxOrderUnit.order + 1 : 1
    }
    
    const validated = UnitSchema.parse({ ...body, order })

    const unit = await prisma.unit.create({
      data: {
        ...validated,
        courseId: id,
      },
      include: {
        lessons: true,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating unit:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al crear unidad" },
      { status: 500 }
    )
  }
}
