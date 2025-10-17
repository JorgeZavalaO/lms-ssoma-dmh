import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getComplianceReport } from "@/lib/reports"
import { ComplianceReportFiltersSchema } from "@/validations/reports"

// GET /api/reports/compliance - Obtener reporte de cumplimiento SSOMA
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
      criticalOnly: url.searchParams.get("criticalOnly") === "true",
    }

    // Validar filtros
    const validated = ComplianceReportFiltersSchema.safeParse(filters)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Filtros inválidos", details: validated.error },
        { status: 400 }
      )
    }

    const matrix = await getComplianceReport(validated.data)

    // Calcular resumen
    const summary = {
      totalCollaborators: matrix.length,
      totalCourses: matrix[0]?.courses.length || 0,
      compliant: matrix.filter((c) =>
        c.courses.every((course) => course.status === "COMPLIANT")
      ).length,
      expiringSoon: matrix.filter((c) =>
        c.courses.some((course) => course.status === "EXPIRING_SOON")
      ).length,
      expired: matrix.filter((c) =>
        c.courses.some((course) => course.status === "EXPIRED")
      ).length,
    }

    return NextResponse.json({
      matrix,
      summary,
    })
  } catch (error) {
    console.error("Error fetching compliance report:", error)
    return NextResponse.json(
      { error: "Error al generar reporte" },
      { status: 500 }
    )
  }
}
