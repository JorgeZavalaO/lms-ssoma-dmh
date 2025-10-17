import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpdateCourseProgressSchema, ChangeProgressStatusSchema, ExemptCollaboratorSchema } from "@/validations/progress";

// GET /api/progress/courses/[id] - Obtener progreso de curso
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const params = await props.params;
    const courseProgress = await prisma.courseProgress.findUnique({
      where: { id: params.id },
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true, dni: true },
        },
        course: {
          select: { id: true, code: true, name: true, validity: true },
        },
        certifications: {
          where: { isValid: true },
          orderBy: { issuedAt: "desc" },
        },
      },
    });

    if (!courseProgress) {
      return NextResponse.json(
        { error: "Progreso no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(courseProgress);
  } catch (error: any) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Error al obtener progreso" },
      { status: 500 }
    );
  }
}

// PUT /api/progress/courses/[id] - Actualizar progreso
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const validated = UpdateCourseProgressSchema.parse(body);

    const params = await props.params;

    const data: any = {};
    
    if (validated.progressPercent !== undefined) {
      data.progressPercent = validated.progressPercent;
      
      // Auto-actualizar estado basado en progreso
      if (validated.progressPercent === 100 && !data.status) {
        data.status = "IN_PROGRESS"; // Completado pero aún no aprobado
        data.completedAt = new Date();
      } else if (validated.progressPercent > 0 && validated.progressPercent < 100) {
        if (!data.status) data.status = "IN_PROGRESS";
      }
    }

    if (validated.timeSpent !== undefined) {
      data.timeSpent = validated.timeSpent;
    }

    if (validated.status) {
      data.status = validated.status;
      
      // Actualizar fechas según estado
      const now = new Date();
      switch (validated.status) {
        case "IN_PROGRESS":
          if (!data.startedAt) data.startedAt = now;
          break;
        case "PASSED":
          data.passedAt = now;
          if (!data.completedAt) data.completedAt = now;
          break;
        case "FAILED":
          data.failedAt = now;
          break;
        case "EXEMPTED":
          data.exemptedAt = now;
          break;
      }
    }

    data.lastActivityAt = new Date();

    const progress = await prisma.courseProgress.update({
      where: { id: params.id },
      data,
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true },
        },
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar progreso" },
      { status: 500 }
    );
  }
}

// DELETE /api/progress/courses/[id] - Eliminar progreso
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.role || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const params = await props.params;
    await prisma.courseProgress.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting progress:", error);
    return NextResponse.json(
      { error: "Error al eliminar progreso" },
      { status: 500 }
    );
  }
}
