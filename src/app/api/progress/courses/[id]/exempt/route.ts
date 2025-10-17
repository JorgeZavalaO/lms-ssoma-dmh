import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExemptCollaboratorSchema } from "@/validations/progress";

// POST /api/progress/courses/[id]/exempt - Exonerar colaborador de un curso
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.role || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    
    if (!body.exemptionReason) {
      return NextResponse.json(
        { error: "Se requiere una razón de exoneración" },
        { status: 400 }
      );
    }

    const params = await props.params;
    const progress = await prisma.courseProgress.update({
      where: { id: params.id },
      data: {
        status: "EXEMPTED",
        exemptedAt: new Date(),
        exemptionReason: body.exemptionReason,
        exemptedBy: session.user.id,
        lastActivityAt: new Date(),
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

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error("Error exempting collaborator:", error);
    return NextResponse.json(
      { error: "Error al exonerar colaborador" },
      { status: 500 }
    );
  }
}
