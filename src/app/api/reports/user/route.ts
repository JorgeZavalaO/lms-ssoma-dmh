import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireStaff } from "@/lib/authorization";
import { getUserReport } from "@/lib/reports";
import { UserReportFiltersSchema } from "@/validations/reports";

// GET /api/reports/user - Obtener KPIs paginados por colaborador
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const authError = requireStaff(session);
    if (authError) return authError;

    const url = new URL(req.url);
    const filters = {
      q: url.searchParams.get("q") || undefined,
      areaId: url.searchParams.get("areaId") || undefined,
      siteId: url.searchParams.get("siteId") || undefined,
      positionId: url.searchParams.get("positionId") || undefined,
      courseId: url.searchParams.get("courseId") || undefined,
      status: url.searchParams.get("status") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    };

    const validated = UserReportFiltersSchema.safeParse(filters);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Filtros inválidos", details: validated.error },
        { status: 400 },
      );
    }

    const report = await getUserReport(validated.data);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching user report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte por usuario" },
      { status: 500 },
    );
  }
}
