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
    const requestedCollaboratorId = searchParams.get("collaboratorId");
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");

    let collaboratorId = requestedCollaboratorId;
    if (session.user.role === "COLLABORATOR") {
      if (!session.user.collaboratorId) {
        return NextResponse.json({ error: "Usuario sin colaborador asociado" }, { status: 400 });
      }
      if (requestedCollaboratorId && requestedCollaboratorId !== session.user.collaboratorId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      collaboratorId = session.user.collaboratorId;
    }

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
          select: {
            id: true,
            code: true,
            name: true,
            validity: true,
            units: {
              select: {
                _count: { select: { lessons: true } },
              },
            },
          },
        },
        certifications: {
          where: { isValid: true },
          orderBy: { issuedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const courseIds = progressData.map((p) => p.courseId);

    // Obtener conteos en paralelo
    const [completedLessonsRaw, passedQuizzesRaw, totalQuizzesRaw] = await Promise.all([
      // Lecciones completadas por colaborador en cada curso
      collaboratorId
        ? prisma.lessonProgress.findMany({
            where: {
              collaboratorId,
              completed: true,
              lesson: { unit: { courseId: { in: courseIds } } },
            },
            select: { lesson: { select: { unit: { select: { courseId: true } } } } },
          })
        : Promise.resolve([]),

      // Quizzes aprobados (un intento PASSED distinto por quiz)
      collaboratorId
        ? prisma.quizAttempt.findMany({
            where: {
              collaboratorId,
              status: "PASSED",
              quiz: {
                OR: [
                  { courseId: { in: courseIds } },
                  { unit: { courseId: { in: courseIds } } },
                ],
              },
            },
            select: { quizId: true, quiz: { select: { courseId: true, unit: { select: { courseId: true } } } } },
            distinct: ["quizId"],
          })
        : Promise.resolve([]),

      // Total de quizzes publicados por curso
      prisma.quiz.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { courseId: { in: courseIds } },
            { unit: { courseId: { in: courseIds } } },
          ],
        },
        select: { courseId: true, unit: { select: { courseId: true } } },
      }),
    ]);

    // Mapas de conteo por courseId
    const lessonsCompletedMap: Record<string, number> = {};
    for (const lp of completedLessonsRaw) {
      const cId = lp.lesson.unit.courseId;
      lessonsCompletedMap[cId] = (lessonsCompletedMap[cId] || 0) + 1;
    }

    const quizzesPassedMap: Record<string, number> = {};
    for (const qa of passedQuizzesRaw) {
      const cId = qa.quiz.courseId ?? qa.quiz.unit?.courseId;
      if (cId) quizzesPassedMap[cId] = (quizzesPassedMap[cId] || 0) + 1;
    }

    const totalQuizzesMap: Record<string, number> = {};
    for (const q of totalQuizzesRaw) {
      const cId = q.courseId ?? q.unit?.courseId;
      if (cId) totalQuizzesMap[cId] = (totalQuizzesMap[cId] || 0) + 1;
    }

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
      totalLessons: p.course.units.reduce((sum, u) => sum + u._count.lessons, 0),
      lessonsCompleted: lessonsCompletedMap[p.courseId] || 0,
      totalQuizzes: totalQuizzesMap[p.courseId] || 0,
      quizzesCompleted: quizzesPassedMap[p.courseId] || 0,
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
