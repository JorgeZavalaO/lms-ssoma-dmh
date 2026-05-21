import { markCoursePassedFromQuiz } from "@/lib/course-completion";
import { repairMissingCertifications } from "@/lib/certificates";
import { prisma } from "@/lib/prisma";

type ReconciliationOptions = {
  dryRun?: boolean;
  includeCertificationRepair?: boolean;
  maxDetails?: number;
};

export type ReconciliationDetail = {
  enrollmentId: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorDni: string;
  courseId: string;
  courseName: string;
  attemptId: string;
  score: number;
  action: "CANDIDATE" | "RECONCILED" | "FAILED";
  reason?: string;
};

export type ReconciliationSummary = {
  dryRun: boolean;
  scannedEnrollments: number;
  alreadyApproved: number;
  withoutPassedAttempt: number;
  candidates: number;
  reconciled: number;
  skipped: number;
  failed: number;
  details: ReconciliationDetail[];
  certificationRepair?: {
    created: number;
    skipped: number;
    failed: number;
  };
};

export async function reconcileApprovedAttemptsForAllUsers(
  options: ReconciliationOptions = {},
): Promise<ReconciliationSummary> {
  const dryRun = options.dryRun ?? false;
  const maxDetails = options.maxDetails ?? 200;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: { not: "CANCELLED" },
      courseId: { not: null },
    },
    select: {
      id: true,
      collaboratorId: true,
      courseId: true,
      collaborator: {
        select: {
          fullName: true,
          dni: true,
        },
      },
      course: {
        select: {
          name: true,
        },
      },
      courseProgress: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { enrolledAt: "asc" },
  });

  let alreadyApproved = 0;
  let withoutPassedAttempt = 0;
  let candidates = 0;
  let reconciled = 0;
  let skipped = 0;
  let failed = 0;
  const details: ReconciliationDetail[] = [];

  for (const enrollment of enrollments) {
    const courseId = enrollment.courseId;
    if (!courseId) {
      skipped += 1;
      continue;
    }

    const isApproved =
      enrollment.courseProgress?.status === "PASSED" ||
      enrollment.courseProgress?.status === "EXEMPTED";

    if (isApproved) {
      alreadyApproved += 1;
      continue;
    }

    const latestPassedAttempt = await prisma.quizAttempt.findFirst({
      where: {
        collaboratorId: enrollment.collaboratorId,
        status: "PASSED",
        quiz: {
          OR: [{ courseId }, { unit: { courseId } }],
        },
      },
      select: {
        id: true,
        quizId: true,
        score: true,
      },
      orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
    });

    if (!latestPassedAttempt) {
      withoutPassedAttempt += 1;
      continue;
    }

    candidates += 1;

    if (dryRun) {
      if (details.length < maxDetails) {
        details.push({
          enrollmentId: enrollment.id,
          collaboratorId: enrollment.collaboratorId,
          collaboratorName: enrollment.collaborator.fullName,
          collaboratorDni: enrollment.collaborator.dni,
          courseId,
          courseName: enrollment.course?.name ?? "Curso sin nombre",
          attemptId: latestPassedAttempt.id,
          score: latestPassedAttempt.score ?? 0,
          action: "CANDIDATE",
        });
      }
      continue;
    }

    try {
      const result = await markCoursePassedFromQuiz({
        collaboratorId: enrollment.collaboratorId,
        courseId,
        attemptId: latestPassedAttempt.id,
        quizId: latestPassedAttempt.quizId,
        score: latestPassedAttempt.score ?? 0,
        bypassCourseCompletionRestrictions: true,
      });

      if (result.marked) {
        reconciled += 1;
        if (details.length < maxDetails) {
          details.push({
            enrollmentId: enrollment.id,
            collaboratorId: enrollment.collaboratorId,
            collaboratorName: enrollment.collaborator.fullName,
            collaboratorDni: enrollment.collaborator.dni,
            courseId,
            courseName: enrollment.course?.name ?? "Curso sin nombre",
            attemptId: latestPassedAttempt.id,
            score: latestPassedAttempt.score ?? 0,
            action: "RECONCILED",
          });
        }
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      if (details.length < maxDetails) {
        details.push({
          enrollmentId: enrollment.id,
          collaboratorId: enrollment.collaboratorId,
          collaboratorName: enrollment.collaborator.fullName,
          collaboratorDni: enrollment.collaborator.dni,
          courseId,
          courseName: enrollment.course?.name ?? "Curso sin nombre",
          attemptId: latestPassedAttempt.id,
          score: latestPassedAttempt.score ?? 0,
          action: "FAILED",
          reason: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  }

  const summary: ReconciliationSummary = {
    dryRun,
    scannedEnrollments: enrollments.length,
    alreadyApproved,
    withoutPassedAttempt,
    candidates,
    reconciled,
    skipped,
    failed,
    details,
  };

  if (!dryRun && options.includeCertificationRepair) {
    const certRepair = await repairMissingCertifications();
    summary.certificationRepair = {
      created: certRepair.created,
      skipped: certRepair.skipped,
      failed: certRepair.failed,
    };
  }

  return summary;
}
