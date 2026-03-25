import { CollaboratorStatus, CourseStatus, ProgressStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

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

function buildCriticalCollaboratorRows(
  rows: Array<{
    collaboratorId: string
    collaborator: {
      user: { name: string | null; email: string | null } | null
      area: { name: string } | null
    }
  }>
) {
  const counts = new Map<
    string,
    { name: string; email: string; area: string; alertsCount: number }
  >()

  for (const row of rows) {
    const current = counts.get(row.collaboratorId)
    if (current) {
      current.alertsCount += 1
      continue
    }

    counts.set(row.collaboratorId, {
      name: row.collaborator.user?.name || "Desconocido",
      email: row.collaborator.user?.email || "",
      area: row.collaborator.area?.name || "Sin area",
      alertsCount: 1,
    })
  }

  return Array.from(counts.values())
    .sort((a, b) => b.alertsCount - a.alertsCount)
    .slice(0, 5)
}

export async function getAdminDashboardKPIs(): Promise<AdminDashboardKPIs> {
  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(now.getDate() + 7)
    const thirtyDaysFromNow = new Date(now)
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    const collaborators = await prisma.collaborator.findMany({
      select: {
        id: true,
        status: true,
        user: { select: { id: true, name: true, email: true } },
        area: { select: { name: true } },
      },
    })

    const totalCollaborators = collaborators.length
    const activeCollaborators = collaborators.filter(
      (collaborator) => collaborator.status === CollaboratorStatus.ACTIVE
    ).length

    const totalActiveCourses = await prisma.course.count({
      where: { status: CourseStatus.PUBLISHED },
    })

    const totalEnrollments = await prisma.enrollment.count({
      where: { status: "ACTIVE" },
    })

    const completedEnrollments = await prisma.courseProgress.count({
      where: {
        status: { in: [ProgressStatus.PASSED, ProgressStatus.EXEMPTED] },
      },
    })

    const overallCompliancePercent =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0

    const [criticalCourseProgress, criticalCertifications] = await Promise.all([
      prisma.courseProgress.findMany({
        where: {
          collaborator: { status: CollaboratorStatus.ACTIVE },
          OR: [
            { status: ProgressStatus.EXPIRED },
            {
              status: {
                in: [
                  ProgressStatus.IN_PROGRESS,
                  ProgressStatus.PASSED,
                  ProgressStatus.EXEMPTED,
                ],
              },
              expiresAt: { lt: now },
            },
            {
              status: {
                in: [
                  ProgressStatus.IN_PROGRESS,
                  ProgressStatus.PASSED,
                  ProgressStatus.EXEMPTED,
                ],
              },
              expiresAt: { gte: now, lte: sevenDaysFromNow },
            },
          ],
        },
        select: {
          collaboratorId: true,
          collaborator: {
            select: {
              user: { select: { name: true, email: true } },
              area: { select: { name: true } },
            },
          },
        },
      }),
      prisma.certificationRecord.findMany({
        where: {
          collaborator: { status: CollaboratorStatus.ACTIVE },
          OR: [
            { revokedAt: { not: null } },
            { isValid: false },
            { expiresAt: { lt: now } },
            { expiresAt: { gte: now, lte: thirtyDaysFromNow } },
          ],
        },
        select: {
          collaboratorId: true,
          collaborator: {
            select: {
              user: { select: { name: true, email: true } },
              area: { select: { name: true } },
            },
          },
        },
      }),
    ])

    const criticalAlertsCount =
      criticalCourseProgress.length + criticalCertifications.length

    const pendingEnrollments = await prisma.enrollment.count({
      where: { status: "PENDING" },
    })

    const areas = await prisma.area.findMany({
      select: { id: true, name: true },
    })

    const complianceByArea = await Promise.all(
      areas.map(async (area) => {
        const areaCollaborators = await prisma.collaborator.count({
          where: { areaId: area.id },
        })
        const areaCompletedCourses = await prisma.courseProgress.count({
          where: {
            collaborator: { areaId: area.id },
            status: { in: [ProgressStatus.PASSED, ProgressStatus.EXEMPTED] },
          },
        })
        const areaTrackedCourses = await prisma.courseProgress.count({
          where: {
            collaborator: { areaId: area.id },
            status: {
              in: [
                ProgressStatus.IN_PROGRESS,
                ProgressStatus.PASSED,
                ProgressStatus.EXEMPTED,
                ProgressStatus.EXPIRED,
              ],
            },
          },
        })

        return {
          area: area.name,
          compliance:
            areaTrackedCourses > 0
              ? Math.round((areaCompletedCourses / areaTrackedCourses) * 100)
              : 0,
          collaborators: areaCollaborators,
        }
      })
    )

    const enrollmentsTrend = await Promise.all(
      Array.from({ length: 6 }).map(async (_, index) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - index) + 1, 1)

        const count = await prisma.enrollment.count({
          where: {
            enrolledAt: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        })

        return {
          month: monthStart.toLocaleDateString("es-ES", { month: "short" }),
          enrollments: count,
        }
      })
    )

    const [draftCourses, publishedCourses, archivedCourses] = await Promise.all([
      prisma.course.count({ where: { status: CourseStatus.DRAFT } }),
      prisma.course.count({ where: { status: CourseStatus.PUBLISHED } }),
      prisma.course.count({ where: { status: CourseStatus.ARCHIVED } }),
    ])

    const courseStatusDistribution = [
      { status: "Borrador", count: draftCourses },
      { status: "Publicado", count: publishedCourses },
      { status: "Archivado", count: archivedCourses },
    ]

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
      topAreasCompliance: [...complianceByArea]
        .sort((a, b) => b.compliance - a.compliance)
        .slice(0, 5),
      criticalCollaborators: buildCriticalCollaboratorRows([
        ...criticalCourseProgress,
        ...criticalCertifications,
      ]),
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
