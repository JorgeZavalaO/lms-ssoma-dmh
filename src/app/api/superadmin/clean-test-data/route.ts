import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/superadmin/clean-test-data
 * Elimina todos los datos de prueba del sistema
 * Solo accesible para SUPERADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No autorizado - Solo SUPERADMIN' },
        { status: 403 }
      )
    }

    // Iniciar transacción para asegurar que todo se elimine o nada
    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar intentos de quiz (QuizAttempt)
      const deletedAttempts = await tx.quizAttempt.deleteMany({})

      // 2. Eliminar intentos de actividades interactivas (ActivityAttempt)
      const deletedActivityAttempts = await tx.activityAttempt.deleteMany({})

      // 3. Eliminar progreso de lecciones (LessonProgress)
      const deletedLessonProgress = await tx.lessonProgress.deleteMany({})

      // 4. Eliminar progreso de cursos (CourseProgress)
      const deletedCourseProgress = await tx.courseProgress.deleteMany({})

      // 5. Eliminar progreso de rutas de aprendizaje (LearningPathProgress)
      const deletedPathProgress = await tx.learningPathProgress.deleteMany({})

      // 6. Eliminar certificaciones (CertificationRecord)
      const deletedCertifications = await tx.certificationRecord.deleteMany({})

      // 7. Eliminar alertas de progreso (ProgressAlert)
      const deletedAlerts = await tx.progressAlert.deleteMany({})

      // 8. Eliminar inscripciones (Enrollment)
      const deletedEnrollments = await tx.enrollment.deleteMany({})

      // 9. Eliminar notificaciones (Notification)
      const deletedNotifications = await tx.notification.deleteMany({})

      // 10. Eliminar colaboradores (Collaborator)
      const deletedCollaborators = await tx.collaborator.deleteMany({})

      // 11. Eliminar usuarios COLLABORATOR (User con role COLLABORATOR)
      const deletedUsers = await tx.user.deleteMany({
        where: {
          role: 'COLLABORATOR'
        }
      })

      return {
        deletedAttempts: deletedAttempts.count,
        deletedActivityAttempts: deletedActivityAttempts.count,
        deletedLessonProgress: deletedLessonProgress.count,
        deletedCourseProgress: deletedCourseProgress.count,
        deletedPathProgress: deletedPathProgress.count,
        deletedCertifications: deletedCertifications.count,
        deletedAlerts: deletedAlerts.count,
        deletedEnrollments: deletedEnrollments.count,
        deletedNotifications: deletedNotifications.count,
        deletedCollaborators: deletedCollaborators.count,
        deletedUsers: deletedUsers.count,
      }
    })

    console.log('✓ Datos de prueba eliminados por', session.user.email, result)

    return NextResponse.json({
      success: true,
      message: `Sistema limpiado exitosamente. Se eliminaron: ${result.deletedCollaborators} colaboradores, ${result.deletedUsers} usuarios, ${result.deletedEnrollments} inscripciones, ${result.deletedCertifications} certificaciones, ${result.deletedCourseProgress} registros de progreso de cursos, ${result.deletedPathProgress} registros de rutas, ${result.deletedLessonProgress} registros de lecciones, ${result.deletedAttempts} intentos de quiz, ${result.deletedAlerts} alertas y ${result.deletedNotifications} notificaciones.`,
      deleted: result,
    })
  } catch (error) {
    console.error('Error eliminando datos de prueba:', error)
    const message = error instanceof Error ? error.message : 'Error al limpiar datos de prueba'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
