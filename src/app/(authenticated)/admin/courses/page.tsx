import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientCourses } from "./client-courses"

async function fetchCourses() {
  return await prisma.course.findMany({
    include: {
      _count: {
        select: {
          versions: true,
          pathCourses: true,
          areaLinks: true,
          posLinks: true,
          siteLinks: true,
          collLinks: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

export default async function CoursesPage() {
  const session = await auth()
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/")
  }
  
  const courses = await fetchCourses()
  
  return (
    <div className="p-6 space-y-4">
      <ClientCourses initialCourses={courses} />
    </div>
  )
}
