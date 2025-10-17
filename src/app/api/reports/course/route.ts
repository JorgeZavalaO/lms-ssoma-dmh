import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getCourseReport } from "@/lib/reports"
import { CourseReportFiltersSchema } from "@/validations/reports"

// GET /api/reports/course - Obtener reporte por curso
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Parsear filtros desde query params
    const url = new URL(req.url)
    const filters = {
      courseId: url.searchParams.get("courseId") || "",
      versionId: url.searchParams.get("versionId") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    }

    // Validar filtros
    const validated = CourseReportFiltersSchema.safeParse(filters)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Filtros inválidos", details: validated.error },
        { status: 400 }
      )
    }

    const reportData = await getCourseReport(validated.data)

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error fetching course report:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al generar reporte",
      },
      { status: 500 }
    )
  }
}
