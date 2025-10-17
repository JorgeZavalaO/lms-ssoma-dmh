import { z } from "zod";

// ============================================
// MÓDULO H: PROGRESO Y CUMPLIMIENTO
// ============================================

// Enums
export const ProgressStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "PASSED",
  "FAILED",
  "EXPIRED",
  "EXEMPTED",
]);

export const AlertTypeSchema = z.enum([
  "EXPIRING_SOON",
  "EXPIRED",
  "RECERTIFICATION",
  "OVERDUE",
]);

// H1 - Actualizar progreso de curso
export const UpdateCourseProgressSchema = z.object({
  progressPercent: z.number().int().min(0).max(100).optional(),
  timeSpent: z.number().int().min(0).optional(),
  status: ProgressStatusSchema.optional(),
});

// H1 - Actualizar progreso de lección
export const UpdateLessonProgressSchema = z.object({
  isCompleted: z.boolean().optional(),
  timeSpent: z.number().int().min(0).optional(),
  score: z.number().min(0).optional(),
  maxScore: z.number().min(0).optional(),
});

// H2 - Crear certificación
export const CreateCertificationSchema = z.object({
  courseProgressId: z.string().cuid(),
  expiresAt: z.string().datetime().optional(),
  isRecertification: z.boolean().optional().default(false),
  previousCertId: z.string().cuid().optional(),
  certificateData: z.record(z.string(), z.unknown()).optional(),
});

// H2 - Revocar certificación
export const RevokeCertificationSchema = z.object({
  revocationReason: z.string().min(1, "Debe proporcionar una razón"),
});

// H2 - Crear alerta de progreso
export const CreateProgressAlertSchema = z.object({
  collaboratorId: z.string().cuid(),
  courseId: z.string().cuid(),
  type: AlertTypeSchema,
  severity: z.number().int().min(1).max(3).default(1),
  title: z.string().min(1),
  message: z.string().min(1),
  dueDate: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// H3 - Exonerar colaborador
export const ExemptCollaboratorSchema = z.object({
  collaboratorId: z.string().cuid(),
  courseId: z.string().cuid(),
  exemptionReason: z.string().min(1, "Debe proporcionar una razón"),
});

// H3 - Cambiar estado de progreso
export const ChangeProgressStatusSchema = z.object({
  status: ProgressStatusSchema,
  reason: z.string().optional(),
});

// Tipos TypeScript inferidos
export type UpdateCourseProgressInput = z.infer<typeof UpdateCourseProgressSchema>;
export type UpdateLessonProgressInput = z.infer<typeof UpdateLessonProgressSchema>;
export type CreateCertificationInput = z.infer<typeof CreateCertificationSchema>;
export type RevokeCertificationInput = z.infer<typeof RevokeCertificationSchema>;
export type CreateProgressAlertInput = z.infer<typeof CreateProgressAlertSchema>;
export type ExemptCollaboratorInput = z.infer<typeof ExemptCollaboratorSchema>;
export type ChangeProgressStatusInput = z.infer<typeof ChangeProgressStatusSchema>;
