import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpdateCourseProgressSchema, ChangeProgressStatusSchema } from "@/validations/progress";

// GET /api/progress/courses - Obtener todos los progresos de cursos
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collaboratorId = searchParams.get("collaboratorId");
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");

    const where: any = {};
    if (collaboratorId) where.collaboratorId = collaboratorId;
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;

    const progressData = await prisma.courseProgress.findMany({
      where,
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
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transformar los datos para que coincidan con lo que espera el cliente
    const progress = progressData.map(p => ({
      id: p.id,
      collaborator: {
        id: p.collaborator.id,
        firstName: p.collaborator.fullName.split(' ')[0] || '',
        lastName: p.collaborator.fullName.split(' ').slice(1).join(' ') || '',
        email: p.collaborator.email,
        dni: p.collaborator.dni,
      },
      course: {
        id: p.course.id,
        code: p.course.code,
        name: p.course.name,
      },
      status: p.status === 'PASSED' ? 'COMPLETED' : p.status === 'EXEMPTED' ? 'EXEMPT' : p.status,
      progress: p.progressPercent,
      startedAt: p.startedAt,
      completedAt: p.completedAt,
      exemptReason: p.exemptionReason,
      certified: p.certifications.length > 0,
    }));

    return NextResponse.json({ progress });
  } catch (error: any) {
    console.error("Error fetching course progress:", error);
    return NextResponse.json(
      { error: "Error al obtener progreso" },
      { status: 500 }
    );
  }
}

// POST /api/progress/courses - Crear o inicializar progreso de curso
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { collaboratorId, courseId, enrollmentId } = body;

    if (!collaboratorId || !courseId) {
      return NextResponse.json(
        { error: "collaboratorId y courseId son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe progreso
    const existing = await prisma.courseProgress.findUnique({
      where: {
        collaboratorId_courseId: {
          collaboratorId,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "El progreso ya existe para este curso y colaborador" },
        { status: 409 }
      );
    }

    // Obtener info del curso para calcular expiración
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { validity: true },
    });

    let expiresAt = null;
    if (course?.validity) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + course.validity);
    }

    const progress = await prisma.courseProgress.create({
      data: {
        collaboratorId,
        courseId,
        enrollmentId: enrollmentId || undefined,
        status: "NOT_STARTED",
        progressPercent: 0,
        timeSpent: 0,
        expiresAt,
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

    return NextResponse.json(progress, { status: 201 });
  } catch (error: any) {
    console.error("Error creating course progress:", error);
    return NextResponse.json(
      { error: "Error al crear progreso" },
      { status: 500 }
    );
  }
}
