import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireSuperAdmin } from "@/lib/authorization";
import { reconcileApprovedAttemptsForAllUsers } from "@/lib/course-reconciliation";

// GET /api/superadmin/course-reconciliation
// Auditoria previa (sin cambios)
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    const authError = requireSuperAdmin(session);
    if (authError) return authError;

    const summary = await reconcileApprovedAttemptsForAllUsers({
      dryRun: true,
      maxDetails: 100,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error auditando reconciliacion de cursos:", error);
    return NextResponse.json(
      { error: "Error al auditar reconciliacion de cursos" },
      { status: 500 },
    );
  }
}

// POST /api/superadmin/course-reconciliation
// Ejecuta reconciliacion global real
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    const authError = requireSuperAdmin(session);
    if (authError) return authError;

    const summary = await reconcileApprovedAttemptsForAllUsers({
      dryRun: false,
      includeCertificationRepair: true,
      maxDetails: 200,
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error ejecutando reconciliacion de cursos:", error);
    return NextResponse.json(
      { error: "Error al ejecutar reconciliacion de cursos" },
      { status: 500 },
    );
  }
}
