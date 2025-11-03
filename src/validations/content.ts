import { z } from "zod"

// Enums
export const LessonTypeEnum = z.enum(["VIDEO", "PDF", "PPT", "HTML", "SCORM"])
export const FileTypeEnum = z.enum(["PDF", "PPT", "IMAGE", "VIDEO", "DOCUMENT", "OTHER"])

// D1 - Unidades
export const UnitSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  order: z.number().int().positive(),
})

export const UnitUpdateSchema = UnitSchema.partial()

// D1 - Lecciones
export const LessonSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  type: LessonTypeEnum,
  order: z.number().int().positive(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  fileUrl: z.string().url().optional().or(z.literal("")),
  htmlContent: z.string().optional(),
  completionThreshold: z.number().int().min(0).max(100).default(80),
  duration: z.number().int().positive().optional(),
})

export const LessonUpdateSchema = LessonSchema.partial()

// D1 - Progreso de lecciones
export const LessonProgressSchema = z.object({
  viewPercentage: z.number().int().min(0).max(100),
  completed: z.boolean().optional(),
  // Opcionales para validación de ritmo (anti-salto): segundos reales de reproducción y duración total del video
  timeDeltaSeconds: z.number().int().min(0).max(7200).optional(),
  duration: z.number().int().min(1).max(24 * 60 * 60).optional(), // en segundos
  // Marcación manual (no-video) - habilitado desde cliente tras 3 minutos activos
  manualComplete: z.boolean().optional(),
})

// D2 - Repositorio de archivos
export const FileRepositorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  fileType: FileTypeEnum,
  size: z.number().int().positive(),
  mimeType: z.string(),
  tags: z.array(z.string()).default([]),
  version: z.number().int().positive().default(1),
  previousVersionId: z.string().optional(),
})

// D3 - Actividades interactivas
export const InteractiveActivitySchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  htmlContent: z.string().min(1, "El contenido es requerido"),
  maxAttempts: z.number().int().positive().optional(),
  courseId: z.string().optional(),
})

export const InteractiveActivityUpdateSchema = InteractiveActivitySchema.partial()

// D3 - Intentos de actividades
export const ActivityAttemptSchema = z.object({
  attemptNumber: z.number().int().positive(),
  responses: z.record(z.string(), z.any()),
  score: z.number().int().min(0).optional(),
  completed: z.boolean().default(false),
})

// Tipos TypeScript
export type UnitInput = z.infer<typeof UnitSchema>
export type LessonInput = z.infer<typeof LessonSchema>
export type LessonProgressInput = z.infer<typeof LessonProgressSchema>
export type FileRepositoryInput = z.infer<typeof FileRepositorySchema>
export type InteractiveActivityInput = z.infer<typeof InteractiveActivitySchema>
export type ActivityAttemptInput = z.infer<typeof ActivityAttemptSchema>
