import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { SiteSchema } from "@/validations/sites"

const UpdateSchema = SiteSchema.partial()

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const data = UpdateSchema.parse(await req.json())
  const updated = await prisma.site.update({
    where: { id },
    data,
    include: { _count: { select: { collaborators: true } } }
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
  const site = await prisma.site.findUnique({
    where: { id },
    include: { _count: { select: { collaborators: true } } }
  })
  if (!site) return NextResponse.json({ error: "Not Found" }, { status: 404 })
  if (site._count.collaborators > 0) {
    return NextResponse.json({ error: "Cannot delete site with associated collaborators" }, { status: 409 })
  }
  await prisma.site.delete({ where: { id } })
  return NextResponse.json({ id })
}