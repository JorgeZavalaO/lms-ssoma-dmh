import { prisma } from "@/lib/prisma"
import { addDays, startOfDay, endOfDay, subDays } from "date-fns"

// ====================================
// J1 - Dashboard Ejecutivo con KPIs
// ====================================

export interface DashboardKPIs {
  // KPIs globales
  totalCollaborators: number
  totalCourses: number
  totalEnrollments: number
  
  // Cumplimiento
  overallCompliance: number // %
  complianceByArea: Record<string, number>
  
  // Alertas
  expiringIn7Days: number
  expiringIn30Days: number
  expired: number
  
  // Evaluaciones
  avgAttempts: number
  avgScore: number
  passRate: number
  
  // Engagement
  activeUsers: number
  coursesInProgress: number
  coursesCompleted: number
  
  // Tendencias (últimos 30 días)
  enrollmentsTrend: Array<{ date: string; count: number }>
  completionsTrend: Array<{ date: string; count: number }>
  
  // Top cursos
  topCriticalCourses: Array<{
    courseId: string
    courseName: string
    expiringCount: number
    expiredCount: number
  }>
}

export async function getDashboardKPIs(filters?: {
  startDate?: Date
  endDate?: Date
  areaId?: string
  siteId?: string
}): Promise<DashboardKPIs> {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const sevenDaysFromNow = addDays(now, 7)
  const thirtyDaysFromNow = addDays(now, 30)

  // Filtros de colaboradores
  const collaboratorWhere = {
    status: "ACTIVE" as const,
    ...(filters?.areaId && { areaId: filters.areaId }),
    ...(filters?.siteId && { siteId: filters.siteId }),
  }

  // 1. KPIs globales
  const totalCollaborators = await prisma.collaborator.count({
    where: collaboratorWhere,
  })

  const totalCourses = await prisma.course.count({
    where: { status: "PUBLISHED" },
  })

  const totalEnrollments = await prisma.enrollment.count({
    where: {
      collaborator: collaboratorWhere,
      ...(filters?.startDate && { enrolledAt: { gte: filters.startDate } }),
      ...(filters?.endDate && { enrolledAt: { lte: filters.endDate } }),
    },
  })

  // 2. Cumplimiento
  const progressRecords = await prisma.courseProgress.findMany({
    where: {
      enrollment: {
        collaborator: collaboratorWhere,
      },
      expiresAt: { not: null },
    },
    include: {
      enrollment: {
        include: {
          collaborator: {
            include: {
              area: true,
            },
          },
        },
      },
    },
  })

  const compliantCount = progressRecords.filter(
    (p) => p.status === "PASSED" && (!p.expiresAt || p.expiresAt > now)
  ).length

  const overallCompliance =
    progressRecords.length > 0
      ? (compliantCount / progressRecords.length) * 100
      : 0

  // Cumplimiento por área
  const complianceByArea: Record<string, number> = {}
  const progressByArea = progressRecords.reduce(
    (acc, p) => {
      if (!p.enrollment) return acc
      const areaName = p.enrollment.collaborator.area?.name || "Sin área"
      if (!acc[areaName]) {
        acc[areaName] = { total: 0, compliant: 0 }
      }
      acc[areaName].total++
      if (p.status === "PASSED" && (!p.expiresAt || p.expiresAt > now)) {
        acc[areaName].compliant++
      }
      return acc
    },
    {} as Record<string, { total: number; compliant: 0 }>
  )

  Object.entries(progressByArea).forEach(([area, data]) => {
    complianceByArea[area] = (data.compliant / data.total) * 100
  })

  // 3. Alertas de vencimiento
  const expiringIn7Days = await prisma.courseProgress.count({
    where: {
      enrollment: { collaborator: collaboratorWhere },
      status: { in: ["IN_PROGRESS", "PASSED"] },
      expiresAt: { gte: now, lte: sevenDaysFromNow },
    },
  })

  const expiringIn30Days = await prisma.courseProgress.count({
    where: {
      enrollment: { collaborator: collaboratorWhere },
      status: { in: ["IN_PROGRESS", "PASSED"] },
      expiresAt: { gte: sevenDaysFromNow, lte: thirtyDaysFromNow },
    },
  })

  const expired = await prisma.courseProgress.count({
    where: {
      enrollment: { collaborator: collaboratorWhere },
      status: "EXPIRED",
    },
  })

  // 4. Evaluaciones  
  // Primero obtengo los IDs de colaboradores que cumplen con los filtros
  const collaborators = await prisma.collaborator.findMany({
    where: collaboratorWhere,
    select: { id: true },
  })
  const collaboratorIds = collaborators.map((c) => c.id)

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      collaboratorId: { in: collaboratorIds },
      status: { in: ["GRADED", "PASSED", "FAILED"] },
      ...(filters?.startDate && { submittedAt: { gte: filters.startDate } }),
      ...(filters?.endDate && { submittedAt: { lte: filters.endDate } }),
    },
    select: {
      score: true,
      status: true,
    },
  })

  const avgAttempts = attempts.length / (totalCollaborators || 1)
  const avgScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
      : 0
  const passedCount = attempts.filter((a) => a.status === "PASSED").length
  const passRate =
    attempts.length > 0 ? (passedCount / attempts.length) * 100 : 0

  // 5. Engagement
  const activeUsers = await prisma.collaborator.count({
    where: {
      ...collaboratorWhere,
      courseProgress: {
        some: {
          lastActivityAt: { gte: thirtyDaysAgo },
        },
      },
    },
  })

  const coursesInProgress = await prisma.courseProgress.count({
    where: {
      enrollment: { collaborator: collaboratorWhere },
      status: "IN_PROGRESS",
    },
  })

  const coursesCompleted = await prisma.courseProgress.count({
    where: {
      enrollment: { collaborator: collaboratorWhere },
      status: "PASSED",
      ...(filters?.startDate && { passedAt: { gte: filters.startDate } }),
      ...(filters?.endDate && { passedAt: { lte: filters.endDate } }),
    },
  })

  // 6. Tendencias (últimos 30 días)
  const recentEnrollments = await prisma.enrollment.findMany({
    where: {
      collaborator: collaboratorWhere,
      enrolledAt: { gte: thirtyDaysAgo },
    },
    select: {
      enrolledAt: true,
    },
  })

  const recentCompletions = await prisma.courseProgress.findMany({
    where: {
      enrollment: { collaborator: collaboratorWhere },
      status: "PASSED",
      passedAt: { gte: thirtyDaysAgo, not: null },
    },
    select: {
      passedAt: true,
    },
  })

  // Agrupar por fecha en memoria
  const enrollmentsByDate = recentEnrollments.reduce(
    (acc, e) => {
      const date = e.enrolledAt.toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const completionsByDate = recentCompletions.reduce(
    (acc, c) => {
      if (c.passedAt) {
        const date = c.passedAt.toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>
  )

  const enrollmentsTrend = Object.entries(enrollmentsByDate).map(
    ([date, count]) => ({ date, count })
  )

  const completionsTrend = Object.entries(completionsByDate).map(
    ([date, count]) => ({ date, count })
  )

  // 7. Top cursos críticos (cursos con validez/vigencia)
  const topCriticalCourses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      validity: { not: null },
    },
    select: {
      id: true,
      name: true,
      enrollments: {
        where: {
          collaborator: collaboratorWhere,
        },
        select: {
          id: true,
        },
      },
    },
    take: 10, // Traigo 10 para luego ordenar y tomar 5
  })

  // Ahora obtengo el progreso para cada curso
  const criticalCoursesData = await Promise.all(
    topCriticalCourses.map(async (course) => {
      const progressRecords = await prisma.courseProgress.findMany({
        where: {
          enrollment: {
            courseId: course.id,
            collaborator: collaboratorWhere,
          },
        },
        select: {
          status: true,
          expiresAt: true,
        },
      })

      const expiringCount = progressRecords.filter(
        (p) =>
          p.expiresAt &&
          p.expiresAt > now &&
          p.expiresAt <= thirtyDaysFromNow
      ).length

      const expiredCount = progressRecords.filter(
        (p) => p.status === "EXPIRED"
      ).length

      return {
        courseId: course.id,
        courseName: course.name,
        totalEnrollments: course.enrollments.length,
        expiringCount,
        expiredCount,
        criticalScore: expiredCount * 2 + expiringCount,
      }
    })
  )

  // Ordenar por criticidad y tomar top 5
  const sortedCriticalCourses = criticalCoursesData
    .sort((a, b) => b.criticalScore - a.criticalScore)
    .slice(0, 5)

  return {
    totalCollaborators,
    totalCourses,
    totalEnrollments,
    overallCompliance,
    complianceByArea,
    expiringIn7Days,
    expiringIn30Days,
    expired,
    avgAttempts,
    avgScore,
    passRate,
    activeUsers,
    coursesInProgress,
    coursesCompleted,
    enrollmentsTrend,
    completionsTrend,
    topCriticalCourses: sortedCriticalCourses,
  }
}

