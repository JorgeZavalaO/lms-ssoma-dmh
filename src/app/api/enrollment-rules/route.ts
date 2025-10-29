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

    // Verificar que exista el curso o la ruta
    if (validated.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: validated.courseId },
      })
      if (!course) {
        return NextResponse.json(
          { error: "El curso especificado no existe" },
          { status: 400 }
        )
      }
    }

    if (validated.learningPathId) {
      const path = await prisma.learningPath.findUnique({
        where: { id: validated.learningPathId },
      })
      if (!path) {
        return NextResponse.json(
          { error: "La ruta de aprendizaje especificada no existe" },
          { status: 400 }
        )
      }
    }

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
    include: {
      course: {
        include: {
          pathCourses: true,
        },
      },
      learningPath: {
        include: {
          courses: true,
        },
      },
    },
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

  // Si es una ruta, crear inscripciones para la ruta y para cada curso dentro
  if (rule.learningPath && rule.learningPathId) {
    // Crear inscripción a la ruta
    await prisma.$transaction(
      collaborators.map((collaborator) =>
        prisma.enrollment.upsert({
          where: {
            learningPathId_collaboratorId: {
              learningPathId: rule.learningPathId!,
              collaboratorId: collaborator.id,
            },
          },
          update: {},
          create: {
            learningPathId: rule.learningPathId,
            collaboratorId: collaborator.id,
            type: "AUTOMATIC",
            status: "ACTIVE",
            ruleId: rule.id,
          },
        })
      )
    )

    // Crear inscripciones para cada curso en la ruta
    const courseIds = rule.learningPath.courses.map((pc) => pc.courseId)
    
    for (const courseId of courseIds) {
      await prisma.$transaction(
        collaborators.map((collaborator) =>
          prisma.enrollment.upsert({
            where: {
              courseId_collaboratorId: {
                courseId,
                collaboratorId: collaborator.id,
              },
            },
            update: {},
            create: {
              courseId,
              collaboratorId: collaborator.id,
              type: "AUTOMATIC",
              status: "ACTIVE",
              ruleId: rule.id,
            },
          })
        )
      )
    }
  } else if (rule.course && rule.courseId) {
    // Crear inscripción simple al curso
    await prisma.$transaction(
      collaborators.map((collaborator) =>
        prisma.enrollment.upsert({
          where: {
            courseId_collaboratorId: {
              courseId: rule.courseId!,
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
  }
}
