import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateProgressAlertSchema } from "@/validations/progress";

// GET /api/progress/alerts - Listar alertas
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collaboratorId = searchParams.get("collaboratorId");
    const type = searchParams.get("type");
    const isRead = searchParams.get("isRead");
    const isDismissed = searchParams.get("isDismissed");

    const where: any = {};
    if (collaboratorId) where.collaboratorId = collaboratorId;
    if (type) where.type = type;
    if (isRead !== null) where.isRead = isRead === "true";
    if (isDismissed !== null) where.isDismissed = isDismissed === "true";

    const alertsData = await prisma.progressAlert.findMany({
      where,
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true },
        },
        course: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    // Transformar datos para que coincidan con el cliente
    const alerts = alertsData.map(alert => ({
      id: alert.id,
      collaborator: {
        id: alert.collaborator.id,
        firstName: alert.collaborator.fullName.split(' ')[0] || '',
        lastName: alert.collaborator.fullName.split(' ').slice(1).join(' ') || '',
        email: alert.collaborator.email,
      },
      course: alert.course,
      type: mapAlertType(alert.type),
      severity: mapSeverity(alert.severity),
      message: alert.message,
      isRead: alert.isRead,
      isDismissed: alert.isDismissed,
      createdAt: alert.createdAt,
      readAt: alert.readAt,
      dismissedAt: alert.dismissedAt,
    }));

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
      { status: 500 }
    );
  }
}

// Funciones de mapeo
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
  // Si es un número, convertir
  if (typeof severity === 'number') {
    if (severity >= 3) return 'CRITICAL';
    if (severity === 2) return 'HIGH';
    if (severity === 1) return 'MEDIUM';
    return 'LOW';
  }
  // Si ya es string, retornar como está
  return severity as string;
}

// POST /api/progress/alerts - Crear alerta
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.role || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const validated = CreateProgressAlertSchema.parse(body);

    const alert = await prisma.progressAlert.create({
      data: {
        collaboratorId: validated.collaboratorId,
        courseId: validated.courseId,
        type: validated.type,
        severity: validated.severity,
        title: validated.title,
        message: validated.message,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        metadata: validated.metadata as any,
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

    return NextResponse.json(alert, { status: 201 });
  } catch (error: any) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear alerta" },
      { status: 500 }
    );
  }
}
