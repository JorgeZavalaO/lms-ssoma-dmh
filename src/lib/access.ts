import { prisma } from "@/lib/prisma"

export type PrereqCheckResult = {
  allowed: boolean
  reason?: "UNMET_PREREQUISITE"
  missing?: {
    courseId: string
    courseName?: string
  }
}

/**
 * Verifica si un colaborador puede acceder a un curso considerando prerequisitos definidos en rutas de aprendizaje
 * Estrategia:
 * - Si el curso no está en ninguna ruta: permitido
 * - Si está en rutas pero el colaborador no está asignado a esas rutas: permitido
 * - Si está en rutas aplicables y alguna no tiene prerequisito o su prerequisito está cumplido: permitido
 * - En caso contrario: bloqueado
 */
export async function checkCoursePrerequisites(
  collaboratorId: string,
  courseId: string
): Promise<PrereqCheckResult> {
  // 1) Cursos en rutas con posible prerequisito
  const lpcs = await prisma.learningPathCourse.findMany({
    where: { courseId },
    select: {
      id: true,
      pathId: true,
      prerequisite: {
        select: {
          courseId: true,
          course: { select: { name: true } },
        },
      },
    },
  })

  if (lpcs.length === 0) return { allowed: true }

  const pathIds = lpcs.map((l) => l.pathId)

  // 2) ¿El colaborador está asignado a alguna de estas rutas?
  const [pathEnrolls, pathProgress] = await Promise.all([
    prisma.enrollment.findMany({
      where: { collaboratorId, learningPathId: { in: pathIds } },
      select: { learningPathId: true },
    }),
    prisma.learningPathProgress.findMany({
      where: { collaboratorId, learningPathId: { in: pathIds } },
      select: { learningPathId: true },
    }),
  ])

  const assignedPathIds = new Set<string>([
    ...pathEnrolls.map((e) => e.learningPathId!).filter(Boolean) as string[],
    ...pathProgress.map((p) => p.learningPathId),
  ])

  const applicable = lpcs.filter((l) => assignedPathIds.has(l.pathId))
  if (applicable.length === 0) return { allowed: true }

  // 3) Cursos prerequisito a validar
  const prereqCourseIds = applicable
    .map((l) => l.prerequisite?.courseId)
    .filter((id): id is string => Boolean(id))

  if (prereqCourseIds.length === 0) return { allowed: true }

  // 4) ¿El colaborador completó/pasó los prerequisitos?
  const [completedEnrollments, passedProgress] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        collaboratorId,
        courseId: { in: prereqCourseIds },
        status: "COMPLETED",
      },
      select: { courseId: true },
    }),
    prisma.courseProgress.findMany({
      where: {
        collaboratorId,
        courseId: { in: prereqCourseIds },
        status: { in: ["PASSED", "EXEMPTED"] },
      },
      select: { courseId: true },
    }),
  ])

  const completedCourseIds = new Set<string>([
    ...completedEnrollments
      .map((e) => e.courseId!)
      .filter((id): id is string => Boolean(id)),
    ...passedProgress.map((p) => p.courseId),
  ])

  // 5) Permitir si al menos una ruta aplicable no requiere prereq o su prereq ya está cumplido
  const anyPathAllows = applicable.some((l) => {
    const prereqId = l.prerequisite?.courseId
    if (!prereqId) return true
    return completedCourseIds.has(prereqId)
  })

  if (anyPathAllows) return { allowed: true }

  // 6) Reportar un prerequisito faltante para feedback (opcional)
  const firstMissing = applicable.find((l) => l.prerequisite?.courseId && !completedCourseIds.has(l.prerequisite.courseId))
  if (firstMissing?.prerequisite?.courseId) {
    return {
      allowed: false,
      reason: "UNMET_PREREQUISITE",
      missing: {
        courseId: firstMissing.prerequisite.courseId,
        courseName: firstMissing.prerequisite.course?.name,
      },
    }
  }

  return { allowed: false, reason: "UNMET_PREREQUISITE" }
}
