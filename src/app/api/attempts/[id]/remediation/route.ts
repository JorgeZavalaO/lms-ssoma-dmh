import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

// POST /api/attempts/[id]/remediation - Marcar remediación como completada
export async function POST(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: attemptId } = await params;

    // Obtener el intento
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Intento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el intento pertenece al usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collaboratorId: true },
    });

    if (!user?.collaboratorId || attempt.collaboratorId !== user.collaboratorId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Verificar que requiere remediación
    if (!attempt.requiresRemediation) {
      return NextResponse.json(
        { error: "Este intento no requiere remediación" },
        { status: 400 }
      );
    }

    // Verificar que no esté ya completada
    if (attempt.remediationCompleted) {
      return NextResponse.json(
        { error: "La remediación ya fue completada" },
        { status: 400 }
      );
    }

    // Marcar como completada
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        remediationCompleted: true,
      },
    });

    return NextResponse.json({
      message: "Remediación completada exitosamente",
      attempt: updatedAttempt,
    });
  } catch (error) {
    console.error("Error al completar remediación:", error);
    return NextResponse.json(
      { error: "Error al completar remediación" },
      { status: 500 }
    );
  }
}
