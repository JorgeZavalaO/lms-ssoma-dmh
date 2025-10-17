import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { markAllNotificationsAsRead } from "@/lib/notifications"

// POST /api/notifications/mark-all-read - Marcar todas como leídas
export async function POST() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await markAllNotificationsAsRead(session.user.id)
    return NextResponse.json({ success: true, count: result.count })
  } catch (error: unknown) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
