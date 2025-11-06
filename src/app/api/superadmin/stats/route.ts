import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/superadmin/stats
 * Obtiene estadísticas completas del sistema
 * Solo accesible para SUPERADMIN
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No autorizado - Solo SUPERADMIN' },
        { status: 403 }
      )
    }

    // Obtener estadísticas en paralelo
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
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SUPERADMIN' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'COLLABORATOR' } }),
      prisma.course.count(),
      prisma.learningPath.count(),
      prisma.question.count(),
      prisma.quiz.count(),
      prisma.enrollment.count(),
      prisma.certificationRecord.count(),
      prisma.courseProgress.count({ where: { status: 'PASSED' } }),
    ])

    // Calcular tamaño aproximado de la base de datos
    // Nota: Esto es una aproximación. En producción, usarías queries específicas de PostgreSQL
    const totalRecords = 
      totalUsers +
      courses +
      learningPaths +
      questions +
      quizzes +
      enrollments +
      certifications

    const stats = {
      database: {
        size: `${(totalRecords * 2).toFixed(2)} KB`, // Aproximación
        tables: 25, // Número aproximado de tablas en tu schema
        records: totalRecords,
      },
      users: {
        total: totalUsers,
        superadmins,
        admins,
        collaborators,
        active: totalUsers, // Puedes agregar lógica para usuarios activos
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
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error obteniendo estadísticas del sistema:', error)
    const message = error instanceof Error ? error.message : 'Error al obtener estadísticas'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
