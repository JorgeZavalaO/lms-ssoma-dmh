import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UpdateEnrollmentSchema } from "@/validations/enrollment"

// GET - Obtener una inscripción específica
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

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            duration: true,
            validity: true,
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
        collaborator: {
          select: {
            id: true,
            dni: true,
            fullName: true,
            email: true,
            area: { select: { name: true } },
            position: { select: { name: true } },
            site: { select: { name: true } },
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 })
    }

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error("Error fetching enrollment:", error)
    return NextResponse.json(
      { error: "Error al obtener inscripción" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una inscripción
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
    const validated = UpdateEnrollmentSchema.parse(body)

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json(enrollment)
  } catch (error: unknown) {
    console.error("Error updating enrollment:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al actualizar inscripción" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una inscripción
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

    await prisma.enrollment.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Inscripción eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting enrollment:", error)
    return NextResponse.json(
      { error: "Error al eliminar inscripción" },
      { status: 500 }
    )
  }
}
