import { prisma } from "@/lib/prisma"
import { ProgressStatus } from "@prisma/client"

export interface DashboardKPIs {
  completed: number
  inProgress: number
  dueSoon: number
  alerts: number
  progressPercent: number
  nextCourses: {
    course: string
    dueDate: string
    severity: "info" | "warning" | "critical"
  }[]
}

/**
 * Obtiene los KPIs del dashboard para un colaborador
 */
export async function getDashboardKPIs(collaboratorId: string): Promise<DashboardKPIs> {
  try {
    // Obtener progreso de cursos del colaborador
    const courseProgress = await prisma.courseProgress.findMany({
      where: { collaboratorId },
      include: {
        course: { select: { name: true } },
      },
    })

    // Contar por estado
    const completed = courseProgress.filter((cp) => cp.status === ProgressStatus.PASSED).length
    const inProgress = courseProgress.filter((cp) => cp.status === ProgressStatus.IN_PROGRESS).length

    // Cursos próximos a vencer (próximos 30 días)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const dueSoon = courseProgress.filter(
      (cp) => cp.expiresAt && cp.expiresAt > now && cp.expiresAt <= thirtyDaysFromNow
    ).length

    // Obtener alertas activas no leídas
    const alerts = await prisma.progressAlert.findMany({
      where: {
        collaboratorId,
        isRead: false,
        isDismissed: false,
      },
    })

    // Calcular progreso global
    const total = courseProgress.length
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

    // Próximos cursos por vencer (top 3)
    const nextCourses = courseProgress
      .filter((cp) => cp.expiresAt && cp.expiresAt > now)
      .sort((a, b) => (a.expiresAt?.getTime() || 0) - (b.expiresAt?.getTime() || 0))
      .slice(0, 3)
      .map((cp) => {
        const daysUntilExpiry = Math.ceil(
          (cp.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        let severity: "info" | "warning" | "critical" = "info"
        if (daysUntilExpiry <= 7) severity = "critical"
        else if (daysUntilExpiry <= 15) severity = "warning"

        return {
          course: cp.course.name,
          dueDate: `en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? "s" : ""}`,
          severity,
        }
      })

    return {
      completed,
      inProgress,
      dueSoon,
      alerts: alerts.length,
      progressPercent,
      nextCourses,
    }
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    // Retornar valores por defecto en caso de error
    return {
      completed: 0,
      inProgress: 0,
      dueSoon: 0,
      alerts: 0,
      progressPercent: 0,
      nextCourses: [],
    }
  }
}
