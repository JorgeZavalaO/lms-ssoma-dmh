import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ManualEnrollmentSchema } from "@/validations/enrollment"

// GET - Obtener todas las inscripciones (con filtros opcionales)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const collaboratorId = searchParams.get("collaboratorId")
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {}
    
    // Si es COLLABORATOR, solo puede ver sus propias inscripciones
    if (session.user.role === "COLLABORATOR") {
      if (!session.user.collaboratorId) {
        return NextResponse.json({ error: "Usuario sin colaborador asociado" }, { status: 400 })
      }
      where.collaboratorId = session.user.collaboratorId
    } else {
      // ADMIN/SUPERADMIN pueden filtrar por colaborador específico
      if (collaboratorId) where.collaboratorId = collaboratorId
    }
    
    if (courseId) where.courseId = courseId
    if (status) where.status = status
    if (type) where.type = type

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            duration: true,
            modality: true,
            status: true,
            validity: true,
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
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("Error fetching enrollments:", error)
    return NextResponse.json(
      { error: "Error al obtener inscripciones" },
      { status: 500 }
    )
  }
}

// POST - Inscripción manual (individual o masiva)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const validated = ManualEnrollmentSchema.parse(body)

    // Verificar que el curso existe
    const course = await prisma.course.findUnique({
      where: { id: validated.courseId },
    })

    if (!course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    // Crear inscripciones para cada colaborador
    const enrollments = await prisma.$transaction(
      validated.collaboratorIds.map((collaboratorId) =>
        prisma.enrollment.upsert({
          where: {
            courseId_collaboratorId: {
              courseId: validated.courseId,
              collaboratorId,
            },
          },
          update: {
            status: "ACTIVE",
            notes: validated.notes,
          },
          create: {
            courseId: validated.courseId,
            collaboratorId,
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
        message: `${enrollments.length} inscripciones creadas exitosamente`,
        enrollments,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Error creating enrollments:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al crear inscripciones" },
      { status: 500 }
    )
  }
}