// ====================================
// J2 - Reporte por Área
// ====================================

export interface AreaReportRecord {
  collaboratorId: string
  dni: string
  fullName: string
  email: string
  site: string | null
  area: string | null
  position: string | null
  courseId: string
  courseName: string
  status: string
  progress: number
  startedAt: Date | null
  completedAt: Date | null
  expiresAt: Date | null
  score: number | null
}

export async function getAreaReport(filters: {
  areaId?: string
  siteId?: string
  positionId?: string
  status?: string
  startDate?: string
  endDate?: string
  courseId?: string
}): Promise<AreaReportRecord[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: {
        not: null,
      },
      ...(filters.courseId && { courseId: filters.courseId }),
      collaborator: {
        status: "ACTIVE",
        ...(filters.areaId && { areaId: filters.areaId }),
        ...(filters.siteId && { siteId: filters.siteId }),
        ...(filters.positionId && { positionId: filters.positionId }),
      },
      ...(filters.startDate && {
        enrolledAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && {
        enrolledAt: { lte: new Date(filters.endDate) },
      }),
    },
    include: {
      collaborator: {
        include: {
          site: true,
          area: true,
          position: true,
        },
      },
      course: true,
    },
  })

  // Obtener progress por cada enrollment
  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await prisma.courseProgress.findFirst({
        where: { enrollmentId: enrollment.id },
        select: {
          status: true,
          progressPercent: true,
          startedAt: true,
          completedAt: true,
          expiresAt: true,
        },
      });

      return {
        collaboratorId: enrollment.collaborator.id,
        dni: enrollment.collaborator.dni,
        fullName: enrollment.collaborator.fullName,
        email: enrollment.collaborator.email,
        site: enrollment.collaborator.site?.name || null,
        area: enrollment.collaborator.area?.name || null,
        position: enrollment.collaborator.position?.name || null,
        courseId: enrollment.course!.id,
        courseName: enrollment.course!.name,
        status: progress?.status || "NOT_STARTED",
        progress: progress?.progressPercent || 0,
        startedAt: progress?.startedAt || null,
        completedAt: progress?.completedAt || null,
        expiresAt: progress?.expiresAt || null,
        score: null, // No disponible en el modelo actual
      }
    })
  )

  return enrollmentsWithProgress
}

