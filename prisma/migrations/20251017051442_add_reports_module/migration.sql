-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DASHBOARD', 'AREA', 'COURSE', 'COMPLIANCE', 'AUDIT_TRAIL');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('JSON', 'XLSX', 'CSV', 'PDF');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "totalRecords" INTEGER,
    "summary" JSONB,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "scheduleId" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "filters" JSONB NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL,
    "cronExpression" TEXT,
    "recipients" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_executions" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsProcessed" INTEGER,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,

    CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_snapshots" (
    "id" TEXT NOT NULL,
    "totalCollaborators" INTEGER NOT NULL,
    "totalCourses" INTEGER NOT NULL,
    "totalEnrollments" INTEGER NOT NULL,
    "overallCompliance" DOUBLE PRECISION NOT NULL,
    "complianceByArea" JSONB NOT NULL,
    "expiringIn7Days" INTEGER NOT NULL,
    "expiringIn30Days" INTEGER NOT NULL,
    "expired" INTEGER NOT NULL,
    "avgAttempts" DOUBLE PRECISION NOT NULL,
    "avgScore" DOUBLE PRECISION NOT NULL,
    "passRate" DOUBLE PRECISION NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "coursesInProgress" INTEGER NOT NULL,
    "coursesCompleted" INTEGER NOT NULL,
    "avgNPS" DOUBLE PRECISION,
    "totalFeedbacks" INTEGER,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_scheduleId_idx" ON "reports"("scheduleId");

-- CreateIndex
CREATE INDEX "reports_generatedBy_idx" ON "reports"("generatedBy");

-- CreateIndex
CREATE INDEX "reports_generatedAt_idx" ON "reports"("generatedAt");

-- CreateIndex
CREATE INDEX "report_schedules_isActive_nextRunAt_idx" ON "report_schedules"("isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "report_executions_scheduleId_idx" ON "report_executions"("scheduleId");

-- CreateIndex
CREATE INDEX "report_executions_startedAt_idx" ON "report_executions"("startedAt");

-- CreateIndex
CREATE INDEX "kpi_snapshots_snapshotAt_idx" ON "kpi_snapshots"("snapshotAt");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "report_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "report_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
