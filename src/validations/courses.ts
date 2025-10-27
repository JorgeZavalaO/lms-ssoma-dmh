import { z } from "zod"

export const CourseModalityEnum = z.enum(["ASYNCHRONOUS", "SYNCHRONOUS", "BLENDED"])
export const CourseStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])

export const CourseSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  objective: z.string().optional(),
  duration: z.number().int().positive("La duración debe ser positiva").optional(),
  modality: CourseModalityEnum.default("ASYNCHRONOUS"),
  validity: z.number().int().positive("La vigencia debe ser positiva").optional(),
  requirements: z.string().optional(),
  status: CourseStatusEnum.default("DRAFT"),
})

export const CourseUpdateSchema = CourseSchema.partial()

export const LearningPathSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  status: CourseStatusEnum.default("DRAFT"),
})

export const LearningPathCourseSchema = z.object({
  courseId: z.string().min(1, "El curso es requerido"),
  order: z.number().int().positive("El orden debe ser positivo"),
  isRequired: z.boolean().default(true),
  prerequisiteId: z.string().optional(),
})

export const CourseAssignedQuerySchema = z.object({
  collaboratorId: z.string().min(1),
})

export type CourseFormData = z.infer<typeof CourseSchema>
export type LearningPathFormData = z.infer<typeof LearningPathSchema>
export type LearningPathCourseFormData = z.infer<typeof LearningPathCourseSchema>
