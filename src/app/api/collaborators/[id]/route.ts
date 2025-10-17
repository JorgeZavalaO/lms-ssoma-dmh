import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UpdateCollaboratorSchema } from "@/validations/collaborators"
import { auth } from "@/auth"
import { hashPassword } from "@/lib/password"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const data = UpdateCollaboratorSchema.parse(body)
  const { id } = await params

  const current = await prisma.collaborator.findUnique({ 
    where: { id },
    include: { user: true }
  })
  if (!current) return NextResponse.json({ error: "Not Found" }, { status: 404 })

  // Validar email único si se está cambiando
  if (data.email && data.email !== current.email) {
    const existingCollab = await prisma.collaborator.findUnique({
      where: { email: data.email },
      select: { id: true }
    })
    if (existingCollab) {
      return NextResponse.json({ error: "Email ya existe en otro colaborador" }, { status: 409 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, collaboratorId: true }
    })
    if (existingUser && existingUser.collaboratorId !== id) {
      return NextResponse.json({ error: "Email ya está registrado por otro usuario" }, { status: 409 })
    }
  }

  // Resolver nuevas FK si vienen
  const site = data.siteCode ? await prisma.site.findUnique({ where: { code: data.siteCode } }) : null
  const area = data.areaCode ? await prisma.area.findUnique({ where: { code: data.areaCode } }) : null
  const position =
    data.positionName && area
      ? await prisma.position.findFirst({ where: { name: data.positionName, areaId: area.id } })
      : null

  // Detectar cambios de asignación para histórico
  const assignmentChanged =
    (site && site.id !== current.siteId) ||
    (area && area.id !== current.areaId) ||
    (position && position.id !== current.positionId)

  // Preparar actualización de contraseña si se solicita
  let hashedPassword: string | undefined = undefined
  if (data.updatePassword && data.password) {
    hashedPassword = await hashPassword(data.password)
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Cerrar histórico anterior si hay cambio de asignación
    if (assignmentChanged) {
      await tx.collaboratorAssignmentHistory.updateMany({
        where: { collaboratorId: id, endDate: null },
        data: { endDate: new Date() },
      })
    }

    // 2. Actualizar colaborador
    const updatedCollab = await tx.collaborator.update({
      where: { id },
      data: {
        fullName: data.fullName ?? undefined,
        email: data.email ?? undefined,
        status: data.status ?? undefined,
        entryDate: data.entryDate ?? undefined,
        siteId: site?.id ?? undefined,
        areaId: area?.id ?? undefined,
        positionId: position?.id ?? undefined,
        ...(assignmentChanged && {
          history: {
            create: {
              siteId: site?.id,
              areaId: area?.id,
              positionId: position?.id,
              startDate: new Date(),
            },
          },
        }),
      },
      include: { site: true, area: true, position: true, user: true },
    })

    // 3. Actualizar usuario asociado si existe
    if (current.user) {
      const userUpdateData: Record<string, unknown> = {}
      
      if (data.fullName) userUpdateData.name = data.fullName
      if (data.email) userUpdateData.email = data.email
      if (data.role) userUpdateData.role = data.role
      if (hashedPassword) userUpdateData.hashedPassword = hashedPassword

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: current.user.id },
          data: userUpdateData,
        })
      }
    }

    return updatedCollab
  })

  return NextResponse.json({ 
    collaborator: updated,
    message: data.updatePassword ? "Colaborador y contraseña actualizados" : "Colaborador actualizado"
  })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  
  // Soft-delete: marcar INACTIVE tanto el colaborador como su usuario
  const updated = await prisma.$transaction(async (tx) => {
    const collaborator = await tx.collaborator.update({
      where: { id },
      data: { status: "INACTIVE" },
      include: { user: true }
    })

    // También desactivar el usuario si existe (cambiar a un estado inactivo o eliminar sesiones)
    // Por ahora solo marcamos el colaborador como INACTIVE
    // Opcionalmente podrías eliminar el usuario completamente:
    // if (collaborator.user) {
    //   await tx.user.delete({ where: { id: collaborator.user.id } })
    // }

    return collaborator
  })

  return NextResponse.json({ id: updated.id, status: updated.status })
}
