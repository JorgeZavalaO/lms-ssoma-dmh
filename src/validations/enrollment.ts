import { z } from "zod"

// E1 - Reglas de asignación automática
export const EnrollmentRuleSchema = z.object({
  courseId: z.string().min(1, "El curso es requerido"),
  siteId: z.string().optional().nullable(),
  areaId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  createdBy: z.string().optional(), // Se asigna en el servidor
}).refine(
  (data) => data.siteId || data.areaId || data.positionId,
  {
    message: "Debe especificar al menos un criterio: sede, área o puesto",
    path: ["siteId"],
  }
)

export const UpdateEnrollmentRuleSchema = z.object({
  isActive: z.boolean().optional(),
  siteId: z.string().optional().nullable(),
  areaId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
})

// E2 - Inscripciones (manuales y automáticas)
export const EnrollmentSchema = z.object({
  courseId: z.string().min(1, "El curso es requerido"),
  collaboratorId: z.string().min(1, "El colaborador es requerido"),
  type: z.enum(["AUTOMATIC", "MANUAL"]),
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).default("PENDING"),
  startedAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).default(0),
  enrolledBy: z.string().optional().nullable(), // Requerido para MANUAL
  ruleId: z.string().optional().nullable(), // Requerido para AUTOMATIC
  notes: z.string().optional().nullable(),
})

export const ManualEnrollmentSchema = z.object({
  courseId: z.string().min(1, "El curso es requerido"),
  collaboratorIds: z.array(z.string()).min(1, "Debe seleccionar al menos un colaborador"),
  notes: z.string().optional().nullable(),
  enrolledBy: z.string().optional(), // Se asigna en el servidor
})

export const BulkEnrollmentSchema = z.object({
  courseId: z.string().min(1, "El curso es requerido"),
  filters: z.object({
    siteIds: z.array(z.string()).optional(),
    areaIds: z.array(z.string()).optional(),
    positionIds: z.array(z.string()).optional(),
  }),
  notes: z.string().optional().nullable(),
  enrolledBy: z.string().optional(), // Se asigna en el servidor
})

export const UpdateEnrollmentSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  startedAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional().nullable(),
})

export type EnrollmentRuleInput = z.infer<typeof EnrollmentRuleSchema>
export type UpdateEnrollmentRuleInput = z.infer<typeof UpdateEnrollmentRuleSchema>
export type EnrollmentInput = z.infer<typeof EnrollmentSchema>
export type ManualEnrollmentInput = z.infer<typeof ManualEnrollmentSchema>
export type BulkEnrollmentInput = z.infer<typeof BulkEnrollmentSchema>
export type UpdateEnrollmentInput = z.infer<typeof UpdateEnrollmentSchema>
