import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/require-role"
import type { Role } from "@/config/access"

export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole(["ADMIN", "SUPERADMIN"])
  if (!gate.ok) return gate.res

  const { role } = (await _.json()) as { role: Role }
  if (!role || !["SUPERADMIN", "ADMIN", "COLLABORATOR"].includes(role))
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 })

  // Regla: solo SUPERADMIN puede establecer/alterar SUPERADMIN
  const me = gate.session?.user
  if (!me) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 401 })
  }
  if (role === "SUPERADMIN" && me.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado (requiere SUPERADMIN)" }, { status: 403 })
  }

  // Evita degradar/promover a SUPERADMIN si no eres SUPERADMIN
  const { id } = await params
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: "Usuario no existe" }, { status: 404 })
  if (target.role === "SUPERADMIN" && me.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No puedes modificar un SUPERADMIN" }, { status: 403 })
  }

  const updated = await prisma.user.update({ where: { id }, data: { role } })
  return NextResponse.json({ id: updated.id, role: updated.role })
}
