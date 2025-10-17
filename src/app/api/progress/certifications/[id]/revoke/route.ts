import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RevokeCertificationSchema } from "@/validations/progress";

// POST /api/progress/certifications/[id]/revoke - Revocar certificación
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
    const validated = RevokeCertificationSchema.parse(body);

    const params = await props.params;
    const certification = await prisma.certificationRecord.findUnique({
      where: { id: params.id },
    });

    if (!certification) {
      return NextResponse.json(
        { error: "Certificación no encontrada" },
        { status: 404 }
      );
    }

    if (certification.revokedAt) {
      return NextResponse.json(
        { error: "Certificación ya revocada" },
        { status: 400 }
      );
    }

    const updated = await prisma.certificationRecord.update({
      where: { id: params.id },
      data: {
        revokedAt: new Date(),
        revocationReason: validated.revocationReason,
        isValid: false,
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
    console.error("Error revoking certification:", error);
    return NextResponse.json(
      { error: error.message || "Error al revocar certificación" },
      { status: 500 }
    );
  }
}
