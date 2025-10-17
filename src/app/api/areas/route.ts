import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { AreaSchema } from "@/validations/areas"

export async function GET() {
  const items = await prisma.area.findMany({
    include: {
      positions: true,
      _count: {
        select: { collaborators: true }
      }
    },
    orderBy: { name: "asc" }
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const data = AreaSchema.parse(await req.json())
  const created = await prisma.area.create({ data })
  return NextResponse.json(created, { status: 201 })
}