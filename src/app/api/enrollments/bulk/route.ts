import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { BulkEnrollmentSchema } from "@/validations/enrollment"

// POST - Inscripción masiva por filtros
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const validated = BulkEnrollmentSchema.parse(body)

    // Construir filtros para colaboradores
    const where: Record<string, unknown> = {
      status: "ACTIVE",
    }

    if (validated.filters.siteIds && validated.filters.siteIds.length > 0) {
      where.siteId = { in: validated.filters.siteIds }
    }

    if (validated.filters.areaIds && validated.filters.areaIds.length > 0) {
      where.areaId = { in: validated.filters.areaIds }
    }

    if (validated.filters.positionIds && validated.filters.positionIds.length > 0) {
      where.positionId = { in: validated.filters.positionIds }
    }

    // Obtener colaboradores que cumplen los filtros
    const collaborators = await prisma.collaborator.findMany({
      where,
      select: { id: true },
    })

    if (collaborators.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron colaboradores con los filtros especificados" },
        { status: 400 }
      )
    }

    // Crear inscripciones masivas
    const enrollments = await prisma.$transaction(
      collaborators.map((collaborator) =>
        prisma.enrollment.upsert({
          where: {
            courseId_collaboratorId: {
              courseId: validated.courseId,
              collaboratorId: collaborator.id,
            },
          },
          update: {
            status: "ACTIVE",
            notes: validated.notes,
          },
          create: {
            courseId: validated.courseId,
            collaboratorId: collaborator.id,
            type: "MANUAL",
            status: "ACTIVE",
            enrolledBy: session.user.id,
            notes: validated.notes,
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: `${enrollments.length} colaboradores inscritos exitosamente`,
        enrollments,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Error creating bulk enrollments:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al crear inscripciones masivas" },
      { status: 500 }
    )
  }
}
