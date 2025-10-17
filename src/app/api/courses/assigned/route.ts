import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CourseAssignedQuerySchema } from "@/validations/courses"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const url = new URL(req.url)
  const { collaboratorId } = CourseAssignedQuerySchema.parse({ collaboratorId: url.searchParams.get("collaboratorId") })

  const collab = await prisma.collaborator.findUnique({
    where: { id: collaboratorId },
    select: { id: true, siteId: true, areaId: true, positionId: true },
  })
  if (!collab) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [byCollab, bySite, byArea, byPos] = await Promise.all([
    prisma.courseCollaboratorAssignment.findMany({ where: { collaboratorId }, include: { course: true } }),
    collab.siteId ? prisma.courseSiteAssignment.findMany({ where: { siteId: collab.siteId }, include: { course: true } }) : [],
    collab.areaId ? prisma.courseAreaAssignment.findMany({ where: { areaId: collab.areaId }, include: { course: true } }) : [],
    collab.positionId ? prisma.coursePositionAssignment.findMany({ where: { positionId: collab.positionId }, include: { course: true } }) : [],
  ])

  const map = new Map<string, { id: string; name: string; code: string }>()
  for (const x of [...byCollab, ...bySite, ...byArea, ...byPos]) {
    const c = (x as { course: { id: string; name: string; code: string } }).course
    if (!map.has(c.id)) map.set(c.id, c)
  }

  return NextResponse.json({ courses: Array.from(map.values()) })
}