// ====================================
// J3 - Reporte por Curso
// ====================================

export interface CourseReportData {
  course: {
    id: string
    name: string
    code: string
    activeVersion: number | null
  }
  statistics: {
    totalEnrolled: number
    avgProgress: number
    completionRate: number
    passRate: number
    avgScore: number
    avgTime: number // minutos
  }
  scoreDistribution: Array<{
    range: string // "0-20", "21-40", etc.
    count: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
  }>
}

export async function getCourseReport(filters: {
  courseId: string
  versionId?: string
  startDate?: string
  endDate?: string
}): Promise<CourseReportData> {
  const course = await prisma.course.findUnique({
    where: { id: filters.courseId },
  })

  if (!course) {
    throw new Error("Curso no encontrado")
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: filters.courseId,
      ...(filters.startDate && {
        enrolledAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && {
        enrolledAt: { lte: new Date(filters.endDate) },
      }),
    },
  })

  const totalEnrolled = enrollments.length
  
  // Obtener progreso para cada enrollment
  const progressRecords = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await prisma.courseProgress.findFirst({
        where: { enrollmentId: enrollment.id },
      });
      return progress;
    })
  );
  
  const validProgressRecords = progressRecords.filter((p) => p !== null);

  const avgProgress =
    validProgressRecords.length > 0
      ? validProgressRecords.reduce(
          (sum, p) => sum + (p?.progressPercent || 0),
          0
        ) / validProgressRecords.length
      : 0

  const completedCount = validProgressRecords.filter(
    (p) => p?.status === "PASSED"
  ).length
  const completionRate =
    totalEnrolled > 0 ? (completedCount / totalEnrolled) * 100 : 0

  // Note: No tenemos lastScore en CourseProgress, usaremos datos de completados como proxy
  const passRate =
    totalEnrolled > 0
      ? (completedCount / totalEnrolled) * 100
      : 0

  const avgScore = 0 // No disponible sin campo lastScore

  const avgTime =
    validProgressRecords.length > 0
      ? validProgressRecords.reduce((sum, p) => sum + (p?.timeSpent || 0), 0) /
        validProgressRecords.length
      : 0

  // Distribución de calificaciones (simplificada sin lastScore)
  const scoreRanges = ["0-20", "21-40", "41-60", "61-80", "81-100"]
  const scoreDistribution = scoreRanges.map((range) => {
    return { range, count: 0 } // No disponible sin lastScore
  })

  // Distribución de estados
  const statusCounts = validProgressRecords.reduce(
    (acc, p) => {
      const status = p?.status || "NOT_STARTED"
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const statusDistribution = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
    })
  )

  return {
    course: {
      id: course.id,
      name: course.name,
      code: course.code || "Sin código",
      activeVersion: course.currentVersion || null,
    },
    statistics: {
      totalEnrolled,
      avgProgress,
      completionRate,
      passRate,
      avgScore,
      avgTime,
    },
    scoreDistribution,
    statusDistribution,
  }
}

