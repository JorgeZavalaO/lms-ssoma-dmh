import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { PositionSchema } from "@/validations/positions"

const UpdateSchema = PositionSchema.partial()

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const data = UpdateSchema.parse(await req.json())
  const updated = await prisma.position.update({
    where: { id },
    data,
    include: { area: true }
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  // Verificar si tiene colaboradores
  const position = await prisma.position.findUnique({
    where: { id },
    include: { _count: { select: { collaborators: true } } }
  })
  if (!position) return NextResponse.json({ error: "Not Found" }, { status: 404 })
  if (position._count.collaborators > 0) {
    return NextResponse.json({ error: "Cannot delete position with associated collaborators" }, { status: 409 })
  }
  await prisma.position.delete({ where: { id } })
  return NextResponse.json({ id })
}