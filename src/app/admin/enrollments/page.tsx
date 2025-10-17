import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ClientEnrollments from "./client-enrollments"

interface EnrollmentsPageProps {
  searchParams: Promise<{ courseId?: string }>
}

export default async function EnrollmentsPage({ searchParams }: EnrollmentsPageProps) {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const { courseId } = await searchParams

  const [enrollments, courses, collaborators, sites, areas, positions] = await Promise.all([
    prisma.enrollment.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        collaborator: {
          select: {
            id: true,
            dni: true,
            fullName: true,
            email: true,
            area: { select: { name: true } },
            position: { select: { name: true } },
            site: { select: { name: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
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
    prisma.collaborator.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        dni: true,
        fullName: true,
        email: true,
        area: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.site.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.area.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.position.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inscripciones</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las inscripciones manuales de colaboradores a cursos
        </p>
      </div>

      <ClientEnrollments
        initialEnrollments={enrollments}
        courses={courses}
        collaborators={collaborators}
        sites={sites}
        areas={areas}
        positions={positions}
      />
    </div>
  )
}
