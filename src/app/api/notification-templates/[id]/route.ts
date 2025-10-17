import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UpdateNotificationTemplateSchema } from "@/validations/notifications"

// GET /api/notification-templates/[id] - Obtener plantilla
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role === "COLLABORATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const template = await prisma.notificationTemplate.findUnique({
    where: { id },
  })

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  return NextResponse.json(template)
}

// PUT /api/notification-templates/[id] - Actualizar plantilla
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role === "COLLABORATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await params
    const json = await req.json()
    const data = UpdateNotificationTemplateSchema.parse(json)

    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
    })

    return NextResponse.json(template)
  } catch (error: unknown) {
    console.error("Error updating notification template:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    )
  }
}

// DELETE /api/notification-templates/[id] - Eliminar plantilla
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role === "COLLABORATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  await prisma.notificationTemplate.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
