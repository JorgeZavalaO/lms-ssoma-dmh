import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { PositionSchema } from "@/validations/positions"

export async function GET() {
  const items = await prisma.position.findMany({ include: { area: true } })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const data = PositionSchema.parse(await req.json())
  const created = await prisma.position.create({ data })
  return NextResponse.json(created, { status: 201 })
}
