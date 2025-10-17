import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UpdateNotificationPreferenceSchema } from "@/validations/notifications"

// GET /api/notification-preferences - Obtener preferencias del usuario
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: session.user.id },
    orderBy: { type: "asc" },
  })

  return NextResponse.json(preferences)
}

// PUT /api/notification-preferences - Actualizar preferencia
export async function PUT(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const json = await req.json()
    const data = UpdateNotificationPreferenceSchema.parse(json)

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId: session.user.id,
          type: data.type,
        },
      },
      create: {
        userId: session.user.id,
        type: data.type,
        enableEmail: data.enableEmail,
        enableInApp: data.enableInApp,
      },
      update: {
        enableEmail: data.enableEmail,
        enableInApp: data.enableInApp,
      },
    })

    return NextResponse.json(preference)
  } catch (error: unknown) {
    console.error("Error updating notification preference:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    )
  }
}
