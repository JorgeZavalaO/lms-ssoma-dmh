import { prisma } from "./prisma"

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function ruleMatchesCollaborator(
  rule: { siteId: string | null; areaId: string | null; positionId: string | null },
  collaborator: { siteId: string | null; areaId: string | null; positionId: string | null }
) {
  return (
    (!rule.siteId || rule.siteId === collaborator.siteId) &&
    (!rule.areaId || rule.areaId === collaborator.areaId) &&
    (!rule.positionId || rule.positionId === collaborator.positionId)
  )
}

// ---------------------------------------------------------------------------
// applyAutoEnrollmentRules
// Se ejecuta cuando se crea o actualiza un colaborador.
// Crea inscripciones automáticas + CourseProgress inicial para cada coincidencia.
// ---------------------------------------------------------------------------

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
          { siteId: collaborator.siteId, areaId: null, positionId: null },
          { siteId: null, areaId: collaborator.areaId, positionId: null },
          { siteId: null, areaId: null, positionId: collaborator.positionId },
          { siteId: collaborator.siteId, areaId: collaborator.areaId, positionId: null },
          { siteId: null, areaId: collaborator.areaId, positionId: collaborator.positionId },
          { siteId: collaborator.siteId, areaId: collaborator.areaId, positionId: collaborator.positionId },
        ],
      },
      include: {
        learningPath: {
          include: {
            courses: { select: { courseId: true } },
          },
        },
      },
    })

    if (matchingRules.length === 0) {
      return { success: true, message: "No hay reglas aplicables", enrollments: [] }
    }

    // Transacción interactiva para obtener IDs y crear CourseProgress vinculado
    const createdEnrollments: { id: string }[] = []

    await prisma.$transaction(async (tx) => {
      for (const rule of matchingRules) {
        // --- Regla de curso directo ---
        if (rule.courseId) {
          const enrollment = await tx.enrollment.upsert({
            where: {
              courseId_collaboratorId: {
                courseId: rule.courseId,
                collaboratorId: collaborator.id,
              },
            },
            update: { status: "ACTIVE" },
            create: {
              courseId: rule.courseId,
              collaboratorId: collaborator.id,
              type: "AUTOMATIC",
              status: "ACTIVE",
              ruleId: rule.id,
            },
          })
          createdEnrollments.push(enrollment)

          await tx.courseProgress.upsert({
            where: {
              collaboratorId_courseId: {
                collaboratorId: collaborator.id,
                courseId: rule.courseId,
              },
            },
            update: {},
            create: {
              collaboratorId: collaborator.id,
              courseId: rule.courseId,
              status: "NOT_STARTED",
              enrollmentId: enrollment.id,
            },
          })
        }

        // --- Regla de ruta de aprendizaje ---
        if (rule.learningPathId && rule.learningPath) {
          // Inscripción a la ruta
          const lpEnrollment = await tx.enrollment.upsert({
            where: {
              learningPathId_collaboratorId: {
                learningPathId: rule.learningPathId,
                collaboratorId: collaborator.id,
              },
            },
            update: { status: "ACTIVE" },
            create: {
              learningPathId: rule.learningPathId,
              collaboratorId: collaborator.id,
              type: "AUTOMATIC",
              status: "ACTIVE",
              ruleId: rule.id,
            },
          })
          createdEnrollments.push(lpEnrollment)

          // Inscripción individual a cada curso de la ruta + progreso inicial
          for (const pc of rule.learningPath.courses) {
            const courseEnrollment = await tx.enrollment.upsert({
              where: {
                courseId_collaboratorId: {
                  courseId: pc.courseId,
                  collaboratorId: collaborator.id,
                },
              },
              update: { status: "ACTIVE" },
              create: {
                courseId: pc.courseId,
                collaboratorId: collaborator.id,
                type: "AUTOMATIC",
                status: "ACTIVE",
                ruleId: rule.id,
              },
            })
            createdEnrollments.push(courseEnrollment)

            await tx.courseProgress.upsert({
              where: {
                collaboratorId_courseId: {
                  collaboratorId: collaborator.id,
                  courseId: pc.courseId,
                },
              },
              update: {},
              create: {
                collaboratorId: collaborator.id,
                courseId: pc.courseId,
                status: "NOT_STARTED",
                enrollmentId: courseEnrollment.id,
              },
            })
          }
        }
      }
    })

    return {
      success: true,
      message: `${createdEnrollments.length} inscripciones automáticas aplicadas`,
      enrollments: createdEnrollments,
    }
  } catch (error) {
    console.error("Error applying auto enrollment rules:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// ---------------------------------------------------------------------------
// removeInvalidAutoEnrollments
// Cancela inscripciones automáticas que ya no aplican al perfil del colaborador.
// Cubre tanto inscripciones directas a cursos como inscripciones a rutas de aprendizaje.
// ---------------------------------------------------------------------------

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

    let cancelled = 0

    // --- Inscripciones automáticas a CURSOS ---
    // Verifica que exista al menos una regla vigente (directa o de LP) que justifique cada inscripción.
    const autoCourseEnrollments = await prisma.enrollment.findMany({
      where: {
        collaboratorId: collaborator.id,
        type: "AUTOMATIC",
        status: "ACTIVE",
        courseId: { not: null },
      },
      include: {
        course: {
          include: {
            enrollmentRules: { where: { isActive: true } },
            pathCourses: {
              include: {
                path: {
                  include: {
                    enrollmentRules: { where: { isActive: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    const courseEnrollmentIdsToCancel = autoCourseEnrollments
      .filter((enrollment) => {
        const directRuleApplies = enrollment.course!.enrollmentRules.some((r) =>
          ruleMatchesCollaborator(r, collaborator)
        )
        const lpRuleApplies = enrollment.course!.pathCourses.some((pc) =>
          pc.path.enrollmentRules.some((r) => ruleMatchesCollaborator(r, collaborator))
        )
        return !directRuleApplies && !lpRuleApplies
      })
      .map((e) => e.id)

    if (courseEnrollmentIdsToCancel.length > 0) {
      await prisma.enrollment.updateMany({
        where: { id: { in: courseEnrollmentIdsToCancel } },
        data: { status: "CANCELLED" },
      })
      cancelled += courseEnrollmentIdsToCancel.length
    }

    // --- Inscripciones automáticas a RUTAS DE APRENDIZAJE ---
    const autoLpEnrollments = await prisma.enrollment.findMany({
      where: {
        collaboratorId: collaborator.id,
        type: "AUTOMATIC",
        status: "ACTIVE",
        learningPathId: { not: null },
      },
      include: {
        learningPath: {
          include: {
            enrollmentRules: { where: { isActive: true } },
            courses: { select: { courseId: true } },
          },
        },
      },
    })

    for (const lpEnrollment of autoLpEnrollments) {
      const lp = lpEnrollment.learningPath!
      const stillValid = lp.enrollmentRules.some((r) => ruleMatchesCollaborator(r, collaborator))
      if (!stillValid) {
        const courseIds = lp.courses.map((c) => c.courseId)
        if (courseIds.length > 0) {
          const result = await prisma.enrollment.updateMany({
            where: {
              collaboratorId: collaborator.id,
              type: "AUTOMATIC",
              status: "ACTIVE",
              courseId: { in: courseIds },
              ...(lpEnrollment.ruleId ? { ruleId: lpEnrollment.ruleId } : {}),
            },
            data: { status: "CANCELLED" },
          })
          cancelled += result.count
        }
        await prisma.enrollment.update({
          where: { id: lpEnrollment.id },
          data: { status: "CANCELLED" },
        })
        cancelled += 1
      }
    }

    return {
      success: true,
      message: cancelled > 0 ? `${cancelled} inscripciones canceladas` : "No hay inscripciones para cancelar",
      cancelled,
    }
  } catch (error) {
    console.error("Error removing invalid auto enrollments:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// ---------------------------------------------------------------------------
// applyEnrollmentRule
// Aplica una regla específica a todos los colaboradores que la cumplen.
// Crea inscripciones + CourseProgress inicial.
// Se llama al crear o actualizar una regla.
// ---------------------------------------------------------------------------

export async function applyEnrollmentRule(ruleId: string) {
  const rule = await prisma.enrollmentRule.findUnique({
    where: { id: ruleId },
    include: {
      learningPath: {
        include: {
          courses: { select: { courseId: true } },
        },
      },
    },
  })

  if (!rule || !rule.isActive) return

  const where: Record<string, unknown> = { status: "ACTIVE" }
  if (rule.siteId) where.siteId = rule.siteId
  if (rule.areaId) where.areaId = rule.areaId
  if (rule.positionId) where.positionId = rule.positionId

  const collaborators = await prisma.collaborator.findMany({
    where,
    select: { id: true },
  })

  if (collaborators.length === 0) return

  await prisma.$transaction(async (tx) => {
    for (const collaborator of collaborators) {
      if (rule.learningPathId && rule.learningPath) {
        // Inscripción a la ruta
        await tx.enrollment.upsert({
          where: {
            learningPathId_collaboratorId: {
              learningPathId: rule.learningPathId,
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

        // Inscripción individual a cada curso + progreso inicial
        for (const pc of rule.learningPath.courses) {
          const courseEnrollment = await tx.enrollment.upsert({
            where: {
              courseId_collaboratorId: {
                courseId: pc.courseId,
                collaboratorId: collaborator.id,
              },
            },
            update: {},
            create: {
              courseId: pc.courseId,
              collaboratorId: collaborator.id,
              type: "AUTOMATIC",
              status: "ACTIVE",
              ruleId: rule.id,
            },
          })
          await tx.courseProgress.upsert({
            where: {
              collaboratorId_courseId: {
                collaboratorId: collaborator.id,
                courseId: pc.courseId,
              },
            },
            update: {},
            create: {
              collaboratorId: collaborator.id,
              courseId: pc.courseId,
              status: "NOT_STARTED",
              enrollmentId: courseEnrollment.id,
            },
          })
        }
      } else if (rule.courseId) {
        const enrollment = await tx.enrollment.upsert({
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
        await tx.courseProgress.upsert({
          where: {
            collaboratorId_courseId: {
              collaboratorId: collaborator.id,
              courseId: rule.courseId,
            },
          },
          update: {},
          create: {
            collaboratorId: collaborator.id,
            courseId: rule.courseId,
            status: "NOT_STARTED",
            enrollmentId: enrollment.id,
          },
        })
      }
    }
  })
}
