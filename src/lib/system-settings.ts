import { prisma } from "@/lib/prisma"

export const SYSTEM_SETTINGS_ID = "global"

export type CourseCompletionPolicy = {
  bypassCourseCompletionRestrictions: boolean
  updatedAt: Date | null
}

export async function getCourseCompletionPolicy(): Promise<CourseCompletionPolicy> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: SYSTEM_SETTINGS_ID },
    select: {
      bypassCourseCompletionRestrictions: true,
      updatedAt: true,
    },
  })

  return {
    bypassCourseCompletionRestrictions:
      settings?.bypassCourseCompletionRestrictions ?? false,
    updatedAt: settings?.updatedAt ?? null,
  }
}

export async function updateCourseCompletionPolicy({
  bypassCourseCompletionRestrictions,
  updatedBy,
}: {
  bypassCourseCompletionRestrictions: boolean
  updatedBy?: string | null
}): Promise<CourseCompletionPolicy> {
  const settings = await prisma.systemSettings.upsert({
    where: { id: SYSTEM_SETTINGS_ID },
    create: {
      id: SYSTEM_SETTINGS_ID,
      bypassCourseCompletionRestrictions,
      updatedBy,
    },
    update: {
      bypassCourseCompletionRestrictions,
      updatedBy,
    },
    select: {
      bypassCourseCompletionRestrictions: true,
      updatedAt: true,
    },
  })

  return settings
}
