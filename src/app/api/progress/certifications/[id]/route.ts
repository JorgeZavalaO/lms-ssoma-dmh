import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/progress/certifications/[id] - Obtener certificación
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
    const certification = await prisma.certificationRecord.findUnique({
      where: { id: params.id },
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true, dni: true },
        },
        course: {
          select: { id: true, code: true, name: true },
        },
        courseProgress: {
          select: { progressPercent: true, completedAt: true },
        },
        previousCert: {
          select: {
            id: true,
            certificateNumber: true,
            issuedAt: true,
            expiresAt: true,
          },
        },
        nextCerts: {
          select: {
            id: true,
            certificateNumber: true,
            issuedAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!certification) {
      return NextResponse.json(
        { error: "Certificación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(certification);
  } catch (error: any) {
    console.error("Error fetching certification:", error);
    return NextResponse.json(
      { error: "Error al obtener certificación" },
      { status: 500 }
    );
  }
}
