import { prisma } from "@/lib/prisma";
import { AttemptStatus, ProgressStatus, type Prisma } from "@prisma/client";
import { addDays, startOfDay, endOfDay, subDays } from "date-fns";

// ====================================
// J1 - Dashboard Ejecutivo con KPIs
// ====================================

export interface DashboardKPIs {
  // KPIs globales
  totalCollaborators: number;
  totalCourses: number;
  totalEnrollments: number;

  // Cumplimiento
  overallCompliance: number; // %
  complianceByArea: Record<string, number>;

  // Alertas
  expiringIn7Days: number;
  expiringIn30Days: number;
  expired: number;

  // Evaluaciones
  avgAttempts: number;
  avgScore: number;
  passRate: number;

  // Engagement
  activeUsers: number;
  coursesInProgress: number;
  coursesCompleted: number;

  // Tendencias (últimos 30 días)
  enrollmentsTrend: Array<{ date: string; count: number }>;
  completionsTrend: Array<{ date: string; count: number }>;

  // Top cursos
  topCriticalCourses: Array<{
    courseId: string;
    courseName: string;
    expiringCount: number;
    expiredCount: number;
  }>;
}

export async function getDashboardKPIs(filters?: {
  startDate?: Date;
  endDate?: Date;
  areaId?: string;
  siteId?: string;
}): Promise<DashboardKPIs> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sevenDaysFromNow = addDays(now, 7);
  const thirtyDaysFromNow = addDays(now, 30);

  // Filtros de colaboradores
  const collaboratorWhere = {
    status: "ACTIVE" as const,
    ...(filters?.areaId && { areaId: filters.areaId }),
    ...(filters?.siteId && { siteId: filters.siteId }),
  };

  // 1. KPIs globales
  const totalCollaborators = await prisma.collaborator.count({
    where: collaboratorWhere,
  });

  const totalCourses = await prisma.course.count({
    where: { status: "PUBLISHED" },
  });

  const totalEnrollments = await prisma.enrollment.count({
    where: {
      collaborator: collaboratorWhere,
      ...(filters?.startDate && { enrolledAt: { gte: filters.startDate } }),
      ...(filters?.endDate && { enrolledAt: { lte: filters.endDate } }),
    },
  });

  // 2. Cumplimiento
  const progressRecords = await prisma.courseProgress.findMany({
    where: {
      collaborator: collaboratorWhere,
      expiresAt: { not: null },
    },
    include: {
      collaborator: {
        include: {
          area: true,
        },
      },
      enrollment: {
        include: {
          collaborator: {
            include: {
              area: true,
            },
          },
        },
      },
    },
  });

  const compliantCount = progressRecords.filter(
    (p) =>
      ["PASSED", "EXEMPTED"].includes(p.status) &&
      (!p.expiresAt || p.expiresAt > now),
  ).length;

  const overallCompliance =
    progressRecords.length > 0
      ? (compliantCount / progressRecords.length) * 100
      : 0;

  // Cumplimiento por área
  const complianceByArea: Record<string, number> = {};
  const progressByArea = progressRecords.reduce(
    (acc, p) => {
      if (!p.enrollment) return acc;
      const areaName = p.enrollment.collaborator.area?.name || "Sin área";
      if (!acc[areaName]) {
        acc[areaName] = { total: 0, compliant: 0 };
      }
      acc[areaName].total++;
      if (
        ["PASSED", "EXEMPTED"].includes(p.status) &&
        (!p.expiresAt || p.expiresAt > now)
      ) {
        acc[areaName].compliant++;
      }
      return acc;
    },
    {} as Record<string, { total: number; compliant: 0 }>,
  );

  Object.entries(progressByArea).forEach(([area, data]) => {
    complianceByArea[area] = (data.compliant / data.total) * 100;
  });

  // 3. Alertas de vencimiento
  const expiringIn7Days = await prisma.courseProgress.count({
    where: {
      collaborator: collaboratorWhere,
      status: { in: ["IN_PROGRESS", "PASSED", "EXEMPTED"] },
      expiresAt: { gte: now, lte: sevenDaysFromNow },
    },
  });

  const expiringIn30Days = await prisma.courseProgress.count({
    where: {
      collaborator: collaboratorWhere,
      status: { in: ["IN_PROGRESS", "PASSED", "EXEMPTED"] },
      expiresAt: { gte: sevenDaysFromNow, lte: thirtyDaysFromNow },
    },
  });

  const expired = await prisma.courseProgress.count({
    where: {
      collaborator: collaboratorWhere,
      OR: [
        { status: "EXPIRED" },
        {
          status: { in: ["IN_PROGRESS", "PASSED", "EXEMPTED"] },
          expiresAt: { lt: now },
        },
      ],
    },
  });

  // 4. Evaluaciones
  // Primero obtengo los IDs de colaboradores que cumplen con los filtros
  const collaborators = await prisma.collaborator.findMany({
    where: collaboratorWhere,
    select: { id: true },
  });
  const collaboratorIds = collaborators.map((c) => c.id);

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      collaboratorId: { in: collaboratorIds },
      status: { in: ["GRADED", "PASSED", "FAILED"] },
      ...(filters?.startDate && { submittedAt: { gte: filters.startDate } }),
      ...(filters?.endDate && { submittedAt: { lte: filters.endDate } }),
    },
    select: {
      score: true,
      status: true,
    },
  });

  const avgAttempts = attempts.length / (totalCollaborators || 1);
  const avgScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
      : 0;
  const passedCount = attempts.filter((a) => a.status === "PASSED").length;
  const passRate =
    attempts.length > 0 ? (passedCount / attempts.length) * 100 : 0;

  // 5. Engagement
  const activeUsers = await prisma.collaborator.count({
    where: {
      ...collaboratorWhere,
      courseProgress: {
        some: {
          lastActivityAt: { gte: thirtyDaysAgo },
        },
      },
    },
  });

  const coursesInProgress = await prisma.courseProgress.count({
    where: {
      collaborator: collaboratorWhere,
      status: "IN_PROGRESS",
    },
  });

  const coursesCompleted = await prisma.courseProgress.count({
    where: {
      collaborator: collaboratorWhere,
      status: { in: ["PASSED", "EXEMPTED"] },
      ...(filters?.startDate && { passedAt: { gte: filters.startDate } }),
      ...(filters?.endDate && { passedAt: { lte: filters.endDate } }),
    },
  });

  // 6. Tendencias (últimos 30 días)
  const recentEnrollments = await prisma.enrollment.findMany({
    where: {
      collaborator: collaboratorWhere,
      enrolledAt: { gte: thirtyDaysAgo },
    },
    select: {
      enrolledAt: true,
    },
  });

  const recentCompletions = await prisma.courseProgress.findMany({
    where: {
      collaborator: collaboratorWhere,
      status: { in: ["PASSED", "EXEMPTED"] },
      passedAt: { gte: thirtyDaysAgo, not: null },
    },
    select: {
      passedAt: true,
    },
  });

  // Agrupar por fecha en memoria
  const enrollmentsByDate = recentEnrollments.reduce(
    (acc, e) => {
      const date = e.enrolledAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const completionsByDate = recentCompletions.reduce(
    (acc, c) => {
      if (c.passedAt) {
        const date = c.passedAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const enrollmentsTrend = Object.entries(enrollmentsByDate).map(
    ([date, count]) => ({ date, count }),
  );

  const completionsTrend = Object.entries(completionsByDate).map(
    ([date, count]) => ({ date, count }),
  );

  // 7. Top cursos críticos (cursos con validez/vigencia)
  const topCriticalCourses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      validity: { not: null },
    },
    select: {
      id: true,
      name: true,
      enrollments: {
        where: {
          collaborator: collaboratorWhere,
        },
        select: {
          id: true,
        },
      },
    },
    take: 10, // Traigo 10 para luego ordenar y tomar 5
  });

  // Ahora obtengo el progreso para cada curso
  const criticalCoursesData = await Promise.all(
    topCriticalCourses.map(async (course) => {
      const progressRecords = await prisma.courseProgress.findMany({
        where: {
          courseId: course.id,
          collaborator: collaboratorWhere,
        },
        select: {
          status: true,
          expiresAt: true,
        },
      });

      const expiringCount = progressRecords.filter(
        (p) =>
          p.expiresAt && p.expiresAt > now && p.expiresAt <= thirtyDaysFromNow,
      ).length;

      const expiredCount = progressRecords.filter(
        (p) =>
          p.status === "EXPIRED" ||
          Boolean(
            p.expiresAt &&
            p.expiresAt < now &&
            ["PASSED", "EXEMPTED", "IN_PROGRESS"].includes(p.status),
          ),
      ).length;

      return {
        courseId: course.id,
        courseName: course.name,
        totalEnrollments: course.enrollments.length,
        expiringCount,
        expiredCount,
        criticalScore: expiredCount * 2 + expiringCount,
      };
    }),
  );

  // Ordenar por criticidad y tomar top 5
  const sortedCriticalCourses = criticalCoursesData
    .sort((a, b) => b.criticalScore - a.criticalScore)
    .slice(0, 5);

  return {
    totalCollaborators,
    totalCourses,
    totalEnrollments,
    overallCompliance,
    complianceByArea,
    expiringIn7Days,
    expiringIn30Days,
    expired,
    avgAttempts,
    avgScore,
    passRate,
    activeUsers,
    coursesInProgress,
    coursesCompleted,
    enrollmentsTrend,
    completionsTrend,
    topCriticalCourses: sortedCriticalCourses,
  };
}

// ====================================
// J2 - Reporte por Área
// ====================================

export interface AreaReportRecord {
  collaboratorId: string;
  dni: string;
  fullName: string;
  email: string;
  site: string | null;
  area: string | null;
  position: string | null;
  courseId: string;
  courseName: string;
  status: string;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  score: number | null;
}

export async function getAreaReport(filters: {
  areaId?: string;
  siteId?: string;
  positionId?: string;
  collaboratorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  courseId?: string;
}): Promise<AreaReportRecord[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: {
        not: null,
      },
      ...(filters.courseId && { courseId: filters.courseId }),
      collaborator: {
        status: "ACTIVE",
        ...(filters.collaboratorId && { id: filters.collaboratorId }),
        ...(filters.areaId && { areaId: filters.areaId }),
        ...(filters.siteId && { siteId: filters.siteId }),
        ...(filters.positionId && { positionId: filters.positionId }),
      },
      ...(filters.startDate && {
        enrolledAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && {
        enrolledAt: { lte: new Date(filters.endDate) },
      }),
    },
    include: {
      collaborator: {
        include: {
          site: true,
          area: true,
          position: true,
        },
      },
      course: true,
    },
  });

  const collaboratorIds = Array.from(
    new Set(enrollments.map((enrollment) => enrollment.collaboratorId)),
  );
  const courseIds = Array.from(
    new Set(
      enrollments
        .map((enrollment) => enrollment.courseId)
        .filter((courseId): courseId is string => Boolean(courseId)),
    ),
  );

  const [progressRecords, attempts] = await Promise.all([
    prisma.courseProgress.findMany({
      where: {
        collaboratorId: { in: collaboratorIds },
        courseId: { in: courseIds },
      },
      select: {
        collaboratorId: true,
        courseId: true,
        status: true,
        progressPercent: true,
        startedAt: true,
        completedAt: true,
        expiresAt: true,
      },
    }),
    prisma.quizAttempt.findMany({
      where: {
        collaboratorId: { in: collaboratorIds },
        status: { in: ["GRADED", "PASSED", "FAILED", "SUBMITTED"] },
        quiz: {
          OR: [
            { courseId: { in: courseIds } },
            { unit: { courseId: { in: courseIds } } },
          ],
        },
      },
      include: {
        quiz: {
          select: {
            courseId: true,
            unit: { select: { courseId: true } },
          },
        },
      },
      orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
    }),
  ]);

  const progressMap = new Map(
    progressRecords.map((progress) => [
      `${progress.collaboratorId}:${progress.courseId}`,
      progress,
    ]),
  );

  const latestAttemptScoreByCourse = new Map<string, number | null>();
  for (const attempt of attempts) {
    const attemptCourseId =
      attempt.quiz.courseId ?? attempt.quiz.unit?.courseId;
    if (!attemptCourseId) continue;

    const key = `${attempt.collaboratorId}:${attemptCourseId}`;
    if (!latestAttemptScoreByCourse.has(key)) {
      latestAttemptScoreByCourse.set(key, attempt.score);
    }
  }

  return enrollments
    .map((enrollment) => {
      const courseId = enrollment.course!.id;
      const progress = progressMap.get(
        `${enrollment.collaboratorId}:${courseId}`,
      );

      return {
        collaboratorId: enrollment.collaborator.id,
        dni: enrollment.collaborator.dni,
        fullName: enrollment.collaborator.fullName,
        email: enrollment.collaborator.email,
        site: enrollment.collaborator.site?.name || null,
        area: enrollment.collaborator.area?.name || null,
        position: enrollment.collaborator.position?.name || null,
        courseId,
        courseName: enrollment.course!.name,
        status: progress?.status || "NOT_STARTED",
        progress: progress?.progressPercent || 0,
        startedAt: progress?.startedAt || null,
        completedAt: progress?.completedAt || null,
        expiresAt: progress?.expiresAt || null,
        score:
          progress?.status && progress.status !== "NOT_STARTED"
            ? (latestAttemptScoreByCourse.get(
                `${enrollment.collaboratorId}:${courseId}`,
              ) ?? null)
            : null,
      };
    })
    .filter((record) => !filters.status || record.status === filters.status);
}

