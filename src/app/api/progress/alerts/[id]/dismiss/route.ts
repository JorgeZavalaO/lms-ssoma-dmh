import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/progress/alerts/[id]/dismiss - Descartar alerta
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
        isDismissed: true,
        dismissedAt: new Date(),
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error dismissing alert:", error);
    return NextResponse.json(
      { error: "Error al descartar alerta" },
      { status: 500 }
    );
  }
}
