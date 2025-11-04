import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Funciones de mapeo (mismas que en route.ts)
function mapAlertType(type: string): string {
  const typeMap: Record<string, string> = {
    EXPIRING_SOON: 'COURSE_EXPIRING',
    EXPIRED: 'COURSE_EXPIRED',
    RECERTIFICATION: 'RECERTIFICATION_REQUIRED',
    OVERDUE: 'CUSTOM',
  };
  return typeMap[type] || 'CUSTOM';
}

function mapSeverity(severity: any): string {
  if (typeof severity === 'number') {
    if (severity >= 3) return 'CRITICAL';
    if (severity === 2) return 'HIGH';
    if (severity === 1) return 'MEDIUM';
    return 'LOW';
  }
  return severity as string;
}

// PUT /api/progress/alerts/[id]/read - Marcar alerta como leída
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const params = await props.params;
    const alert = await prisma.progressAlert.findUnique({
      where: { id: params.id },
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.progressAlert.update({
      where: { id: params.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true },
        },
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    // Transformar respuesta
    const result = {
      id: updated.id,
      collaborator: {
        id: updated.collaborator.id,
        firstName: updated.collaborator.fullName.split(' ')[0] || '',
        lastName: updated.collaborator.fullName.split(' ').slice(1).join(' ') || '',
        email: updated.collaborator.email,
      },
      course: updated.course,
      type: mapAlertType(updated.type),
      severity: mapSeverity(updated.severity),
      message: updated.message,
      isRead: updated.isRead,
      isDismissed: updated.isDismissed,
      createdAt: updated.createdAt,
      readAt: updated.readAt,
      dismissedAt: updated.dismissedAt,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error marking alert as read:", error);
    return NextResponse.json(
      { error: "Error al marcar alerta como leída" },
      { status: 500 }
    );
  }
}