// ====================================
// J2b - Reporte por Usuario
// ====================================

const COMPLETED_PROGRESS_STATUSES: ProgressStatus[] = [
  ProgressStatus.PASSED,
  ProgressStatus.EXEMPTED,
];

const IN_PROGRESS_STATUSES: ProgressStatus[] = [
  ProgressStatus.IN_PROGRESS,
  ProgressStatus.PENDING_EVALUATION,
];

const EXPIRABLE_PROGRESS_STATUSES: ProgressStatus[] = [
  ProgressStatus.IN_PROGRESS,
  ProgressStatus.PASSED,
  ProgressStatus.EXEMPTED,
];

const FINAL_ATTEMPT_STATUSES: AttemptStatus[] = [
  AttemptStatus.GRADED,
  AttemptStatus.PASSED,
  AttemptStatus.FAILED,
];

const USER_REPORT_COLLABORATOR_SELECT = {
  id: true,
  dni: true,
  fullName: true,
  email: true,
  status: true,
  entryDate: true,
  site: { select: { id: true, name: true } },
  area: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
} satisfies Prisma.CollaboratorSelect;

const USER_REPORT_ENROLLMENT_SELECT = {
  id: true,
  collaboratorId: true,
  courseId: true,
  status: true,
  enrolledAt: true,
  startedAt: true,
  completedAt: true,
  course: {
    select: {
      id: true,
      code: true,
      name: true,
      duration: true,
    },
  },
  courseProgress: {
    select: {
      id: true,
      status: true,
      progressPercent: true,
      timeSpent: true,
      lastActivityAt: true,
      attended: true,
      startedAt: true,
      completedAt: true,
      passedAt: true,
      failedAt: true,
      expiresAt: true,
      certifiedAt: true,
    },
  },
} satisfies Prisma.EnrollmentSelect;

