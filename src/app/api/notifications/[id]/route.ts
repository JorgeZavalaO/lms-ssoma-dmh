import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UpdateNotificationSchema } from "@/validations/notifications"
import { markNotificationAsRead, archiveNotification } from "@/lib/notifications"

// GET /api/notifications/[id] - Obtener notificación
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const notification = await prisma.notification.findUnique({
    where: { id },
    include: {
      template: true,
    },
  })

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 })
  }

  // Verificar que la notificación pertenece al usuario
  if (notification.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(notification)
}

// PATCH /api/notifications/[id] - Actualizar notificación (marcar como leída/archivada)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const json = await req.json()
    const data = UpdateNotificationSchema.parse(json)

    // Verificar propiedad
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Actualizar según la acción
    if (data.isRead !== undefined && data.isRead) {
      await markNotificationAsRead(id)
    }

    if (data.isArchived !== undefined && data.isArchived) {
      await archiveNotification(id)
    }

    const updated = await prisma.notification.findUnique({
      where: { id },
      include: { template: true },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    )
  }
}

// DELETE /api/notifications/[id] - Eliminar notificación
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Verificar propiedad
  const notification = await prisma.notification.findUnique({
    where: { id },
  })

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.notification.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
