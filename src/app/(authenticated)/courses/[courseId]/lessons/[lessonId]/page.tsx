import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientLessonView } from "./client-lesson-view"

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

  // Obtener todas las lecciones del curso para navegación
  const allUnits = await prisma.unit.findMany({
    where: { courseId: courseId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  return (
    <ClientLessonView
      lesson={lesson}
      progress={progress}
      allUnits={allUnits}
      courseId={courseId}
      collaboratorId={session.user.collaboratorId}
    />
  )
}
