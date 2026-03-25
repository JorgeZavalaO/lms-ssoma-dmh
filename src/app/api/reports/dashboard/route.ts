import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDashboardKPIs } from "@/lib/reports"
import { DashboardFiltersSchema } from "@/validations/reports"
import { requireStaff } from "@/lib/authorization"

// GET /api/reports/dashboard - Obtener KPIs del dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const authError = requireStaff(session)
    if (authError) return authError

    // Parsear filtros desde query params
    const url = new URL(req.url)
    const filters = {
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      areaId: url.searchParams.get("areaId") || undefined,
      siteId: url.searchParams.get("siteId") || undefined,
    }

    // Validar filtros
    const validated = DashboardFiltersSchema.safeParse(filters)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Filtros inválidos", details: validated.error },
        { status: 400 }
      )
    }

    // Convertir fechas si existen
    const parsedFilters = {
      ...(validated.data.startDate && {
        startDate: new Date(validated.data.startDate),
      }),
      ...(validated.data.endDate && {
        endDate: new Date(validated.data.endDate),
      }),
      ...(validated.data.areaId && { areaId: validated.data.areaId }),
      ...(validated.data.siteId && { siteId: validated.data.siteId }),
    }

    const kpis = await getDashboardKPIs(parsedFilters)

    return NextResponse.json(kpis)
  } catch (error) {
    console.error("Error fetching dashboard KPIs:", error)
    return NextResponse.json(
      { error: "Error al obtener KPIs" },
      { status: 500 }
    )
  }
}
