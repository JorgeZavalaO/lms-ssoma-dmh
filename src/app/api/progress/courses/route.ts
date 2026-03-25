import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpdateCourseProgressSchema, ChangeProgressStatusSchema } from "@/validations/progress";
import {
  requireStaff,
  resolveCollaboratorScope,
} from "@/lib/authorization";
import { mapProgressStatusForClient } from "@/lib/progress-status";

// GET /api/progress/courses - Obtener progresos de cursos con paginación server-side
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
    const search = searchParams.get("search")?.trim() || "";
    const exportAll = searchParams.get("export") === "true";

    // Paginación
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const scope = resolveCollaboratorScope(session, requestedCollaboratorId);
    if (!scope.ok) return scope.response;
    const collaboratorId = scope.collaboratorId;

    // Where base sin search (para stats globales del scope)
    const scopeWhere: Record<string, unknown> = {};
    if (collaboratorId) scopeWhere.collaboratorId = collaboratorId;
    if (courseId) scopeWhere.courseId = courseId;

    // Where completo con search + status (para datos paginados y total count)
    const fullWhere: Record<string, unknown> = { ...scopeWhere };
    if (status && status !== "all") {
      // mapear estado cliente → estado Prisma si es necesario
      fullWhere.status = status;
    }
    if (search) {
      fullWhere.OR = [
        { collaborator: { fullName: { contains: search, mode: "insensitive" } } },
        { collaborator: { email: { contains: search, mode: "insensitive" } } },
        { collaborator: { dni: { contains: search, mode: "insensitive" } } },
        { course: { name: { contains: search, mode: "insensitive" } } },
        { course: { code: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Stats globales del scope (sin filtro de búsqueda ni status para mostrar totales reales)
    const [statsGroups, total, progressData] = await Promise.all([
      prisma.courseProgress.groupBy({
        by: ["status"],
        where: scopeWhere,
        _count: { _all: true },
      }),
      prisma.courseProgress.count({ where: fullWhere }),
      prisma.courseProgress.findMany({
        where: fullWhere,
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
        ...(exportAll ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
      }),
    ]);

    // Calcular stats desde groupBy
    const statusCountMap: Record<string, number> = {};
    for (const g of statsGroups) {
      statusCountMap[g.status] = g._count._all;
    }
    const totalFromScope = Object.values(statusCountMap).reduce((a, b) => a + b, 0);
    const stats = {
      total: totalFromScope,
      inProgress: (statusCountMap["IN_PROGRESS"] || 0) + (statusCountMap["PENDING_EVALUATION"] || 0),
      completed: (statusCountMap["PASSED"] || 0) + (statusCountMap["EXEMPTED"] || 0),
      notStarted: statusCountMap["NOT_STARTED"] || 0,
      failed: statusCountMap["FAILED"] || 0,
      exempt: statusCountMap["EXEMPTED"] || 0,
      expired: 0, // calculado abajo si es necesario
    };

    const courseIds = progressData.map((p) => p.courseId);

    // Obtener conteos solo para los courseIds de la página actual
    const [completedLessonsRaw, passedQuizzesRaw, totalQuizzesRaw] = await Promise.all([
      collaboratorId && courseIds.length > 0
        ? prisma.lessonProgress.findMany({
            where: {
              collaboratorId,
              completed: true,
              lesson: { unit: { courseId: { in: courseIds } } },
            },
            select: { lesson: { select: { unit: { select: { courseId: true } } } } },
          })
        : Promise.resolve([]),

      collaboratorId && courseIds.length > 0
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

      courseIds.length > 0
        ? prisma.quiz.findMany({
            where: {
              status: "PUBLISHED",
              OR: [
                { courseId: { in: courseIds } },
                { unit: { courseId: { in: courseIds } } },
              ],
            },
            select: { courseId: true, unit: { select: { courseId: true } } },
          })
        : Promise.resolve([]),
    ]);

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

    const now = new Date();
    const progress = progressData.map(p => {
      const clientStatus = mapProgressStatusForClient(p.status);
      // Calcular expired dinámicamente según expiresAt
      const isExpired = p.expiresAt && p.expiresAt < now && p.status !== "FAILED";
      return {
        id: p.id,
        collaborator: {
          id: p.collaborator.id,
          firstName: p.collaborator.fullName.split(" ")[0] || "",
          lastName: p.collaborator.fullName.split(" ").slice(1).join(" ") || "",
          email: p.collaborator.email,
          dni: p.collaborator.dni,
        },
        course: {
          id: p.course.id,
          code: p.course.code,
          name: p.course.name,
        },
        status: isExpired ? "EXPIRED" : clientStatus,
        progress: p.progressPercent,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
        exemptReason: p.exemptionReason,
        certified: p.certifications.length > 0,
        totalLessons: p.course.units.reduce((sum, u) => sum + u._count.lessons, 0),
        lessonsCompleted: lessonsCompletedMap[p.courseId] || 0,
        totalQuizzes: totalQuizzesMap[p.courseId] || 0,
        quizzesCompleted: quizzesPassedMap[p.courseId] || 0,
      };
    });

    return NextResponse.json({
      progress,
      total,
      page: exportAll ? 1 : page,
      pageSize: exportAll ? total : pageSize,
      stats,
    });
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
    const authError = requireStaff(session);
    if (authError) return authError;

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
