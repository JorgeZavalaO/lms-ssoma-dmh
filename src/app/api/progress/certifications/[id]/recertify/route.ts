import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/progress/certifications/[id]/recertify - Crear recertificación
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
    const { courseProgressId } = body;

    if (!courseProgressId) {
      return NextResponse.json(
        { error: "courseProgressId es requerido" },
        { status: 400 }
      );
    }

    const params = await props.params;
    // Obtener certificación anterior
    const previousCert = await prisma.certificationRecord.findUnique({
      where: { id: params.id },
      include: {
        course: true,
      },
    });

    if (!previousCert) {
      return NextResponse.json(
        { error: "Certificación anterior no encontrada" },
        { status: 404 }
      );
    }

    // Obtener nuevo progreso
    const courseProgress = await prisma.courseProgress.findUnique({
      where: { id: courseProgressId },
    });

    if (!courseProgress) {
      return NextResponse.json(
        { error: "Progreso de curso no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que sea el mismo curso y colaborador
    if (
      courseProgress.courseId !== previousCert.courseId ||
      courseProgress.collaboratorId !== previousCert.collaboratorId
    ) {
      return NextResponse.json(
        { error: "El progreso no corresponde al mismo curso/colaborador" },
        { status: 400 }
      );
    }

    // Generar número de certificado único
    const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calcular fecha de expiración
    let expiresAt = null;
    if (previousCert.course.validity) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + previousCert.course.validity);
    }

    const newCertification = await prisma.certificationRecord.create({
      data: {
        courseProgressId,
        collaboratorId: courseProgress.collaboratorId,
        courseId: courseProgress.courseId,
        certificateNumber: certNumber,
        expiresAt,
        isRecertification: true,
        previousCertId: params.id,
        certificateData: previousCert.certificateData as any,
      },
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true },
        },
        course: {
          select: { id: true, code: true, name: true, validity: true },
        },
        previousCert: {
          select: { id: true, certificateNumber: true, issuedAt: true },
        },
      },
    });

    // Transformar datos al formato esperado por el cliente
    const nameParts = newCertification.collaborator.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const transformedCertification = {
      id: newCertification.id,
      collaborator: {
        id: newCertification.collaborator.id,
        firstName,
        lastName,
        email: newCertification.collaborator.email,
      },
      course: {
        id: newCertification.course.id,
        name: newCertification.course.name,
        code: newCertification.course.code,
        validityMonths: newCertification.course.validity,
      },
      issuedAt: newCertification.issuedAt,
      expiresAt: newCertification.expiresAt,
      revokedAt: newCertification.revokedAt,
      revokedBy: newCertification.revokedBy,
      revocationReason: newCertification.revocationReason,
    };

    // Actualizar progreso con fecha de certificación
    await prisma.courseProgress.update({
      where: { id: courseProgressId },
      data: {
        certifiedAt: new Date(),
        status: "PASSED",
      },
    });

    return NextResponse.json(transformedCertification, { status: 201 });
  } catch (error: any) {
    console.error("Error creating recertification:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear recertificación" },
      { status: 500 }
    );
  }
}
