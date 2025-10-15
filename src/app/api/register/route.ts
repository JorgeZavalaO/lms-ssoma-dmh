import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { email, password, name } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Email y password requeridos" }, { status: 400 })
  }
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: "Ya existe" }, { status: 409 })

  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { email, name, hashedPassword },
  })
  return NextResponse.json({ ok: true })
}
