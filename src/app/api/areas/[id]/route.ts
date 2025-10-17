import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { AreaSchema } from "@/validations/areas"

const UpdateSchema = AreaSchema.partial()

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const data = UpdateSchema.parse(await req.json())
  const updated = await prisma.area.update({
    where: { id },
    data,
    include: { positions: true, _count: { select: { collaborators: true } } }
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  // Verificar si tiene colaboradores o posiciones
  const area = await prisma.area.findUnique({
    where: { id },
    include: { _count: { select: { collaborators: true, positions: true } } }
  })
  if (!area) return NextResponse.json({ error: "Not Found" }, { status: 404 })
  if (area._count.collaborators > 0 || area._count.positions > 0) {
    return NextResponse.json({ error: "Cannot delete area with associated data" }, { status: 409 })
  }
  await prisma.area.delete({ where: { id } })
  return NextResponse.json({ id })
}