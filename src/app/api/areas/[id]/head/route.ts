import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { AreaHeadAssignmentSchema } from "@/validations/areaHead"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { collaboratorId } = AreaHeadAssignmentSchema.parse(await req.json())
  const { id } = await params

  const area = await prisma.area.findUnique({ where: { id } })
  if (!area) return NextResponse.json({ error: "Area not found" }, { status: 404 })

  // Cerrar jefe anterior abierto
  await prisma.areaHeadHistory.updateMany({
    where: { areaId: id, endDate: null },
    data: { endDate: new Date() },
  })

  const created = await prisma.areaHeadHistory.create({
    data: { areaId: id, collaboratorId, startDate: new Date() },
  })
  return NextResponse.json(created)
}
