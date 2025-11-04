import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ClientCourseContent from "./client-content"
import { BookOpen } from "lucide-react"

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
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-emerald-600" />
          <h1 className="text-3xl font-bold text-slate-900">{course.name}</h1>
        </div>
        <p className="text-sm text-slate-600 ml-8">
          {course.code}
          {course.description && (
            <>
              {" • "}
              <span className="text-slate-500">{course.description}</span>
            </>
          )}
        </p>
      </div>

      <ClientCourseContent courseId={id} initialUnits={units} />
    </div>
  )
}
