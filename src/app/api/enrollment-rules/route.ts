import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { EnrollmentRuleSchema, UpdateEnrollmentRuleSchema } from "@/validations/enrollment"

// GET - Obtener todas las reglas de inscripción
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const isActive = searchParams.get("isActive")

    const where: Record<string, unknown> = {}
    if (courseId) where.courseId = courseId
    if (isActive !== null) where.isActive = isActive === "true"

    const rules = await prisma.enrollmentRule.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error("Error fetching enrollment rules:", error)
    return NextResponse.json(
      { error: "Error al obtener reglas de inscripción" },
      { status: 500 }
    )
  }
}

// POST - Crear una regla de inscripción automática
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const validated = EnrollmentRuleSchema.parse(body)

    // Verificar si ya existe una regla con los mismos criterios
    const existing = await prisma.enrollmentRule.findFirst({
      where: {
        courseId: validated.courseId,
        siteId: validated.siteId,
        areaId: validated.areaId,
        positionId: validated.positionId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una regla con estos criterios" },
        { status: 400 }
      )
    }

    const rule = await prisma.enrollmentRule.create({
      data: {
        ...validated,
        createdBy: session.user.id || "",
      },
    })

    // Aplicar la regla a colaboradores existentes
    await applyEnrollmentRule(rule.id)

    return NextResponse.json(rule, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating enrollment rule:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al crear regla de inscripción" },
      { status: 500 }
    )
  }
}

// Función auxiliar para aplicar regla de inscripción
async function applyEnrollmentRule(ruleId: string) {
  const rule = await prisma.enrollmentRule.findUnique({
    where: { id: ruleId },
  })

  if (!rule || !rule.isActive) return

  // Construir filtros para colaboradores
  const where: Record<string, unknown> = {
    status: "ACTIVE",
  }

  if (rule.siteId) where.siteId = rule.siteId
  if (rule.areaId) where.areaId = rule.areaId
  if (rule.positionId) where.positionId = rule.positionId

  // Obtener colaboradores que cumplen los criterios
  const collaborators = await prisma.collaborator.findMany({
    where,
    select: { id: true },
  })

  // Crear inscripciones automáticas
  const enrollments = await prisma.$transaction(
    collaborators.map((collaborator) =>
      prisma.enrollment.upsert({
        where: {
          courseId_collaboratorId: {
            courseId: rule.courseId,
            collaboratorId: collaborator.id,
          },
        },
        update: {},
        create: {
          courseId: rule.courseId,
          collaboratorId: collaborator.id,
          type: "AUTOMATIC",
          status: "ACTIVE",
          ruleId: rule.id,
        },
      })
    )
  )

  return enrollments
}
