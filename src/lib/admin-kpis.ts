import { prisma } from "@/lib/prisma"
import { CollaboratorStatus, ProgressStatus, CourseStatus } from "@prisma/client"

export interface AdminDashboardKPIs {
  totalCollaborators: number
  activeCollaborators: number
  totalActiveCourses: number
  overallCompliancePercent: number
  criticalAlertsCount: number
  pendingEnrollmentsCount: number
  complianceByArea: {
    area: string
    compliance: number
    collaborators: number
  }[]
  enrollmentsTrend: {
    month: string
    enrollments: number
  }[]
  courseStatusDistribution: {
    status: string
    count: number
  }[]
  topAreasCompliance: {
    area: string
    compliance: number
  }[]
  criticalCollaborators: {
    name: string
    email: string
    area: string
    alertsCount: number
  }[]
}

/**
 * Obtiene los KPIs del dashboard ejecutivo para administradores
 */
export async function getAdminDashboardKPIs(): Promise<AdminDashboardKPIs> {
  try {
    // Total de colaboradores
    const collaborators = await prisma.collaborator.findMany({
      select: {
        id: true,
        status: true,
        user: { select: { id: true, name: true, email: true } },
        area: { select: { name: true } },
      },
    })

    const totalCollaborators = collaborators.length
    const activeCollaborators = collaborators.filter((c) => c.status === CollaboratorStatus.ACTIVE).length

    // Total de cursos activos
    const activeCourses = await prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      select: { id: true },
    })
    const totalActiveCourses = activeCourses.length

    // Cumplimiento general (porcentaje de cursos completados vs inscritos)
    const totalEnrollments = await prisma.enrollment.count({
      where: { status: "ACTIVE" },
    })
    const completedEnrollments = await prisma.courseProgress.count({
      where: { status: ProgressStatus.PASSED },
    })
    const overallCompliancePercent =
      totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0

    // Alertas críticas sin resolver
    const criticalAlerts = await prisma.progressAlert.findMany({
      where: {
        severity: 3, // critical
        isRead: false,
        isDismissed: false,
      },
      select: { id: true },
    })
    const criticalAlertsCount = criticalAlerts.length

    // Inscripciones pendientes
    const pendingEnrollments = await prisma.enrollment.count({
      where: { status: "PENDING" },
    })

    // Cumplimiento por área
    const complianceByArea = await Promise.all(
      (
        await prisma.area.findMany({
          select: { id: true, name: true },
        })
      ).map(async (area) => {
        const areaCollaborators = await prisma.collaborator.count({
          where: { areaId: area.id },
        })
        const areaCompletedCourses = await prisma.courseProgress.count({
          where: {
            collaborator: { areaId: area.id },
            status: ProgressStatus.PASSED,
          },
        })
        const areaActiveCourses = await prisma.courseProgress.count({
          where: {
            collaborator: { areaId: area.id },
            status: { in: [ProgressStatus.IN_PROGRESS, ProgressStatus.PASSED] },
          },
        })
        const compliance =
          areaActiveCourses > 0 ? Math.round((areaCompletedCourses / areaActiveCourses) * 100) : 0

        return {
          area: area.name,
          compliance,
          collaborators: areaCollaborators,
        }
      })
    )

    // Tendencia de inscripciones (últimos 6 meses)
    const now = new Date()

    const enrollmentsTrend = await Promise.all(
      Array.from({ length: 6 }).map(async (_, i) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
        const count = await prisma.enrollment.count({
          where: {
            enrolledAt: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        })
        const monthName = monthStart.toLocaleDateString("es-ES", { month: "short" })
        return { month: monthName, enrollments: count }
      })
    )

    // Distribución de estados de cursos
    const draftCourses = await prisma.course.count({ where: { status: CourseStatus.DRAFT } })
    const publishedCourses = await prisma.course.count({ where: { status: CourseStatus.PUBLISHED } })
    const archivedCourses = await prisma.course.count({ where: { status: CourseStatus.ARCHIVED } })

    const courseStatusDistribution = [
      { status: "Borrador", count: draftCourses },
      { status: "Publicado", count: publishedCourses },
      { status: "Archivado", count: archivedCourses },
    ]

    // Top 5 áreas por cumplimiento
    const topAreasCompliance = complianceByArea.sort((a, b) => b.compliance - a.compliance).slice(0, 5)

    // Colaboradores críticos (con alertas)
    const criticalCollaborators = await prisma.progressAlert.groupBy({
      by: ["collaboratorId"],
      where: {
        isRead: false,
        isDismissed: false,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    })

    const criticalCollaboratorsDetail = await Promise.all(
      criticalCollaborators.map(async (item) => {
        const collaborator = await prisma.collaborator.findUnique({
          where: { id: item.collaboratorId },
          select: {
            user: { select: { name: true, email: true } },
            area: { select: { name: true } },
          },
        })
        return {
          name: collaborator?.user?.name || "Desconocido",
          email: collaborator?.user?.email || "",
          area: collaborator?.area?.name || "Sin área",
          alertsCount: item._count.id,
        }
      })
    )

    return {
      totalCollaborators,
      activeCollaborators,
      totalActiveCourses,
      overallCompliancePercent,
      criticalAlertsCount,
      pendingEnrollmentsCount: pendingEnrollments,
      complianceByArea,
      enrollmentsTrend,
      courseStatusDistribution,
      topAreasCompliance,
      criticalCollaborators: criticalCollaboratorsDetail,
    }
  } catch (error) {
    console.error("Error fetching admin KPIs:", error)
    return {
      totalCollaborators: 0,
      activeCollaborators: 0,
      totalActiveCourses: 0,
      overallCompliancePercent: 0,
      criticalAlertsCount: 0,
      pendingEnrollmentsCount: 0,
      complianceByArea: [],
      enrollmentsTrend: [],
      courseStatusDistribution: [],
      topAreasCompliance: [],
      criticalCollaborators: [],
    }
  }
}