const USER_REPORT_ATTEMPT_SELECT = {
  id: true,
  collaboratorId: true,
  quizId: true,
  attemptNumber: true,
  status: true,
  score: true,
  pointsEarned: true,
  pointsTotal: true,
  timeSpent: true,
  startedAt: true,
  submittedAt: true,
  quiz: {
    select: {
      title: true,
      courseId: true,
      course: { select: { id: true, name: true } },
      unit: { select: { courseId: true } },
    },
  },
} satisfies Prisma.QuizAttemptSelect;

type UserReportCollaboratorRecord = Prisma.CollaboratorGetPayload<{
  select: typeof USER_REPORT_COLLABORATOR_SELECT;
}>;

type UserReportEnrollmentRecord = Prisma.EnrollmentGetPayload<{
  select: typeof USER_REPORT_ENROLLMENT_SELECT;
}>;

type UserReportAttemptRecord = Prisma.QuizAttemptGetPayload<{
  select: typeof USER_REPORT_ATTEMPT_SELECT;
}>;

export interface UserReportFilters {
  q?: string;
  areaId?: string;
  siteId?: string;
  positionId?: string;
  courseId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface UserReportKPIs {
  totalEnrollments: number;
  completedCourses: number;
  inProgressCourses: number;
  pendingCourses: number;
  expiredCourses: number;
  averageProgress: number;
  averageScore: number;
  passRate: number;
  reportedHours: number;
  openAlerts: number;
  validCertificates: number;
  lastActivityAt: Date | null;
}

export interface UserReportRecord {
  collaboratorId: string;
  dni: string;
  fullName: string;
  email: string;
  status: string;
  entryDate: Date;
  site: string | null;
  area: string | null;
  position: string | null;
  kpis: UserReportKPIs;
}

export interface UserReportSummary {
  totalUsers: number;
  usersOnPage: number;
  totalEnrollments: number;
  completedCourses: number;
  expiredCourses: number;
  averageProgress: number;
  averageScore: number;
  openAlerts: number;
}

export interface UserReportData {
  records: UserReportRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: UserReportSummary;
}

export interface UserReportCourseDetail {
  enrollmentId: string;
  courseId: string;
  courseCode: string | null;
  courseName: string;
  courseDuration: number | null;
  enrollmentStatus: string;
  enrolledAt: Date;
  progressStatus: string;
  effectiveStatus: string;
  progressPercent: number;
  startedAt: Date | null;
  completedAt: Date | null;
  passedAt: Date | null;
  expiresAt: Date | null;
  daysUntilExpiration: number | null;
  attended: boolean;
  reportedHours: number;
  bestScore: number | null;
  attemptsCount: number;
  latestAttemptStatus: string | null;
  lastActivityAt: Date | null;
}

export interface UserReportAttemptDetail {
  attemptId: string;
  courseId: string;
  courseName: string;
  quizId: string;
  quizTitle: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  pointsEarned: number | null;
  pointsTotal: number | null;
  timeSpent: number | null;
  startedAt: Date;
  submittedAt: Date | null;
}

export interface UserReportCertificationDetail {
  id: string;
  courseId: string;
  courseName: string;
  certificateNumber: string;
  issuedAt: Date;
  expiresAt: Date | null;
  isValid: boolean;
}

export interface UserReportAlertDetail {
  id: string;
  courseId: string;
  courseName: string;
  type: string;
  severity: number;
  title: string;
  dueDate: Date | null;
  triggeredAt: Date;
}

export interface UserReportDetail {
  collaborator: UserReportRecord;
  courses: UserReportCourseDetail[];
  attempts: UserReportAttemptDetail[];
  certifications: UserReportCertificationDetail[];
  alerts: UserReportAlertDetail[];
}

function roundTo(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildDateFilter(startDate?: string, endDate?: string) {
  const dateFilter: Prisma.DateTimeFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);
  return Object.keys(dateFilter).length > 0 ? dateFilter : undefined;
}

function isExpiredProgress(
  progress: UserReportEnrollmentRecord["courseProgress"],
  now: Date,
) {
  if (!progress) return false;
  return (
    progress.status === ProgressStatus.EXPIRED ||
    Boolean(
      progress.expiresAt &&
      progress.expiresAt < now &&
      EXPIRABLE_PROGRESS_STATUSES.includes(progress.status),
    )
  );
}

function buildEnrollmentStatusFilter(
  status: string,
  now: Date,
): Prisma.EnrollmentWhereInput {
  if (status === ProgressStatus.NOT_STARTED) {
    return {
      OR: [
        { courseProgress: { is: null } },
        { courseProgress: { is: { status: ProgressStatus.NOT_STARTED } } },
      ],
    };
  }

  if (status === ProgressStatus.EXPIRED) {
    return {
      OR: [
        { courseProgress: { is: { status: ProgressStatus.EXPIRED } } },
        {
          courseProgress: {
            is: {
              status: { in: EXPIRABLE_PROGRESS_STATUSES },
              expiresAt: { lt: now },
            },
          },
        },
      ],
    };
  }

  return {
    courseProgress: { is: { status: status as ProgressStatus } },
  };
}

function buildUserReportEnrollmentWhere(
  filters: UserReportFilters,
  now: Date,
): Prisma.EnrollmentWhereInput {
  const enrolledAt = buildDateFilter(filters.startDate, filters.endDate);
  const andFilters: Prisma.EnrollmentWhereInput[] = [];

  if (filters.status) {
    andFilters.push(buildEnrollmentStatusFilter(filters.status, now));
  }

  return {
    courseId: { not: null },
    ...(filters.courseId && { courseId: filters.courseId }),
    ...(enrolledAt && { enrolledAt }),
    ...(andFilters.length > 0 && { AND: andFilters }),
  };
}

function hasEnrollmentScopedFilters(filters: UserReportFilters) {
  return Boolean(
    filters.courseId || filters.status || filters.startDate || filters.endDate,
  );
}

function buildUserReportCollaboratorWhere(
  filters: UserReportFilters,
  now: Date,
): Prisma.CollaboratorWhereInput {
  const q = filters.q?.trim();

  return {
    status: "ACTIVE",
    ...(q && {
      OR: [
        { dni: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(filters.areaId && { areaId: filters.areaId }),
    ...(filters.siteId && { siteId: filters.siteId }),
    ...(filters.positionId && { positionId: filters.positionId }),
    ...(hasEnrollmentScopedFilters(filters) && {
      enrollments: {
        some: buildUserReportEnrollmentWhere(filters, now),
      },
    }),
  };
}

function groupByCollaborator<T extends { collaboratorId: string }>(items: T[]) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const current = grouped.get(item.collaboratorId);
    if (current) {
      current.push(item);
    } else {
      grouped.set(item.collaboratorId, [item]);
    }
  }
  return grouped;
}

function getAttemptCourseId(attempt: UserReportAttemptRecord) {
  return attempt.quiz.courseId ?? attempt.quiz.unit?.courseId ?? "";
}

function buildAttemptCourseKey(collaboratorId: string, courseId: string) {
  return `${collaboratorId}:${courseId}`;
}

function maxDate(current: Date | null, candidate?: Date | null) {
  if (!candidate) return current;
  if (!current || candidate > current) return candidate;
  return current;
}

function getReportedHours(enrollment: UserReportEnrollmentRecord) {
  const progress = enrollment.courseProgress;
  const courseDuration = enrollment.course?.duration ?? null;

  if (progress?.attended && courseDuration) {
    return courseDuration;
  }

  return (progress?.timeSpent ?? 0) / 3600;
}

function computeUserReportKPIs(params: {
  enrollments: UserReportEnrollmentRecord[];
  attempts: UserReportAttemptRecord[];
  openAlerts: number;
  validCertificates: number;
  now: Date;
}): UserReportKPIs {
  const { enrollments, attempts, now, openAlerts, validCertificates } = params;

  let completedCourses = 0;
  let inProgressCourses = 0;
  let pendingCourses = 0;
  let expiredCourses = 0;
  let progressTotal = 0;
  let reportedHours = 0;
  let lastActivityAt: Date | null = null;

  for (const enrollment of enrollments) {
    const progress = enrollment.courseProgress;
    const status = progress?.status ?? ProgressStatus.NOT_STARTED;

    if (COMPLETED_PROGRESS_STATUSES.includes(status)) {
      completedCourses += 1;
    }
    if (IN_PROGRESS_STATUSES.includes(status)) {
      inProgressCourses += 1;
    }
    if (!progress || status === ProgressStatus.NOT_STARTED) {
      pendingCourses += 1;
    }
    if (isExpiredProgress(progress, now)) {
      expiredCourses += 1;
    }

    progressTotal += progress?.progressPercent ?? 0;
    reportedHours += getReportedHours(enrollment);
    lastActivityAt = maxDate(lastActivityAt, progress?.lastActivityAt);
    lastActivityAt = maxDate(lastActivityAt, progress?.completedAt);
    lastActivityAt = maxDate(lastActivityAt, progress?.passedAt);
    lastActivityAt = maxDate(lastActivityAt, progress?.startedAt);
    lastActivityAt = maxDate(lastActivityAt, enrollment.enrolledAt);
  }

  const scoredAttempts = attempts.filter(
    (attempt) =>
      attempt.pointsEarned !== null && attempt.pointsEarned !== undefined,
  );
  const finalAttempts = attempts.filter((attempt) =>
    FINAL_ATTEMPT_STATUSES.includes(attempt.status),
  );

  const averageScore =
    scoredAttempts.length > 0
      ? scoredAttempts.reduce(
          (sum, attempt) => sum + (attempt.pointsEarned ?? 0),
          0,
        ) / scoredAttempts.length
      : 0;
  const passRate =
    finalAttempts.length > 0
      ? (finalAttempts.filter((attempt) => attempt.status === "PASSED").length /
          finalAttempts.length) *
        100
      : 0;

  return {
    totalEnrollments: enrollments.length,
    completedCourses,
    inProgressCourses,
    pendingCourses,
    expiredCourses,
    averageProgress:
      enrollments.length > 0
        ? roundTo(progressTotal / enrollments.length, 1)
        : 0,
    averageScore: roundTo(averageScore, 2),
    passRate: roundTo(passRate, 1),
    reportedHours: roundTo(reportedHours, 2),
    openAlerts,
    validCertificates,
    lastActivityAt,
  };
}

async function loadUserReportMetricInputs(
  collaboratorIds: string[],
  filters: UserReportFilters,
  now: Date,
) {
  if (collaboratorIds.length === 0) {
    return {
      enrollments: [] as UserReportEnrollmentRecord[],
      attempts: [] as UserReportAttemptRecord[],
      openAlertsByCollaborator: new Map<string, number>(),
      validCertificatesByCollaborator: new Map<string, number>(),
    };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      collaboratorId: { in: collaboratorIds },
      ...buildUserReportEnrollmentWhere(filters, now),
    },
    select: USER_REPORT_ENROLLMENT_SELECT,
    orderBy: { enrolledAt: "desc" },
  });

  const courseIds = Array.from(
    new Set(
      enrollments
        .map((enrollment) => enrollment.courseId)
        .filter((courseId): courseId is string => Boolean(courseId)),
    ),
  );

  if (courseIds.length === 0) {
    return {
      enrollments,
      attempts: [] as UserReportAttemptRecord[],
      openAlertsByCollaborator: new Map<string, number>(),
      validCertificatesByCollaborator: new Map<string, number>(),
    };
  }

  const [attempts, openAlerts, validCertificates] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: {
        collaboratorId: { in: collaboratorIds },
        status: { in: [...FINAL_ATTEMPT_STATUSES] },
        pointsEarned: { not: null },
        quiz: {
          OR: [
            { courseId: { in: courseIds } },
            { unit: { courseId: { in: courseIds } } },
          ],
        },
      },
      select: USER_REPORT_ATTEMPT_SELECT,
      orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
    }),
    prisma.progressAlert.findMany({
      where: {
        collaboratorId: { in: collaboratorIds },
        courseId: { in: courseIds },
        isRead: false,
        isDismissed: false,
      },
      select: { collaboratorId: true },
    }),
    prisma.certificationRecord.findMany({
      where: {
        collaboratorId: { in: collaboratorIds },
        courseId: { in: courseIds },
        isValid: true,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      select: { collaboratorId: true },
    }),
  ]);

  const openAlertsByCollaborator = new Map<string, number>();
  for (const alert of openAlerts) {
    openAlertsByCollaborator.set(
      alert.collaboratorId,
      (openAlertsByCollaborator.get(alert.collaboratorId) ?? 0) + 1,
    );
  }

  const validCertificatesByCollaborator = new Map<string, number>();
  for (const certification of validCertificates) {
    validCertificatesByCollaborator.set(
      certification.collaboratorId,
      (validCertificatesByCollaborator.get(certification.collaboratorId) ?? 0) +
        1,
    );
  }

  return {
    enrollments,
    attempts,
    openAlertsByCollaborator,
    validCertificatesByCollaborator,
  };
}

