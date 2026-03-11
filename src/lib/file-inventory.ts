import { FileType } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type FileUsageConfidence = "DIRECT" | "HEURISTIC"
export type FileUsageSource = "LESSON_FILE" | "LESSON_HTML" | "CERTIFICATE_PDF" | "CERTIFICATE_URL" | "INTERACTIVE_ACTIVITY"
export type FileUsageState = "IN_USE" | "UNUSED" | "HEURISTIC_ONLY"

export type FileInventoryQuery = {
  page?: number
  pageSize?: number
  q?: string
  fileType?: FileType | "ALL"
  usageState?: FileUsageState | "ALL"
  tag?: string | "ALL"
}

export type FileUsageReference = {
  source: FileUsageSource
  confidence: FileUsageConfidence
  title: string
  description: string
  courseId: string | null
  courseCode: string | null
  courseName: string | null
  unitId: string | null
  unitTitle: string | null
  lessonId: string | null
  lessonTitle: string | null
  activityId: string | null
  activityTitle: string | null
  certificationId: string | null
  collaboratorName: string | null
  matchedField: string
}

export type FileInventoryItem = {
  id: string
  name: string
  description: string | null
  fileType: FileType
  blobUrl: string
  size: number
  mimeType: string
  tags: string[]
  version: number
  previousVersionId: string | null
  uploadedBy: string
  uploadedAt: string
  usageState: FileUsageState
  usageCount: number
  directUsageCount: number
  heuristicUsageCount: number
  primaryLocation: string
  relatedCourseName: string | null
  confidenceSummary: string
}

export type FileInventoryStats = {
  totalFiles: number
  inUseFiles: number
  unusedFiles: number
  heuristicOnlyFiles: number
}

export type FileInventoryListResponse = {
  items: FileInventoryItem[]
  total: number
  page: number
  pageSize: number
  stats: FileInventoryStats
  availableTags: string[]
}

export type FileInventoryDetail = {
  item: FileInventoryItem
  usages: FileUsageReference[]
  relatedCourses: Array<{
    id: string
    code: string | null
    name: string
  }>
}

type RawFile = {
  id: string
  name: string
  description: string | null
  fileType: FileType
  blobUrl: string
  size: number
  mimeType: string
  tags: string[]
  version: number
  previousVersionId: string | null
  uploadedBy: string
  uploadedAt: Date
}

function normalizeQuery(query: FileInventoryQuery) {
  return {
    page: Math.max(1, Number(query.page ?? 1) || 1),
    pageSize: Math.min(100, Math.max(1, Number(query.pageSize ?? 10) || 10)),
    q: query.q?.trim().toLowerCase() ?? "",
    fileType: query.fileType && query.fileType !== "ALL" ? query.fileType : undefined,
    usageState: query.usageState && query.usageState !== "ALL" ? query.usageState : undefined,
    tag: query.tag && query.tag !== "ALL" ? query.tag : undefined,
  }
}

function pushUsage(map: Map<string, FileUsageReference[]>, blobUrl: string, usage: FileUsageReference) {
  const current = map.get(blobUrl) ?? []
  current.push(usage)
  map.set(blobUrl, current)
}

function classifyUsage(usages: FileUsageReference[]): FileUsageState {
  const directUsageCount = usages.filter((usage) => usage.confidence === "DIRECT").length
  if (directUsageCount > 0) return "IN_USE"
  if (usages.length > 0) return "HEURISTIC_ONLY"
  return "UNUSED"
}

function getPrimaryLocation(usages: FileUsageReference[]): string {
  if (usages.length === 0) return "Sin referencias detectadas"
  const primary = usages[0]
  return primary.description
}

function getConfidenceSummary(usageState: FileUsageState): string {
  switch (usageState) {
    case "IN_USE":
      return "Uso directo confirmado"
    case "HEURISTIC_ONLY":
      return "Detección heurística"
    default:
      return "Sin referencias detectadas"
  }
}

function buildFileInventoryItem(file: RawFile, usages: FileUsageReference[]): FileInventoryItem {
  const usageState = classifyUsage(usages)
  const relatedCourse = usages.find((usage) => usage.courseName)
  const directUsageCount = usages.filter((usage) => usage.confidence === "DIRECT").length
  const heuristicUsageCount = usages.filter((usage) => usage.confidence === "HEURISTIC").length

  return {
    id: file.id,
    name: file.name,
    description: file.description,
    fileType: file.fileType,
    blobUrl: file.blobUrl,
    size: file.size,
    mimeType: file.mimeType,
    tags: file.tags,
    version: file.version,
    previousVersionId: file.previousVersionId,
    uploadedBy: file.uploadedBy,
    uploadedAt: file.uploadedAt.toISOString(),
    usageState,
    usageCount: usages.length,
    directUsageCount,
    heuristicUsageCount,
    primaryLocation: getPrimaryLocation(usages),
    relatedCourseName: relatedCourse?.courseName ?? null,
    confidenceSummary: getConfidenceSummary(usageState),
  }
}

