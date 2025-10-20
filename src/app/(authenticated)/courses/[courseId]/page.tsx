import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientCourseView } from "./client-course-view"

interface CoursePageProps {
  params: Promise<{
    courseId: string
  }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Verificar que el usuario tenga acceso al curso
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId: courseId,
      collaboratorId: session.user.collaboratorId || "",
    },
    include: {
      course: {
        include: {
          units: {
            include: {
              lessons: {
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
          quizzes: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })

  if (!enrollment) {
    redirect("/my-courses")
  }

  // Obtener progreso de lecciones
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      collaboratorId: session.user.collaboratorId || "",
      lesson: {
        unit: {
          courseId: courseId,
        },
      },
    },
  })

  // Obtener intentos de quiz
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      collaboratorId: session.user.collaboratorId || "",
      quiz: {
        courseId: courseId,
      },
    },
    include: {
      quiz: true,
    },
    orderBy: {
      startedAt: "desc",
    },
  })

  return (
    <ClientCourseView
      enrollment={enrollment}
      lessonProgress={lessonProgress}
      quizAttempts={quizAttempts}
    />
  )
}
