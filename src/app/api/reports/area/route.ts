import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAreaReport } from "@/lib/reports"
import { AreaReportFiltersSchema } from "@/validations/reports"

// GET /api/reports/area - Obtener reporte por área
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Parsear filtros desde query params
    const url = new URL(req.url)
    const filters = {
      areaId: url.searchParams.get("areaId") || undefined,
      siteId: url.searchParams.get("siteId") || undefined,
      positionId: url.searchParams.get("positionId") || undefined,
      status: url.searchParams.get("status") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      courseId: url.searchParams.get("courseId") || undefined,
    }

    // Validar filtros
    const validated = AreaReportFiltersSchema.safeParse(filters)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Filtros inválidos", details: validated.error },
        { status: 400 }
      )
    }

    const records = await getAreaReport(validated.data)

    return NextResponse.json({
      records,
      total: records.length,
    })
  } catch (error) {
    console.error("Error fetching area report:", error)
    return NextResponse.json(
      { error: "Error al generar reporte" },
      { status: 500 }
    )
  }
}
