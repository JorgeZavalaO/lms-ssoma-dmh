import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CourseAssignmentSchema } from "@/validations/courseAssignments"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { areas = [], positions = [], sites = [], collaborators = [] } = CourseAssignmentSchema.parse(await req.json())
  const { id } = await params

  const ops = [
    ...areas.map((areaId) =>
      prisma.courseAreaAssignment.upsert({
        where: { courseId_areaId: { courseId: id, areaId } },
        update: {},
        create: { courseId: id, areaId },
      })
    ),
    ...positions.map((positionId) =>
      prisma.coursePositionAssignment.upsert({
        where: { courseId_positionId: { courseId: id, positionId } },
        update: {},
        create: { courseId: id, positionId },
      })
    ),
    ...sites.map((siteId) =>
      prisma.courseSiteAssignment.upsert({
        where: { courseId_siteId: { courseId: id, siteId } },
        update: {},
        create: { courseId: id, siteId },
      })
    ),
    ...collaborators.map((collaboratorId) =>
      prisma.courseCollaboratorAssignment.upsert({
        where: { courseId_collaboratorId: { courseId: id, collaboratorId } },
        update: {},
        create: { courseId: id, collaboratorId },
      })
    ),
  ]

  await prisma.$transaction(ops)
  return NextResponse.json({ ok: true })
}
