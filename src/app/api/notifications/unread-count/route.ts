import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { countUnreadNotifications } from "@/lib/notifications"

// GET /api/notifications/unread-count - Contar notificaciones no leídas
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const count = await countUnreadNotifications(session.user.id)
    return NextResponse.json({ count })
  } catch (error: unknown) {
    console.error("Error counting unread notifications:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
