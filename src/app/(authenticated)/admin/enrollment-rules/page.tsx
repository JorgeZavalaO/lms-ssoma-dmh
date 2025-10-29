import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ClientEnrollmentRules from "./client-rules"

export default async function EnrollmentRulesPage() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const [rules, courses, learningPaths, sites, areas, positions] = await Promise.all([
    prisma.enrollmentRule.findMany({
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        learningPath: {
          select: {
            id: true,
            name: true,
            description: true,
            courses: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.learningPath.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.site.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.area.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.position.findMany({
      include: { area: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reglas de Inscripción Automática</h1>
        <p className="text-muted-foreground mt-2">
          Configura las reglas para asignar cursos automáticamente según perfil
        </p>
      </div>

      <ClientEnrollmentRules
        initialRules={rules}
        courses={courses}
        learningPaths={learningPaths}
        sites={sites}
        areas={areas}
        positions={positions}
      />
    </div>
  )
}
