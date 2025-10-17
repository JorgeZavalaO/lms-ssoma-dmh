import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  GenerateExpirationRemindersSchema,
  GenerateTeamSummarySchema,
} from "@/validations/notifications"
import { generateExpirationReminders, generateTeamSummary } from "@/lib/notifications"

// POST /api/notifications/generate-reminders - Generar recordatorios de vencimiento
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role === "COLLABORATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const json = await req.json()
    const data = GenerateExpirationRemindersSchema.parse(json)

    const result = await generateExpirationReminders(data.daysBeforeExpiration)

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error("Error generating expiration reminders:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    )
  }
}

// POST /api/notifications/generate-team-summary - Generar resumen para jefes
export async function PUT(req: Request) {
  const session = await auth()
  if (!session || session.user.role === "COLLABORATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const json = await req.json()
    const data = GenerateTeamSummarySchema.parse(json)

    const result = await generateTeamSummary({
      areaId: data.areaId,
      siteId: data.siteId,
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error("Error generating team summary:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    )
  }
}