function dedupeUsages(usages: FileUsageReference[]) {
  const seen = new Set<string>()
  return usages.filter((usage) => {
    const key = [
      usage.source,
      usage.confidence,
      usage.lessonId,
      usage.activityId,
      usage.certificationId,
      usage.matchedField,
      usage.title,
    ].join(":" )
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function matchesSearch(item: FileInventoryItem, usages: FileUsageReference[], query: string) {
  if (!query) return true

  const searchable = [
    item.name,
    item.description ?? "",
    item.fileType,
    item.blobUrl,
    item.mimeType,
    item.relatedCourseName ?? "",
    item.primaryLocation,
    item.confidenceSummary,
    ...item.tags,
    ...usages.flatMap((usage) => [
      usage.title,
      usage.description,
      usage.courseName ?? "",
      usage.courseCode ?? "",
      usage.unitTitle ?? "",
      usage.lessonTitle ?? "",
      usage.activityTitle ?? "",
      usage.collaboratorName ?? "",
      usage.matchedField,
    ]),
  ]
    .join(" ")
    .toLowerCase()

  return searchable.includes(query)
}

async function collectUsageMap(files: RawFile[]) {
  const usageMap = new Map<string, FileUsageReference[]>()

  if (files.length === 0) return usageMap

  const blobUrls = files.map((file) => file.blobUrl)

  const [lessonsByFile, certifications, htmlLessons, activities] = await Promise.all([
    prisma.lesson.findMany({
      where: { fileUrl: { in: blobUrls } },
      include: {
        unit: {
          include: {
            course: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    }),
    prisma.certificationRecord.findMany({
      where: {
        OR: [
          { pdfUrl: { in: blobUrls } },
          { certificateUrl: { in: blobUrls } },
        ],
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
        collaborator: { select: { fullName: true } },
      },
    }),
    prisma.lesson.findMany({
      where: { htmlContent: { not: null } },
      include: {
        unit: {
          include: {
            course: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    }),
    prisma.interactiveActivity.findMany({
      where: { htmlContent: { not: "" } },
      select: {
        id: true,
        title: true,
        courseId: true,
        htmlContent: true,
      },
    }),
  ])

  const activityCourseIds = Array.from(new Set(activities.map((activity) => activity.courseId).filter(Boolean))) as string[]
  const activityCourses = activityCourseIds.length > 0
    ? await prisma.course.findMany({
        where: { id: { in: activityCourseIds } },
        select: { id: true, code: true, name: true },
      })
    : []

  const activityCourseMap = new Map(activityCourses.map((course) => [course.id, course]))

  for (const lesson of lessonsByFile) {
    if (!lesson.fileUrl) continue
    pushUsage(usageMap, lesson.fileUrl, {
      source: "LESSON_FILE",
      confidence: "DIRECT",
      title: lesson.title,
      description: `Curso ${lesson.unit.course.name} · Unidad ${lesson.unit.title} · Lección ${lesson.title}`,
      courseId: lesson.unit.course.id,
      courseCode: lesson.unit.course.code,
      courseName: lesson.unit.course.name,
      unitId: lesson.unit.id,
      unitTitle: lesson.unit.title,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      activityId: null,
      activityTitle: null,
      certificationId: null,
      collaboratorName: null,
      matchedField: "lesson.fileUrl",
    })
  }

  for (const certification of certifications) {
    if (certification.pdfUrl) {
      pushUsage(usageMap, certification.pdfUrl, {
        source: "CERTIFICATE_PDF",
        confidence: "DIRECT",
        title: certification.certificateNumber,
        description: `Certificado ${certification.certificateNumber} · ${certification.course.name} · ${certification.collaborator.fullName}`,
        courseId: certification.course.id,
        courseCode: certification.course.code,
        courseName: certification.course.name,
        unitId: null,
        unitTitle: null,
        lessonId: null,
        lessonTitle: null,
        activityId: null,
        activityTitle: null,
        certificationId: certification.id,
        collaboratorName: certification.collaborator.fullName,
        matchedField: "certificationRecord.pdfUrl",
      })
    }

    if (certification.certificateUrl) {
      pushUsage(usageMap, certification.certificateUrl, {
        source: "CERTIFICATE_URL",
        confidence: "DIRECT",
        title: certification.certificateNumber,
        description: `Certificado ${certification.certificateNumber} · ${certification.course.name} · ${certification.collaborator.fullName}`,
        courseId: certification.course.id,
        courseCode: certification.course.code,
        courseName: certification.course.name,
        unitId: null,
        unitTitle: null,
        lessonId: null,
        lessonTitle: null,
        activityId: null,
        activityTitle: null,
        certificationId: certification.id,
        collaboratorName: certification.collaborator.fullName,
        matchedField: "certificationRecord.certificateUrl",
      })
    }
  }

  for (const lesson of htmlLessons) {
    const htmlContent = lesson.htmlContent ?? ""
    for (const blobUrl of blobUrls) {
      if (!htmlContent.includes(blobUrl)) continue
      pushUsage(usageMap, blobUrl, {
        source: "LESSON_HTML",
        confidence: "HEURISTIC",
        title: lesson.title,
        description: `Referencia embebida en HTML · ${lesson.unit.course.name} · ${lesson.title}`,
        courseId: lesson.unit.course.id,
        courseCode: lesson.unit.course.code,
        courseName: lesson.unit.course.name,
        unitId: lesson.unit.id,
        unitTitle: lesson.unit.title,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        activityId: null,
        activityTitle: null,
        certificationId: null,
        collaboratorName: null,
        matchedField: "lesson.htmlContent",
      })
    }
  }

  for (const activity of activities) {
    for (const blobUrl of blobUrls) {
      if (!activity.htmlContent.includes(blobUrl)) continue
      const course = activity.courseId ? activityCourseMap.get(activity.courseId) : null
      pushUsage(usageMap, blobUrl, {
        source: "INTERACTIVE_ACTIVITY",
        confidence: "HEURISTIC",
        title: activity.title,
        description: course
          ? `Actividad interactiva ${activity.title} · Curso ${course.name}`
          : `Actividad interactiva ${activity.title}`,
        courseId: course?.id ?? null,
        courseCode: course?.code ?? null,
        courseName: course?.name ?? null,
        unitId: null,
        unitTitle: null,
        lessonId: null,
        lessonTitle: null,
        activityId: activity.id,
        activityTitle: activity.title,
        certificationId: null,
        collaboratorName: null,
        matchedField: "interactiveActivity.htmlContent",
      })
    }
  }

  for (const [blobUrl, usages] of usageMap.entries()) {
    const sorted = dedupeUsages(usages).sort((a, b) => {
      if (a.confidence === b.confidence) return a.title.localeCompare(b.title)
      return a.confidence === "DIRECT" ? -1 : 1
    })
    usageMap.set(blobUrl, sorted)
  }

  return usageMap
}

export async function listFileInventory(query: FileInventoryQuery = {}): Promise<FileInventoryListResponse> {
  const normalized = normalizeQuery(query)
  const files = await prisma.fileRepository.findMany({
    where: {
      ...(normalized.fileType ? { fileType: normalized.fileType } : {}),
      ...(normalized.tag ? { tags: { has: normalized.tag } } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  })

  const usageMap = await collectUsageMap(files)

  const itemsWithUsages = files.map((file) => {
    const usages = usageMap.get(file.blobUrl) ?? []
    return {
      item: buildFileInventoryItem(file, usages),
      usages,
    }
  })

  const availableTags = Array.from(new Set(files.flatMap((file) => file.tags))).sort((a, b) => a.localeCompare(b))

  const filtered = itemsWithUsages.filter(({ item, usages }) => {
    if (normalized.usageState && item.usageState !== normalized.usageState) return false
    return matchesSearch(item, usages, normalized.q)
  })

  const stats = filtered.reduce<FileInventoryStats>((acc, entry) => {
    acc.totalFiles += 1
    if (entry.item.usageState === "IN_USE") acc.inUseFiles += 1
    if (entry.item.usageState === "UNUSED") acc.unusedFiles += 1
    if (entry.item.usageState === "HEURISTIC_ONLY") acc.heuristicOnlyFiles += 1
    return acc
  }, {
    totalFiles: 0,
    inUseFiles: 0,
    unusedFiles: 0,
    heuristicOnlyFiles: 0,
  })

  const start = (normalized.page - 1) * normalized.pageSize
  const paginated = filtered.slice(start, start + normalized.pageSize).map(({ item }) => item)

  return {
    items: paginated,
    total: filtered.length,
    page: normalized.page,
    pageSize: normalized.pageSize,
    stats,
    availableTags,
  }
}

export async function getFileInventoryDetail(id: string): Promise<FileInventoryDetail | null> {
  const file = await prisma.fileRepository.findUnique({
    where: { id },
  })

  if (!file) return null

  const usageMap = await collectUsageMap([file])
  const usages = usageMap.get(file.blobUrl) ?? []
  const item = buildFileInventoryItem(file, usages)

  const relatedCourses = Array.from(
    new Map(
      usages
        .filter((usage) => usage.courseId && usage.courseName)
        .map((usage) => [
          usage.courseId as string,
          {
            id: usage.courseId as string,
            code: usage.courseCode,
            name: usage.courseName as string,
          },
        ])
    ).values()
  )

  return {
    item,
    usages,
    relatedCourses,
  }
}
