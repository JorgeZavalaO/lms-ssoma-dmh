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

    const alerts = await prisma.progressAlert.findMany({
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

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
      { status: 500 }
    );
  }
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
