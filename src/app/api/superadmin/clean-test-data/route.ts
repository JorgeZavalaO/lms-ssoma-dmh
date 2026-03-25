import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  getDestructiveMaintenanceStatus,
  isValidDangerousConfirmation,
} from "@/lib/operational-safety"

/**
 * POST /api/superadmin/clean-test-data
 * Elimina todos los datos de prueba del sistema
 * Solo accesible para SUPERADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No autorizado - Solo SUPERADMIN" },
        { status: 403 }
      )
    }

    const maintenance = getDestructiveMaintenanceStatus()
    if (!maintenance.enabled) {
      return NextResponse.json(
        { error: maintenance.reason, stage: maintenance.stage },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!isValidDangerousConfirmation(body?.confirmationText)) {
      return NextResponse.json(
        { error: "Confirmacion invalida para ejecutar una accion destructiva" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      console.log("Fase 1: Eliminando registros de progreso y actividad...")

      const deletedAttempts = await tx.quizAttempt.deleteMany({})
      const deletedActivityAttempts = await tx.activityAttempt.deleteMany({})
      const deletedLessonProgress = await tx.lessonProgress.deleteMany({})
      const deletedCourseProgress = await tx.courseProgress.deleteMany({})
      const deletedPathProgress = await tx.learningPathProgress.deleteMany({})
      const deletedCertifications = await tx.certificationRecord.deleteMany({})
      const deletedAlerts = await tx.progressAlert.deleteMany({})
      const deletedEnrollments = await tx.enrollment.deleteMany({})
      const deletedNotifications = await tx.notification.deleteMany({})

      console.log("Fase 2: Eliminando colaboradores y usuarios...")

      const deletedCollaborators = await tx.collaborator.deleteMany({})
      const deletedUsers = await tx.user.deleteMany({
        where: {
          role: "COLLABORATOR",
        },
      })

      console.log("Fase 3: Eliminando estructura organizacional...")

      const deletedEnrollmentRules = await tx.enrollmentRule.deleteMany({})
      const deletedAreas = await tx.area.deleteMany({})
      const deletedPositions = await tx.position.deleteMany({})
      const deletedSites = await tx.site.deleteMany({})

      console.log("Fase 4: Eliminando evaluaciones y preguntas...")

      const deletedQuizQuestions = await tx.quizQuestion.deleteMany({})
      const deletedQuizzes = await tx.quiz.deleteMany({})
      const deletedQuestionOptions = await tx.questionOption.deleteMany({})
      const deletedQuestions = await tx.question.deleteMany({})

      console.log("Fase 5: Eliminando actividades interactivas...")

      const deletedActivities = await tx.interactiveActivity.deleteMany({})

      console.log("Fase 6: Eliminando lecciones y unidades...")

      const deletedLessons = await tx.lesson.deleteMany({})
      const deletedUnits = await tx.unit.deleteMany({})

      console.log("Fase 7: Eliminando rutas de aprendizaje...")

      const deletedLearningPathCourses = await tx.learningPathCourse.deleteMany({})
      const deletedLearningPaths = await tx.learningPath.deleteMany({})

      console.log("Fase 8: Eliminando cursos...")

      const deletedCourses = await tx.course.deleteMany({})

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
        deletedEnrollmentRules: deletedEnrollmentRules.count,
        deletedAreas: deletedAreas.count,
        deletedPositions: deletedPositions.count,
        deletedSites: deletedSites.count,
        deletedQuizQuestions: deletedQuizQuestions.count,
        deletedQuizzes: deletedQuizzes.count,
        deletedQuestionOptions: deletedQuestionOptions.count,
        deletedQuestions: deletedQuestions.count,
        deletedActivities: deletedActivities.count,
        deletedLessons: deletedLessons.count,
        deletedUnits: deletedUnits.count,
        deletedLearningPathCourses: deletedLearningPathCourses.count,
        deletedLearningPaths: deletedLearningPaths.count,
        deletedCourses: deletedCourses.count,
      }
    })

    console.log("Datos de prueba eliminados por", session.user.email, result)

    return NextResponse.json({
      success: true,
      message: `Sistema limpiado exitosamente. Total de registros eliminados: ${Object.values(
        result
      ).reduce((sum, count) => sum + count, 0)}`,
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
    console.error("Error eliminando datos de prueba:", error)
    const message =
      error instanceof Error ? error.message : "Error al limpiar datos de prueba"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