function buildUserReportRecord(params: {
  collaborator: UserReportCollaboratorRecord;
  enrollments: UserReportEnrollmentRecord[];
  attempts: UserReportAttemptRecord[];
  openAlerts: number;
  validCertificates: number;
  now: Date;
}): UserReportRecord {
  const {
    collaborator,
    enrollments,
    attempts,
    openAlerts,
    validCertificates,
    now,
  } = params;

  return {
    collaboratorId: collaborator.id,
    dni: collaborator.dni,
    fullName: collaborator.fullName,
    email: collaborator.email,
    status: collaborator.status,
    entryDate: collaborator.entryDate,
    site: collaborator.site?.name ?? null,
    area: collaborator.area?.name ?? null,
    position: collaborator.position?.name ?? null,
    kpis: computeUserReportKPIs({
      enrollments,
      attempts,
      openAlerts,
      validCertificates,
      now,
    }),
  };
}

function buildUserReportSummary(
  records: UserReportRecord[],
  totalUsers: number,
): UserReportSummary {
  const usersOnPage = records.length;
  const totalEnrollments = records.reduce(
    (sum, record) => sum + record.kpis.totalEnrollments,
    0,
  );
  const completedCourses = records.reduce(
    (sum, record) => sum + record.kpis.completedCourses,
    0,
  );
  const expiredCourses = records.reduce(
    (sum, record) => sum + record.kpis.expiredCourses,
    0,
  );
  const openAlerts = records.reduce(
    (sum, record) => sum + record.kpis.openAlerts,
    0,
  );
  const averageProgress =
    usersOnPage > 0
      ? records.reduce((sum, record) => sum + record.kpis.averageProgress, 0) /
        usersOnPage
      : 0;
  const scoredRecords = records.filter(
    (record) => record.kpis.averageScore > 0,
  );
  const averageScore =
    scoredRecords.length > 0
      ? scoredRecords.reduce(
          (sum, record) => sum + record.kpis.averageScore,
          0,
        ) / scoredRecords.length
      : 0;

  return {
    totalUsers,
    usersOnPage,
    totalEnrollments,
    completedCourses,
    expiredCourses,
    averageProgress: roundTo(averageProgress, 1),
    averageScore: roundTo(averageScore, 2),
    openAlerts,
  };
}

