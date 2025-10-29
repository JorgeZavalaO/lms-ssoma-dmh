import { prisma } from "./prisma"

/**
 * Servicio para aplicar reglas de inscripción automática
 * Se ejecuta cuando se crea o actualiza un colaborador
 */

export async function applyAutoEnrollmentRules(collaboratorId: string) {
  try {
    const collaborator = await prisma.collaborator.findUnique({
      where: { id: collaboratorId },
      select: {
        id: true,
        siteId: true,
        areaId: true,
        positionId: true,
        status: true,
      },
    })

    if (!collaborator || collaborator.status !== "ACTIVE") {
      return { success: false, message: "Colaborador no encontrado o inactivo" }
    }

    // Obtener reglas activas que coincidan con el perfil del colaborador
    const matchingRules = await prisma.enrollmentRule.findMany({
      where: {
        isActive: true,
        OR: [
          // Regla por sede
          {
            siteId: collaborator.siteId,
            areaId: null,
            positionId: null,
          },
          // Regla por área
          {
            siteId: null,
            areaId: collaborator.areaId,
            positionId: null,
          },
          // Regla por puesto
          {
            siteId: null,
            areaId: null,
            positionId: collaborator.positionId,
          },
          // Regla por sede y área
          {
            siteId: collaborator.siteId,
            areaId: collaborator.areaId,
            positionId: null,
          },
          // Regla por área y puesto
          {
            siteId: null,
            areaId: collaborator.areaId,
            positionId: collaborator.positionId,
          },
          // Regla completa (sede, área y puesto)
          {
            siteId: collaborator.siteId,
            areaId: collaborator.areaId,
            positionId: collaborator.positionId,
          },
        ],
      },
    })

    if (matchingRules.length === 0) {
      return { success: true, message: "No hay reglas aplicables", enrollments: [] }
    }

    // Crear inscripciones automáticas para cada regla
    const enrollments = await prisma.$transaction(
      matchingRules.flatMap((rule) => {
        const ops = []
        
        // Si es curso, crear inscripción a curso
        if (rule.courseId) {
          ops.push(
            prisma.enrollment.upsert({
              where: {
                courseId_collaboratorId: {
                  courseId: rule.courseId,
                  collaboratorId: collaborator.id,
                },
              },
              update: {
                // Si ya existe, solo actualizamos si estaba cancelada
                status: "ACTIVE",
              },
              create: {
                courseId: rule.courseId,
                collaboratorId: collaborator.id,
                type: "AUTOMATIC",
                status: "ACTIVE",
                ruleId: rule.id,
              },
            })
          )
        }

        // Si es ruta, crear inscripción a ruta y a cada curso
        if (rule.learningPathId) {
          ops.push(
            prisma.enrollment.upsert({
              where: {
                learningPathId_collaboratorId: {
                  learningPathId: rule.learningPathId,
                  collaboratorId: collaborator.id,
                },
              },
              update: {
                status: "ACTIVE",
              },
              create: {
                learningPathId: rule.learningPathId,
                collaboratorId: collaborator.id,
                type: "AUTOMATIC",
                status: "ACTIVE",
                ruleId: rule.id,
              },
            })
          )
        }

        return ops
      })
    )

    return {
      success: true,
      message: `${enrollments.length} inscripciones automáticas aplicadas`,
      enrollments,
    }
  } catch (error) {
    console.error("Error applying auto enrollment rules:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

/**
 * Eliminar inscripciones automáticas que ya no aplican
 * cuando se actualiza el perfil de un colaborador
 */
export async function removeInvalidAutoEnrollments(collaboratorId: string) {
  try {
    const collaborator = await prisma.collaborator.findUnique({
      where: { id: collaboratorId },
      select: {
        id: true,
        siteId: true,
        areaId: true,
        positionId: true,
      },
    })

    if (!collaborator) {
      return { success: false, message: "Colaborador no encontrado" }
    }

    // Obtener inscripciones automáticas del colaborador (solo las de curso)
    const autoEnrollments = await prisma.enrollment.findMany({
      where: {
        collaboratorId: collaborator.id,
        type: "AUTOMATIC",
        status: "ACTIVE",
        courseId: {
          not: null,
        },
      },
      include: {
        course: {
          include: {
            enrollmentRules: {
              where: { isActive: true },
            },
          },
        },
      },
    })

    // Filtrar inscripciones que ya no aplican
    const toCancel = autoEnrollments.filter((enrollment) => {
      const rule = enrollment.course!.enrollmentRules.find(
        (r) =>
          (!r.siteId || r.siteId === collaborator.siteId) &&
          (!r.areaId || r.areaId === collaborator.areaId) &&
          (!r.positionId || r.positionId === collaborator.positionId)
      )
      return !rule // No hay regla que justifique esta inscripción
    })

    if (toCancel.length === 0) {
      return { success: true, message: "No hay inscripciones para cancelar", cancelled: 0 }
    }

    // Cancelar inscripciones que ya no aplican
    await prisma.enrollment.updateMany({
      where: {
        id: { in: toCancel.map((e) => e.id) },
      },
      data: {
        status: "CANCELLED",
      },
    })

    return {
      success: true,
      message: `${toCancel.length} inscripciones canceladas`,
      cancelled: toCancel.length,
    }
  } catch (error) {
    console.error("Error removing invalid auto enrollments:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
