import { auth } from "@/auth"
import { getDashboardKPIs } from "@/lib/kpis"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()

    // Validar autenticación
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Obtener collaborator ID
    const collaboratorId = (session.user as any)?.collaboratorId
    if (!collaboratorId) {
      return NextResponse.json({ error: "Collaborator ID not found" }, { status: 400 })
    }

    // Obtener datos
    const kpis = await getDashboardKPIs(collaboratorId)

    return NextResponse.json(kpis)
  } catch (error) {
    console.error("[DASHBOARD_KPIs]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
