import { auth } from "@/auth"
import { getAdminDashboardKPIs } from "@/lib/admin-kpis"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()

    // Validar autenticación
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validar que sea admin
    const userRole = (session.user as any)?.role
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Obtener datos
    const kpis = await getAdminDashboardKPIs()

    return NextResponse.json(kpis)
  } catch (error) {
    console.error("[ADMIN_DASHBOARD_KPIs]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
