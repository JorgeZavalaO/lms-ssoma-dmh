import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getDestructiveMaintenanceStatus } from "@/lib/operational-safety"

function formatBytes(sizeInBytes: bigint | number | null) {
  if (sizeInBytes === null) return null

  const size = typeof sizeInBytes === "bigint" ? Number(sizeInBytes) : sizeInBytes
  if (!Number.isFinite(size) || size < 0) return null

  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = size
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

/**
 * GET /api/superadmin/stats
 * Obtiene estadisticas completas del sistema
 * Solo accesible para SUPERADMIN
 */
export async function GET(req: NextRequest) {
  try {
    void req
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No autorizado - Solo SUPERADMIN" },
        { status: 403 }
      )
    }

    const [
      totalUsers,
      superadmins,
      admins,
      collaborators,
      courses,
      learningPaths,
      questions,
      quizzes,
      enrollments,
      certifications,
      completedCourses,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "SUPERADMIN" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "COLLABORATOR" } }),
      prisma.course.count(),
      prisma.learningPath.count(),
      prisma.question.count(),
      prisma.quiz.count(),
      prisma.enrollment.count(),
      prisma.certificationRecord.count(),
      prisma.courseProgress.count({ where: { status: "PASSED" } }),
      prisma.session
        .groupBy({
          by: ["userId"],
          where: {
            expires: {
              gt: new Date(),
            },
          },
        })
        .then((rows) => rows.length),
    ])

    const totalRecords =
      totalUsers +
      courses +
      learningPaths +
      questions +
      quizzes +
      enrollments +
      certifications

    let databaseSizeBytes: bigint | null = null
    let publicTables: number | null = null

    try {
      const dbMetrics = await prisma.$queryRaw<
        Array<{ database_size: bigint; public_tables: bigint }>
      >`
        SELECT
          pg_database_size(current_database())::bigint AS database_size,
          (
            SELECT COUNT(*)::bigint
            FROM information_schema.tables
            WHERE table_schema = 'public'
          ) AS public_tables
      `

      databaseSizeBytes = dbMetrics[0]?.database_size ?? null
      publicTables = dbMetrics[0]?.public_tables
        ? Number(dbMetrics[0].public_tables)
        : null
    } catch (metricsError) {
      console.warn(
        "No se pudo obtener metadata real de PostgreSQL para superadmin stats:",
        metricsError
      )
    }

    const stats = {
      database: {
        size: formatBytes(databaseSizeBytes),
        tables: publicTables,
        records: totalRecords,
      },
      users: {
        total: totalUsers,
        superadmins,
        admins,
        collaborators,
        active: activeUsers,
      },
      content: {
        courses,
        learningPaths,
        questions,
        quizzes,
      },
      progress: {
        enrollments,
        certifications,
        completedCourses,
      },
      maintenance: getDestructiveMaintenanceStatus(),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error obteniendo estadisticas del sistema:", error)
    const message =
      error instanceof Error ? error.message : "Error al obtener estadisticas"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
