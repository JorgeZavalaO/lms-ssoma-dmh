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

    // Verificar que existe el curso o la ruta
    if (validated.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: validated.courseId },
      })
      if (!course) {
        return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
      }
    }

    if (validated.learningPathId) {
      const path = await prisma.learningPath.findUnique({
        where: { id: validated.learningPathId },
        include: {
          courses: {
            select: {
              courseId: true,
            },
          },
        },
      })
      if (!path) {
        return NextResponse.json({ error: "Ruta no encontrada" }, { status: 404 })
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

      // Crear inscripciones masivas a la ruta y sus cursos
      const enrollments = await prisma.$transaction(
        collaborators.flatMap((collaborator) => {
          const ops = []
          
          // Inscripción a la ruta
          ops.push(
            prisma.enrollment.upsert({
              where: {
                learningPathId_collaboratorId: {
                  learningPathId: validated.learningPathId!,
                  collaboratorId: collaborator.id,
                },
              },
              update: {
                status: "ACTIVE",
                notes: validated.notes,
              },
              create: {
                learningPathId: validated.learningPathId,
                collaboratorId: collaborator.id,
                type: "MANUAL",
                status: "ACTIVE",
                enrolledBy: session.user.id,
                notes: validated.notes,
              },
            })
          )
          
          // Inscripción a cada curso en la ruta
          for (const pc of path.courses) {
            ops.push(
              prisma.enrollment.upsert({
                where: {
                  courseId_collaboratorId: {
                    courseId: pc.courseId,
                    collaboratorId: collaborator.id,
                  },
                },
                update: {
                  status: "ACTIVE",
                  notes: validated.notes,
                },
                create: {
                  courseId: pc.courseId,
                  collaboratorId: collaborator.id,
                  type: "MANUAL",
                  status: "ACTIVE",
                  enrolledBy: session.user.id,
                  notes: validated.notes,
                },
              })
            )
          }
          
          return ops
        })
      )

      return NextResponse.json(
        {
          message: `${collaborators.length} colaboradores inscritos en la ruta exitosamente`,
          enrollments,
        },
        { status: 201 }
      )
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
              courseId: validated.courseId!,
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
