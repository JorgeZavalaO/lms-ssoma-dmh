import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { SiteSchema } from "@/validations/sites"

export async function GET() {
  const items = await prisma.site.findMany({
    include: { _count: { select: { collaborators: true } } },
    orderBy: { code: "asc" }
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const data = SiteSchema.parse(await req.json())
  const created = await prisma.site.create({ data })
  return NextResponse.json(created, { status: 201 })
}