export async function getUserReport(
  filters: UserReportFilters = {},
): Promise<UserReportData> {
  const now = new Date();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const collaboratorWhere = buildUserReportCollaboratorWhere(filters, now);

  const [total, collaborators] = await Promise.all([
    prisma.collaborator.count({ where: collaboratorWhere }),
    prisma.collaborator.findMany({
      where: collaboratorWhere,
      select: USER_REPORT_COLLABORATOR_SELECT,
      orderBy: { fullName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const collaboratorIds = collaborators.map((collaborator) => collaborator.id);
  const {
    enrollments,
    attempts,
    openAlertsByCollaborator,
    validCertificatesByCollaborator,
  } = await loadUserReportMetricInputs(collaboratorIds, filters, now);

  const enrollmentsByCollaborator = groupByCollaborator(enrollments);
  const attemptsByCollaborator = groupByCollaborator(attempts);

  const records = collaborators.map((collaborator) =>
    buildUserReportRecord({
      collaborator,
      enrollments: enrollmentsByCollaborator.get(collaborator.id) ?? [],
      attempts: attemptsByCollaborator.get(collaborator.id) ?? [],
      openAlerts: openAlertsByCollaborator.get(collaborator.id) ?? 0,
      validCertificates:
        validCertificatesByCollaborator.get(collaborator.id) ?? 0,
      now,
    }),
  );

  return {
    records,
    total,
    page,
    pageSize,
    summary: buildUserReportSummary(records, total),
  };
}

function buildAttemptsByCourse(attempts: UserReportAttemptRecord[]) {
  const attemptsByCourse = new Map<string, UserReportAttemptRecord[]>();
  for (const attempt of attempts) {
    const courseId = getAttemptCourseId(attempt);
    if (!courseId) continue;

    const key = buildAttemptCourseKey(attempt.collaboratorId, courseId);
    const current = attemptsByCourse.get(key);
    if (current) {
      current.push(attempt);
    } else {
      attemptsByCourse.set(key, [attempt]);
    }
  }
  return attemptsByCourse;
}

function buildUserReportCourseDetails(params: {
  enrollments: UserReportEnrollmentRecord[];
  attempts: UserReportAttemptRecord[];
  now: Date;
}): UserReportCourseDetail[] {
  const { enrollments, attempts, now } = params;
  const attemptsByCourse = buildAttemptsByCourse(attempts);

  return enrollments.map((enrollment) => {
    const progress = enrollment.courseProgress;
    const progressStatus = progress?.status ?? ProgressStatus.NOT_STARTED;
    const expired = isExpiredProgress(progress, now);
    const courseAttempts = enrollment.courseId
      ? (attemptsByCourse.get(
          buildAttemptCourseKey(enrollment.collaboratorId, enrollment.courseId),
        ) ?? [])
      : [];
    const bestScore =
      courseAttempts.length > 0
        ? Math.max(
            ...courseAttempts.map((attempt) => attempt.pointsEarned ?? 0),
          )
        : null;
    const latestAttempt = courseAttempts[0] ?? null;
    const daysUntilExpiration = progress?.expiresAt
      ? Math.ceil(
          (progress.expiresAt.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId ?? "",
      courseCode: enrollment.course?.code ?? null,
      courseName: enrollment.course?.name ?? "Curso no encontrado",
      courseDuration: enrollment.course?.duration ?? null,
      enrollmentStatus: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      progressStatus,
      effectiveStatus: expired ? ProgressStatus.EXPIRED : progressStatus,
      progressPercent: progress?.progressPercent ?? 0,
      startedAt: progress?.startedAt ?? enrollment.startedAt,
      completedAt: progress?.completedAt ?? enrollment.completedAt,
      passedAt: progress?.passedAt ?? null,
      expiresAt: progress?.expiresAt ?? null,
      daysUntilExpiration,
      attended: progress?.attended ?? false,
      reportedHours: roundTo(getReportedHours(enrollment), 2),
      bestScore,
      attemptsCount: courseAttempts.length,
      latestAttemptStatus: latestAttempt?.status ?? null,
      lastActivityAt: progress?.lastActivityAt ?? null,
    };
  });
}

export async function getUserReportDetail(
  collaboratorId: string,
  filters: UserReportFilters = {},
): Promise<UserReportDetail> {
  const now = new Date();
  const collaborator = await prisma.collaborator.findFirst({
    where: {
      id: collaboratorId,
      status: "ACTIVE",
      ...(filters.areaId && { areaId: filters.areaId }),
      ...(filters.siteId && { siteId: filters.siteId }),
      ...(filters.positionId && { positionId: filters.positionId }),
    },
    select: USER_REPORT_COLLABORATOR_SELECT,
  });

  if (!collaborator) {
    throw new Error("Colaborador no encontrado");
  }

  const {
    enrollments,
    attempts,
    openAlertsByCollaborator,
    validCertificatesByCollaborator,
  } = await loadUserReportMetricInputs([collaboratorId], filters, now);
  const courseIds = Array.from(
    new Set(
      enrollments
        .map((enrollment) => enrollment.courseId)
        .filter((courseId): courseId is string => Boolean(courseId)),
    ),
  );

  const [certifications, alerts] =
    courseIds.length > 0
      ? await Promise.all([
          prisma.certificationRecord.findMany({
            where: {
              collaboratorId,
              courseId: { in: courseIds },
            },
            select: {
              id: true,
              courseId: true,
              certificateNumber: true,
              issuedAt: true,
              expiresAt: true,
              isValid: true,
              course: { select: { name: true } },
            },
            orderBy: { issuedAt: "desc" },
          }),
          prisma.progressAlert.findMany({
            where: {
              collaboratorId,
              courseId: { in: courseIds },
              isRead: false,
              isDismissed: false,
            },
            select: {
              id: true,
              courseId: true,
              type: true,
              severity: true,
              title: true,
              dueDate: true,
              triggeredAt: true,
              course: { select: { name: true } },
            },
            orderBy: [{ severity: "desc" }, { triggeredAt: "desc" }],
          }),
        ])
      : [[], []];

  const collaboratorRecord = buildUserReportRecord({
    collaborator,
    enrollments,
    attempts,
    openAlerts: openAlertsByCollaborator.get(collaboratorId) ?? 0,
    validCertificates: validCertificatesByCollaborator.get(collaboratorId) ?? 0,
    now,
  });

  return {
    collaborator: collaboratorRecord,
    courses: buildUserReportCourseDetails({ enrollments, attempts, now }),
    attempts: attempts.map((attempt) => {
      const courseId = getAttemptCourseId(attempt);
      return {
        attemptId: attempt.id,
        courseId,
        courseName: attempt.quiz.course?.name ?? "Curso no encontrado",
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        score: attempt.score,
        pointsEarned: attempt.pointsEarned,
        pointsTotal: attempt.pointsTotal,
        timeSpent: attempt.timeSpent,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      };
    }),
    certifications: certifications.map((certification) => ({
      id: certification.id,
      courseId: certification.courseId,
      courseName: certification.course.name,
      certificateNumber: certification.certificateNumber,
      issuedAt: certification.issuedAt,
      expiresAt: certification.expiresAt,
      isValid: certification.isValid,
    })),
    alerts: alerts.map((alert) => ({
      id: alert.id,
      courseId: alert.courseId,
      courseName: alert.course.name,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      dueDate: alert.dueDate,
      triggeredAt: alert.triggeredAt,
    })),
  };
}

// ====================================
// J3 - Reporte por Curso
// ====================================

export interface CourseReportData {
  course: {
    id: string;
    name: string;
    code: string;
    activeVersion: number | null;
  };
  statistics: {
    totalEnrolled: number;
    avgProgress: number;
    completionRate: number;
    passRate: number;
    avgScore: number;
    avgTime: number; // minutos
  };
  scoreDistribution: Array<{
    range: string; // "0-20", "21-40", etc.
    count: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
}

export async function getCourseReport(filters: {
  courseId: string;
  versionId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<CourseReportData> {
  const course = await prisma.course.findUnique({
    where: { id: filters.courseId },
  });

  if (!course) {
    throw new Error("Curso no encontrado");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: filters.courseId,
      ...(filters.startDate && {
        enrolledAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && {
        enrolledAt: { lte: new Date(filters.endDate) },
      }),
    },
  });

  const totalEnrolled = enrollments.length;
  const collaboratorIds = Array.from(
    new Set(enrollments.map((enrollment) => enrollment.collaboratorId)),
  );

  const [progressRecords, attempts] = await Promise.all([
    prisma.courseProgress.findMany({
      where: {
        collaboratorId: { in: collaboratorIds },
        courseId: filters.courseId,
      },
    }),
    prisma.quizAttempt.findMany({
      where: {
        collaboratorId: { in: collaboratorIds },
        status: { in: ["GRADED", "PASSED", "FAILED", "SUBMITTED"] },
        quiz: {
          OR: [
            { courseId: filters.courseId },
            { unit: { courseId: filters.courseId } },
          ],
        },
        ...(filters.startDate && {
          submittedAt: { gte: new Date(filters.startDate) },
        }),
        ...(filters.endDate && {
          submittedAt: { lte: new Date(filters.endDate) },
        }),
      },
      select: {
        collaboratorId: true,
        score: true,
        status: true,
        timeSpent: true,
        submittedAt: true,
        startedAt: true,
      },
      orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
    }),
  ]);

  const progressByCollaborator = new Map(
    progressRecords.map((progress) => [progress.collaboratorId, progress]),
  );
  const latestAttemptByCollaborator = new Map<
    string,
    (typeof attempts)[number]
  >();
  for (const attempt of attempts) {
    if (!latestAttemptByCollaborator.has(attempt.collaboratorId)) {
      latestAttemptByCollaborator.set(attempt.collaboratorId, attempt);
    }
  }

  const progressValues = enrollments.map(
    (enrollment) =>
      progressByCollaborator.get(enrollment.collaboratorId)?.progressPercent ||
      0,
  );
  const avgProgress =
    progressValues.length > 0
      ? progressValues.reduce((sum, value) => sum + value, 0) /
        progressValues.length
      : 0;

  const completedCount = enrollments.filter((enrollment) => {
    const status = progressByCollaborator.get(
      enrollment.collaboratorId,
    )?.status;
    return status === "PASSED" || status === "EXEMPTED";
  }).length;
  const completionRate =
    totalEnrolled > 0 ? (completedCount / totalEnrolled) * 100 : 0;

  const latestAttempts = Array.from(latestAttemptByCollaborator.values());
  const finalizedAttempts = latestAttempts.filter((attempt) =>
    ["GRADED", "PASSED", "FAILED"].includes(attempt.status),
  );
  const passRate =
    finalizedAttempts.length > 0
      ? (finalizedAttempts.filter((attempt) => attempt.status === "PASSED")
          .length /
          finalizedAttempts.length) *
        100
      : 0;

  const scoredAttempts = latestAttempts.filter(
    (attempt) => attempt.score !== null && attempt.score !== undefined,
  );
  const avgScore =
    scoredAttempts.length > 0
      ? scoredAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) /
        scoredAttempts.length
      : 0;

  const avgTime =
    progressRecords.length > 0
      ? progressRecords.reduce(
          (sum, progress) => sum + (progress.timeSpent || 0),
          0,
        ) /
        progressRecords.length /
        60
      : 0;

  // Distribución de calificaciones (simplificada sin lastScore)
  const scoreRanges = ["0-20", "21-40", "41-60", "61-80", "81-100"];
  const scoreDistribution = scoreRanges.map((range) => {
    const [minText, maxText] = range.split("-");
    const min = Number(minText);
    const max = Number(maxText);
    const count = scoredAttempts.filter((attempt) => {
      const score = attempt.score ?? -1;
      return score >= min && score <= max;
    }).length;
    return { range, count };
  });

  // Distribución de estados
  const statusCounts = enrollments.reduce(
    (acc, enrollment) => {
      const status =
        progressByCollaborator.get(enrollment.collaboratorId)?.status ||
        "NOT_STARTED";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statusDistribution = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
    }),
  );

  return {
    course: {
      id: course.id,
      name: course.name,
      code: course.code || "Sin código",
      activeVersion: course.currentVersion || null,
    },
    statistics: {
      totalEnrolled,
      avgProgress,
      completionRate,
      passRate,
      avgScore,
      avgTime,
    },
    scoreDistribution,
    statusDistribution,
  };
}

// ====================================
// J4 - Reporte de Cumplimiento SSOMA
// ====================================

export interface ComplianceMatrixRecord {
  collaboratorId: string;
  fullName: string;
  position: string | null;
  area: string | null;
  courses: Array<{
    courseId: string;
    courseName: string;
    isRequired: boolean;
    status: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED" | "NOT_ENROLLED";
    expiresAt: Date | null;
    daysUntilExpiration: number | null;
  }>;
}

export async function getComplianceReport(filters: {
  areaId?: string;
  siteId?: string;
  positionId?: string;
  criticalOnly?: boolean;
}): Promise<ComplianceMatrixRecord[]> {
  const now = new Date();

  // Obtener colaboradores activos
  const collaborators = await prisma.collaborator.findMany({
    where: {
      status: "ACTIVE",
      ...(filters.areaId && { areaId: filters.areaId }),
      ...(filters.siteId && { siteId: filters.siteId }),
      ...(filters.positionId && { positionId: filters.positionId }),
    },
    include: {
      area: true,
      position: true,
      site: true,
      enrollments: {
        include: {
          course: true,
          courseProgress: true,
        },
      },
    },
  });

  // Obtener cursos obligatorios (con validity en meses)
  const requiredCourses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters.criticalOnly ? { validity: { not: null } } : {}),
    },
    select: {
      id: true,
      name: true,
      validity: true,
    },
  });

  return collaborators.map((collaborator) => {
    const courses = requiredCourses.map((course) => {
      const enrollment = collaborator.enrollments.find(
        (e) => e.courseId === course.id,
      );

      if (!enrollment || !enrollment.courseProgress) {
        return {
          courseId: course.id,
          courseName: course.name,
          isRequired: course.validity !== null,
          status: "NOT_ENROLLED" as const,
          expiresAt: null,
          daysUntilExpiration: null,
        };
      }

      const progress = enrollment.courseProgress;
      const expiresAt = progress.expiresAt;

      if (!expiresAt) {
        return {
          courseId: course.id,
          courseName: course.name,
          isRequired: course.validity !== null,
          status: "NOT_ENROLLED" as const,
          expiresAt: null,
          daysUntilExpiration: null,
        };
      }

      const daysUntilExpiration = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      let status: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED";
      if (daysUntilExpiration < 0) {
        status = "EXPIRED";
      } else if (daysUntilExpiration <= 30) {
        status = "EXPIRING_SOON";
      } else {
        status = "COMPLIANT";
      }

      return {
        courseId: course.id,
        courseName: course.name,
        isRequired: course.validity !== null,
        status,
        expiresAt,
        daysUntilExpiration,
      };
    });

    return {
      collaboratorId: collaborator.id,
      fullName: collaborator.fullName,
      position: collaborator.position?.name || null,
      area: collaborator.area?.name || null,
      courses,
    };
  });
}

// ====================================
// J5 - Trazabilidad de Evaluaciones
// ====================================

export interface AuditTrailRecord {
  attemptId: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorDNI: string;
  courseId: string;
  courseName: string;
  quizId: string;
  quizTitle: string;
  startedAt: Date;
  submittedAt: Date | null;
  timeSpent: number | null; // segundos
  score: number | null;
  status: string;
  attemptNumber: number;
  passed: boolean | null;
  answersCount: number;
}

export async function getAuditTrail(filters: {
  collaboratorId?: string;
  courseId?: string;
  quizId?: string;
  startDate?: string;
  endDate?: string;
  minScore?: number;
  maxScore?: number;
  status?: string;
}): Promise<AuditTrailRecord[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      ...(filters.collaboratorId && {
        collaboratorId: filters.collaboratorId,
      }),
      ...(filters.quizId && { quizId: filters.quizId }),
      ...(filters.courseId && {
        quiz: {
          OR: [
            { courseId: filters.courseId },
            { unit: { courseId: filters.courseId } },
          ],
        },
      }),
      ...(filters.status && { status: filters.status as any }),
      ...(filters.startDate && {
        startedAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && {
        startedAt: { lte: new Date(filters.endDate) },
      }),
      ...(filters.minScore !== undefined && {
        score: { gte: filters.minScore },
      }),
      ...(filters.maxScore !== undefined && {
        score: { lte: filters.maxScore },
      }),
    },
    include: {
      quiz: {
        include: {
          course: true,
          unit: {
            select: { courseId: true },
          },
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  // Obtener colaboradores para cada intento
  const collaboratorIds = [...new Set(attempts.map((a) => a.collaboratorId))];
  const collaborators = await prisma.collaborator.findMany({
    where: {
      id: { in: collaboratorIds },
    },
    select: {
      id: true,
      fullName: true,
      dni: true,
    },
  });

  const collaboratorMap = new Map(collaborators.map((c) => [c.id, c]));

  return attempts.map((attempt) => {
    const collaborator = collaboratorMap.get(attempt.collaboratorId);
    const courseId =
      attempt.quiz.course?.id || attempt.quiz.unit?.courseId || "";
    const rawAnswers =
      attempt.answers &&
      typeof attempt.answers === "object" &&
      !Array.isArray(attempt.answers)
        ? (attempt.answers as Record<string, unknown>)
        : null;
    return {
      attemptId: attempt.id,
      collaboratorId: attempt.collaboratorId,
      collaboratorName: collaborator?.fullName || "N/A",
      collaboratorDNI: collaborator?.dni || "N/A",
      courseId,
      courseName: attempt.quiz.course?.name || "N/A",
      quizId: attempt.quiz.id,
      quizTitle: attempt.quiz.title,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent,
      score: attempt.score,
      status: attempt.status,
      attemptNumber: attempt.attemptNumber,
      passed:
        attempt.status === "PASSED"
          ? true
          : attempt.status === "FAILED"
            ? false
            : null,
      answersCount: rawAnswers ? Object.keys(rawAnswers).length : 0,
    };
  });
}

// ====================================
// Crear Snapshot de KPIs
// ====================================

export async function createKPISnapshot(): Promise<void> {
  const kpis = await getDashboardKPIs();

  await prisma.kPISnapshot.create({
    data: {
      totalCollaborators: kpis.totalCollaborators,
      totalCourses: kpis.totalCourses,
      totalEnrollments: kpis.totalEnrollments,
      overallCompliance: kpis.overallCompliance,
      complianceByArea: kpis.complianceByArea,
      expiringIn7Days: kpis.expiringIn7Days,
      expiringIn30Days: kpis.expiringIn30Days,
      expired: kpis.expired,
      avgAttempts: kpis.avgAttempts,
      avgScore: kpis.avgScore,
      passRate: kpis.passRate,
      activeUsers: kpis.activeUsers,
      coursesInProgress: kpis.coursesInProgress,
      coursesCompleted: kpis.coursesCompleted,
    },
  });
}