// ====================================
// J4 - Reporte de Cumplimiento SSOMA
// ====================================

export interface ComplianceMatrixRecord {
  collaboratorId: string
  fullName: string
  position: string | null
  area: string | null
  courses: Array<{
    courseId: string
    courseName: string
    isRequired: boolean
    status: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED" | "NOT_ENROLLED"
    expiresAt: Date | null
    daysUntilExpiration: number | null
  }>
}

export async function getComplianceReport(filters: {
  areaId?: string
  siteId?: string
  positionId?: string
  criticalOnly?: boolean
}): Promise<ComplianceMatrixRecord[]> {
  const now = new Date()

  // Obtener colaboradores activos
  const collaborators = await prisma.collaborator.findMany({
    where: {
      status: "ACTIVE",
      ...(filters.areaId && { areaId: filters.areaId }),
      ...(filters.siteId && { siteId: filters.siteId }),
      ...(filters.positionId && { positionId: filters.positionId }),
    },
    include: {
      area: true,
      position: true,
      site: true,
      enrollments: {
        include: {
          course: true,
          courseProgress: true,
        },
      },
    },
  })

  // Obtener cursos obligatorios (con validity en meses)
  const requiredCourses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      validity: { not: null },
    },
    select: {
      id: true,
      name: true,
    },
  })

  return collaborators.map((collaborator) => {
    const courses = requiredCourses.map((course) => {
      const enrollment = collaborator.enrollments.find(
        (e) => e.courseId === course.id
      )

      if (!enrollment || !enrollment.courseProgress) {
        return {
          courseId: course.id,
          courseName: course.name,
          isRequired: true,
          status: "NOT_ENROLLED" as const,
          expiresAt: null,
          daysUntilExpiration: null,
        }
      }

      const progress = enrollment.courseProgress
      const expiresAt = progress.expiresAt

      if (!expiresAt) {
        return {
          courseId: course.id,
          courseName: course.name,
          isRequired: true,
          status: "NOT_ENROLLED" as const,
          expiresAt: null,
          daysUntilExpiration: null,
        }
      }

      const daysUntilExpiration = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      let status: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED"
      if (daysUntilExpiration < 0) {
        status = "EXPIRED"
      } else if (daysUntilExpiration <= 30) {
        status = "EXPIRING_SOON"
      } else {
        status = "COMPLIANT"
      }

      return {
        courseId: course.id,
        courseName: course.name,
        isRequired: true,
        status,
        expiresAt,
        daysUntilExpiration,
      }
    })

    return {
      collaboratorId: collaborator.id,
      fullName: collaborator.fullName,
      position: collaborator.position?.name || null,
      area: collaborator.area?.name || null,
      courses,
    }
  })
}

