import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireStaff } from "@/lib/authorization";
import { getUserReportDetail } from "@/lib/reports";
import { UserReportFiltersSchema } from "@/validations/reports";

// GET /api/reports/user/[collaboratorId] - Obtener KPIs y detalle por usuario
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ collaboratorId: string }> },
) {
  try {
    const session = await auth();
    const authError = requireStaff(session);
    if (authError) return authError;

    const { collaboratorId } = await props.params;
    const url = new URL(req.url);
    const filters = {
      areaId: url.searchParams.get("areaId") || undefined,
      siteId: url.searchParams.get("siteId") || undefined,
      positionId: url.searchParams.get("positionId") || undefined,
      courseId: url.searchParams.get("courseId") || undefined,
      status: url.searchParams.get("status") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      page: "1",
      pageSize: "1",
    };

    const validated = UserReportFiltersSchema.safeParse(filters);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Filtros inválidos", details: validated.error },
        { status: 400 },
      );
    }

    const detail = await getUserReportDetail(collaboratorId, validated.data);
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Colaborador no encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Error fetching user report detail:", error);
    return NextResponse.json(
      { error: "Error al generar detalle de usuario" },
      { status: 500 },
    );
  }
}
