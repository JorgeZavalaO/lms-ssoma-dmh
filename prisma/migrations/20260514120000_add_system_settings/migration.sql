CREATE TABLE "system_settings" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "bypassCourseCompletionRestrictions" BOOLEAN NOT NULL DEFAULT false,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