// ====================================
// J5 - Trazabilidad de Evaluaciones
// ====================================

export interface AuditTrailRecord {
  attemptId: string
  collaboratorId: string
  collaboratorName: string
  collaboratorDNI: string
  courseId: string
  courseName: string
  quizId: string
  quizTitle: string
  startedAt: Date
  submittedAt: Date | null
  timeSpent: number | null // segundos
  score: number | null
  status: string
  attemptNumber: number
}

export async function getAuditTrail(filters: {
  collaboratorId?: string
  courseId?: string
  quizId?: string
  startDate?: string
  endDate?: string
  minScore?: number
  maxScore?: number
  status?: string
}): Promise<AuditTrailRecord[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      ...(filters.collaboratorId && {
        collaboratorId: filters.collaboratorId,
      }),
      ...(filters.quizId && { quizId: filters.quizId }),
      ...(filters.status && { status: filters.status as any }),
      ...(filters.startDate && {
        startedAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && {
        startedAt: { lte: new Date(filters.endDate) },
      }),
      ...(filters.minScore !== undefined && {
        score: { gte: filters.minScore },
      }),
      ...(filters.maxScore !== undefined && {
        score: { lte: filters.maxScore },
      }),
    },
    include: {
      quiz: {
        include: {
          course: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  })

  // Obtener colaboradores para cada intento
  const collaboratorIds = [...new Set(attempts.map((a) => a.collaboratorId))]
  const collaborators = await prisma.collaborator.findMany({
    where: {
      id: { in: collaboratorIds },
    },
    select: {
      id: true,
      fullName: true,
      dni: true,
    },
  })

  const collaboratorMap = new Map(
    collaborators.map((c) => [c.id, c])
  )

  return attempts.map((attempt) => {
    const collaborator = collaboratorMap.get(attempt.collaboratorId)
    return {
      attemptId: attempt.id,
      collaboratorId: attempt.collaboratorId,
      collaboratorName: collaborator?.fullName || "N/A",
      collaboratorDNI: collaborator?.dni || "N/A",
      courseId: attempt.quiz.course?.id || "",
      courseName: attempt.quiz.course?.name || "N/A",
      quizId: attempt.quiz.id,
      quizTitle: attempt.quiz.title,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent,
      score: attempt.score,
      status: attempt.status,
      attemptNumber: attempt.attemptNumber,
    }
  })
}

// ====================================
// Crear Snapshot de KPIs
// ====================================

export async function createKPISnapshot(): Promise<void> {
  const kpis = await getDashboardKPIs()

  await prisma.kPISnapshot.create({
    data: {
      totalCollaborators: kpis.totalCollaborators,
      totalCourses: kpis.totalCourses,
      totalEnrollments: kpis.totalEnrollments,
      overallCompliance: kpis.overallCompliance,
      complianceByArea: kpis.complianceByArea,
      expiringIn7Days: kpis.expiringIn7Days,
      expiringIn30Days: kpis.expiringIn30Days,
      expired: kpis.expired,
      avgAttempts: kpis.avgAttempts,
      avgScore: kpis.avgScore,
      passRate: kpis.passRate,
      activeUsers: kpis.activeUsers,
      coursesInProgress: kpis.coursesInProgress,
      coursesCompleted: kpis.coursesCompleted,
    },
  })
}
