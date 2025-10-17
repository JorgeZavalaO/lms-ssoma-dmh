import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ClientCourseContent from "./client-content"

interface CourseContentPageProps {
  params: Promise<{ id: string }>
}

export default async function CourseContentPage({ params }: CourseContentPageProps) {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
    },
  })

  if (!course) {
    redirect("/admin/courses")
  }

  const units = await prisma.unit.findMany({
    where: { courseId: id },
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: { lessons: true },
      },
    },
    orderBy: { order: "asc" },
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{course.name}</h1>
        <p className="text-muted-foreground mt-2">
          {course.code} - Gestión de Contenidos
        </p>
      </div>

      <ClientCourseContent courseId={id} initialUnits={units} />
    </div>
  )
}
