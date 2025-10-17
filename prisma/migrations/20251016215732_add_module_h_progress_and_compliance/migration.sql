-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'EXPIRED', 'EXEMPTED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('EXPIRING_SOON', 'EXPIRED', 'RECERTIFICATION', 'OVERDUE');

-- CreateTable
CREATE TABLE "course_progress" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "passedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "certifiedAt" TIMESTAMP(3),
    "exemptedAt" TIMESTAMP(3),
    "exemptionReason" TEXT,
    "exemptedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_records" (
    "id" TEXT NOT NULL,
    "courseProgressId" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isRecertification" BOOLEAN NOT NULL DEFAULT false,
    "previousCertId" TEXT,
    "recertificationDueAt" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "certificateData" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_alerts" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_progress" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "coursesCompleted" INTEGER NOT NULL DEFAULT 0,
    "coursesTotal" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_path_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_progress_enrollmentId_key" ON "course_progress"("enrollmentId");

-- CreateIndex
CREATE INDEX "course_progress_status_idx" ON "course_progress"("status");

-- CreateIndex
CREATE INDEX "course_progress_expiresAt_idx" ON "course_progress"("expiresAt");

-- CreateIndex
CREATE INDEX "course_progress_collaboratorId_idx" ON "course_progress"("collaboratorId");

-- CreateIndex
CREATE INDEX "course_progress_courseId_idx" ON "course_progress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_progress_collaboratorId_courseId_key" ON "course_progress"("collaboratorId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "certification_records_certificateNumber_key" ON "certification_records"("certificateNumber");

-- CreateIndex
CREATE INDEX "certification_records_collaboratorId_idx" ON "certification_records"("collaboratorId");

-- CreateIndex
CREATE INDEX "certification_records_courseId_idx" ON "certification_records"("courseId");

-- CreateIndex
CREATE INDEX "certification_records_expiresAt_idx" ON "certification_records"("expiresAt");

-- CreateIndex
CREATE INDEX "certification_records_isValid_idx" ON "certification_records"("isValid");

-- CreateIndex
CREATE INDEX "progress_alerts_collaboratorId_idx" ON "progress_alerts"("collaboratorId");

-- CreateIndex
CREATE INDEX "progress_alerts_type_idx" ON "progress_alerts"("type");

-- CreateIndex
CREATE INDEX "progress_alerts_isRead_idx" ON "progress_alerts"("isRead");

-- CreateIndex
CREATE INDEX "progress_alerts_dueDate_idx" ON "progress_alerts"("dueDate");

-- CreateIndex
CREATE INDEX "learning_path_progress_collaboratorId_idx" ON "learning_path_progress"("collaboratorId");

-- CreateIndex
CREATE INDEX "learning_path_progress_learningPathId_idx" ON "learning_path_progress"("learningPathId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_progress_collaboratorId_learningPathId_key" ON "learning_path_progress"("collaboratorId", "learningPathId");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_records" ADD CONSTRAINT "certification_records_courseProgressId_fkey" FOREIGN KEY ("courseProgressId") REFERENCES "course_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_records" ADD CONSTRAINT "certification_records_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_records" ADD CONSTRAINT "certification_records_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_records" ADD CONSTRAINT "certification_records_previousCertId_fkey" FOREIGN KEY ("previousCertId") REFERENCES "certification_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_alerts" ADD CONSTRAINT "progress_alerts_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_alerts" ADD CONSTRAINT "progress_alerts_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_progress" ADD CONSTRAINT "learning_path_progress_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_progress" ADD CONSTRAINT "learning_path_progress_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;
