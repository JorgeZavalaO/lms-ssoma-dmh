import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import {
  CreateNotificationTemplateSchema,
  UpdateNotificationTemplateSchema,
} from "@/validations/notifications"

// GET /api/notification-templates - Listar plantillas
export async function GET() {
  const session = await auth()
  if (!session || session.user.role === "COLLABORATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const templates = await prisma.notificationTemplate.findMany({
    orderBy: { type: "asc" },
  })

  return NextResponse.json(templates)
}

// POST /api/notification-templates - Crear plantilla
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role === "COLLABORATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const json = await req.json()
    const data = CreateNotificationTemplateSchema.parse(json)

    const template = await prisma.notificationTemplate.create({
      data: {
        ...data,
        updatedBy: session.user.id,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating notification template:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    )
  }
}
