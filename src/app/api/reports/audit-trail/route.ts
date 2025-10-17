import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAuditTrail } from "@/lib/reports"
import { AuditTrailFiltersSchema } from "@/validations/reports"

// GET /api/reports/audit-trail - Obtener trazabilidad de evaluaciones
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Parsear filtros desde query params
    const url = new URL(req.url)
    const filters = {
      collaboratorId: url.searchParams.get("collaboratorId") || undefined,
      courseId: url.searchParams.get("courseId") || undefined,
      quizId: url.searchParams.get("quizId") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      minScore: url.searchParams.get("minScore")
        ? parseFloat(url.searchParams.get("minScore")!)
        : undefined,
      maxScore: url.searchParams.get("maxScore")
        ? parseFloat(url.searchParams.get("maxScore")!)
        : undefined,
      status: url.searchParams.get("status") || undefined,
    }

    // Validar filtros
    const validated = AuditTrailFiltersSchema.safeParse(filters)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Filtros inválidos", details: validated.error },
        { status: 400 }
      )
    }

    const records = await getAuditTrail(validated.data)

    return NextResponse.json({
      records,
      total: records.length,
    })
  } catch (error) {
    console.error("Error fetching audit trail:", error)
    return NextResponse.json(
      { error: "Error al generar reporte" },
      { status: 500 }
    )
  }
}
