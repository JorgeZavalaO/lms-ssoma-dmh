import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientLessonView } from "./client-lesson-view"
import { checkCoursePrerequisites } from "@/lib/access"
import { getCourseCompletionPolicy } from "@/lib/system-settings"

interface LessonPageProps {
  params: Promise<{
    courseId: string
    lessonId: string
  }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params
  const session = await auth()

  if (!session?.user || !session.user.collaboratorId) {
    redirect("/login")
  }

  // Verificar que el usuario tenga acceso al curso
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId: courseId,
      collaboratorId: session.user.collaboratorId,
    },
  })

  if (!enrollment) {
    redirect("/my-courses")
  }

  // Enforcer de prerequisito si el curso pertenece a una ruta asignada
  const collabId = session.user.collaboratorId
  if (collabId) {
    const policy = await getCourseCompletionPolicy()
    if (!policy.bypassCourseCompletionRestrictions) {
      const prereq = await checkCoursePrerequisites(collabId, courseId)
      if (!prereq.allowed) {
        redirect("/my-learning-paths")
      }
    }
  }

  // Obtener la lección con su unidad y curso
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      unit: {
        include: {
          course: true,
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  if (!lesson || lesson.unit.course.id !== courseId) {
    redirect(`/courses/${courseId}`)
  }

  // Obtener progreso de esta lección
  const progress = await prisma.lessonProgress.findUnique({
    where: {
      lessonId_collaboratorId: {
        lessonId: lessonId,
        collaboratorId: session.user.collaboratorId,
      },
    },
  })

  // Obtener progreso de todas las lecciones del curso para sidebar y progreso global
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      collaboratorId: session.user.collaboratorId,
      lesson: {
        unit: {
          courseId,
        },
      },
    },
    select: {
      lessonId: true,
      completed: true,
      viewPercentage: true,
    },
  })

  // Obtener todas las lecciones del curso para navegación
  const allUnits = await prisma.unit.findMany({
    where: { courseId: courseId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
      quizzes: {
        where: { status: "PUBLISHED" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, order: true, passingScore: true, maxAttempts: true },
      },
    },
    orderBy: { order: "asc" },
  })

  // Obtener intentos de examen del colaborador en este curso
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      collaboratorId: session.user.collaboratorId,
      quiz: { courseId },
    },
    select: {
      quizId: true,
      status: true,
      score: true,
      attemptNumber: true,
    },
    orderBy: { attemptNumber: "desc" },
  })

  return (
    <ClientLessonView
      lesson={lesson}
      progress={progress}
      lessonProgress={lessonProgress}
      allUnits={allUnits}
      courseId={courseId}
      collaboratorId={session.user.collaboratorId}
      quizAttempts={quizAttempts}
    />
  )
}
