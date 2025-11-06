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
      // FASE 1: Eliminar registros dependientes de colaboradores
      console.log('Fase 1: Eliminando registros de progreso y actividad...')
      
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

      console.log('Fase 2: Eliminando colaboradores y usuarios...')

      // 10. Eliminar colaboradores (Collaborator)
      const deletedCollaborators = await tx.collaborator.deleteMany({})

      // 11. Eliminar usuarios COLLABORATOR (User con role COLLABORATOR)
      const deletedUsers = await tx.user.deleteMany({
        where: {
          role: 'COLLABORATOR'
        }
      })

      // FASE 3: Eliminar estructura organizacional
      console.log('Fase 3: Eliminando estructura organizacional...')

      // 12. Eliminar reglas de inscripción automática (EnrollmentRule)
      const deletedEnrollmentRules = await tx.enrollmentRule.deleteMany({})

      // 13. Eliminar áreas (Area)
      const deletedAreas = await tx.area.deleteMany({})

      // 14. Eliminar puestos (Position)
      const deletedPositions = await tx.position.deleteMany({})

      // 15. Eliminar sedes (Site)
      const deletedSites = await tx.site.deleteMany({})

      // FASE 4: Eliminar contenido de evaluaciones
      console.log('Fase 4: Eliminando evaluaciones y preguntas...')

      // 16. Eliminar relaciones QuizQuestion (tabla intermedia)
      const deletedQuizQuestions = await tx.quizQuestion.deleteMany({})

      // 17. Eliminar quizzes (Quiz)
      const deletedQuizzes = await tx.quiz.deleteMany({})

      // 18. Eliminar opciones de preguntas (QuestionOption)
      const deletedQuestionOptions = await tx.questionOption.deleteMany({})

      // 19. Eliminar preguntas (Question)
      const deletedQuestions = await tx.question.deleteMany({})

      // FASE 5: Eliminar actividades interactivas
      console.log('Fase 5: Eliminando actividades interactivas...')

      // 20. Eliminar actividades interactivas (InteractiveActivity)
      const deletedActivities = await tx.interactiveActivity.deleteMany({})

      // FASE 6: Eliminar lecciones y unidades (opcional - descomentar si se desea)
      console.log('Fase 6: Eliminando lecciones y unidades...')

      // 21. Eliminar lecciones (Lesson)
      const deletedLessons = await tx.lesson.deleteMany({})

      // 22. Eliminar unidades (Unit)
      const deletedUnits = await tx.unit.deleteMany({})

      // FASE 7: Eliminar rutas de aprendizaje y sus relaciones
      console.log('Fase 7: Eliminando rutas de aprendizaje...')

      // 23. Eliminar relaciones LearningPathCourse
      const deletedLearningPathCourses = await tx.learningPathCourse.deleteMany({})

      // 24. Eliminar rutas de aprendizaje (LearningPath)
      const deletedLearningPaths = await tx.learningPath.deleteMany({})

      // FASE 8: Eliminar cursos
      console.log('Fase 8: Eliminando cursos...')

      // 25. Eliminar cursos (Course)
      const deletedCourses = await tx.course.deleteMany({})

      return {
        // Registros de actividad
        deletedAttempts: deletedAttempts.count,
        deletedActivityAttempts: deletedActivityAttempts.count,
        deletedLessonProgress: deletedLessonProgress.count,
        deletedCourseProgress: deletedCourseProgress.count,
        deletedPathProgress: deletedPathProgress.count,
        deletedCertifications: deletedCertifications.count,
        deletedAlerts: deletedAlerts.count,
        deletedEnrollments: deletedEnrollments.count,
        deletedNotifications: deletedNotifications.count,
        
        // Usuarios
        deletedCollaborators: deletedCollaborators.count,
        deletedUsers: deletedUsers.count,
        
        // Estructura organizacional
        deletedEnrollmentRules: deletedEnrollmentRules.count,
        deletedAreas: deletedAreas.count,
        deletedPositions: deletedPositions.count,
        deletedSites: deletedSites.count,
        
        // Evaluaciones
        deletedQuizQuestions: deletedQuizQuestions.count,
        deletedQuizzes: deletedQuizzes.count,
        deletedQuestionOptions: deletedQuestionOptions.count,
        deletedQuestions: deletedQuestions.count,
        
        // Contenido
        deletedActivities: deletedActivities.count,
        deletedLessons: deletedLessons.count,
        deletedUnits: deletedUnits.count,
        deletedLearningPathCourses: deletedLearningPathCourses.count,
        deletedLearningPaths: deletedLearningPaths.count,
        deletedCourses: deletedCourses.count,
      }
    })

    console.log('✓ Datos de prueba eliminados por', session.user.email, result)

    return NextResponse.json({
      success: true,
      message: `Sistema limpiado exitosamente. Total de registros eliminados: ${
        Object.values(result).reduce((sum, count) => sum + count, 0)
      }`,
      details: {
        usuarios: {
          colaboradores: result.deletedCollaborators,
          cuentas: result.deletedUsers,
        },
        organizacion: {
          areas: result.deletedAreas,
          puestos: result.deletedPositions,
          sedes: result.deletedSites,
          reglasInscripcion: result.deletedEnrollmentRules,
        },
        contenido: {
          cursos: result.deletedCourses,
          rutasAprendizaje: result.deletedLearningPaths,
          unidades: result.deletedUnits,
          lecciones: result.deletedLessons,
          actividades: result.deletedActivities,
        },
        evaluaciones: {
          preguntas: result.deletedQuestions,
          opcionesPreguntas: result.deletedQuestionOptions,
          quizzes: result.deletedQuizzes,
          relacionesQuizPreguntas: result.deletedQuizQuestions,
          intentosQuiz: result.deletedAttempts,
          intentosActividades: result.deletedActivityAttempts,
        },
        progreso: {
          progresoLecciones: result.deletedLessonProgress,
          progresoCursos: result.deletedCourseProgress,
          progresoRutas: result.deletedPathProgress,
          inscripciones: result.deletedEnrollments,
          certificaciones: result.deletedCertifications,
          alertas: result.deletedAlerts,
        },
        comunicacion: {
          notificaciones: result.deletedNotifications,
        },
      },
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
