import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateCertificationSchema, RevokeCertificationSchema } from "@/validations/progress";

// GET /api/progress/certifications - Listar certificaciones
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collaboratorId = searchParams.get("collaboratorId");
    const courseId = searchParams.get("courseId");
    const isValid = searchParams.get("isValid");

    const where: any = {};
    if (collaboratorId) where.collaboratorId = collaboratorId;
    if (courseId) where.courseId = courseId;
    if (isValid !== null) where.isValid = isValid === "true";

    const certifications = await prisma.certificationRecord.findMany({
      where,
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true, dni: true },
        },
        course: {
          select: { id: true, code: true, name: true },
        },
        previousCert: {
          select: { id: true, certificateNumber: true, issuedAt: true },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json(certifications);
  } catch (error: any) {
    console.error("Error fetching certifications:", error);
    return NextResponse.json(
      { error: "Error al obtener certificaciones" },
      { status: 500 }
    );
  }
}

// POST /api/progress/certifications - Crear certificación
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.role || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const validated = CreateCertificationSchema.parse(body);

    // Obtener progreso del curso
    const courseProgress = await prisma.courseProgress.findUnique({
      where: { id: validated.courseProgressId },
      include: {
        course: true,
      },
    });

    if (!courseProgress) {
      return NextResponse.json(
        { error: "Progreso de curso no encontrado" },
        { status: 404 }
      );
    }

    // Generar número de certificado único
    const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calcular fecha de expiración si el curso tiene validez
    let expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null;
    if (!expiresAt && courseProgress.course.validity) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + courseProgress.course.validity);
    }

    const certification = await prisma.certificationRecord.create({
      data: {
        courseProgressId: validated.courseProgressId,
        collaboratorId: courseProgress.collaboratorId,
        courseId: courseProgress.courseId,
        certificateNumber: certNumber,
        expiresAt,
        isRecertification: validated.isRecertification || false,
        previousCertId: validated.previousCertId,
        certificateData: validated.certificateData as any,
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

    // Actualizar progreso con fecha de certificación
    await prisma.courseProgress.update({
      where: { id: validated.courseProgressId },
      data: {
        certifiedAt: new Date(),
        status: "PASSED",
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error: any) {
    console.error("Error creating certification:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear certificación" },
      { status: 500 }
    );
  }
}
