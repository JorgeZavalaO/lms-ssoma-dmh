import { z } from "zod"

// Enums
export const NotificationTypeSchema = z.enum([
  "NEW_ENROLLMENT",
  "REMINDER_30_DAYS",
  "REMINDER_7_DAYS",
  "REMINDER_1_DAY",
  "COURSE_FAILED",
  "CERTIFICATE_READY",
  "RECERTIFICATION_DUE",
  "TEAM_SUMMARY",
])

export const NotificationChannelSchema = z.enum([
  "EMAIL",
  "IN_APP",
  "BOTH",
])

export const NotificationPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
])

// Plantillas de notificaciones
export const CreateNotificationTemplateSchema = z.object({
  type: NotificationTypeSchema,
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  subject: z.string().min(1, "El asunto es requerido"),
  bodyHtml: z.string().min(1, "El cuerpo HTML es requerido"),
  bodyText: z.string().min(1, "El cuerpo en texto plano es requerido"),
  isActive: z.boolean().default(true),
  defaultChannel: NotificationChannelSchema.default("BOTH"),
  priority: NotificationPrioritySchema.default("MEDIUM"),
  availableVars: z.array(z.string()).default([]),
})

export const UpdateNotificationTemplateSchema = CreateNotificationTemplateSchema.partial()

// Notificaciones individuales
export const CreateNotificationSchema = z.object({
  userId: z.string().min(1, "El usuario es requerido"),
  collaboratorId: z.string().optional(),
  type: NotificationTypeSchema,
  templateId: z.string().optional(),
  subject: z.string().min(1, "El asunto es requerido"),
  bodyHtml: z.string().min(1, "El cuerpo HTML es requerido"),
  bodyText: z.string().min(1, "El cuerpo en texto plano es requerido"),
  priority: NotificationPrioritySchema.default("MEDIUM"),
  channel: NotificationChannelSchema.default("IN_APP"),
  relatedCourseId: z.string().optional(),
  relatedEnrollmentId: z.string().optional(),
  relatedCertificationId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
})

export const UpdateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  isArchived: z.boolean().optional(),
})

// Preferencias de notificación
export const UpdateNotificationPreferenceSchema = z.object({
  type: NotificationTypeSchema,
  enableEmail: z.boolean(),
  enableInApp: z.boolean(),
})

// Envío masivo de notificaciones
export const SendBulkNotificationSchema = z.object({
  type: NotificationTypeSchema,
  userIds: z.array(z.string()).min(1, "Debe incluir al menos un destinatario"),
  subject: z.string().min(1, "El asunto es requerido"),
  bodyHtml: z.string().min(1, "El cuerpo HTML es requerido"),
  bodyText: z.string().min(1, "El cuerpo en texto plano es requerido"),
  channel: NotificationChannelSchema.default("BOTH"),
  priority: NotificationPrioritySchema.default("MEDIUM"),
  scheduledFor: z.string().datetime().optional(),
})

// Recordatorios de vencimiento
export const GenerateExpirationRemindersSchema = z.object({
  daysBeforeExpiration: z.number().int().min(1).max(90),
  notificationType: NotificationTypeSchema,
  sendEmail: z.boolean().default(true),
  sendInApp: z.boolean().default(true),
})

// Resumen semanal para jefes
export const GenerateTeamSummarySchema = z.object({
  areaId: z.string().optional(),
  siteId: z.string().optional(),
  sendEmail: z.boolean().default(true),
})

// Tipos TypeScript inferidos
export type CreateNotificationTemplateInput = z.infer<typeof CreateNotificationTemplateSchema>
export type UpdateNotificationTemplateInput = z.infer<typeof UpdateNotificationTemplateSchema>
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>
export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>
export type UpdateNotificationPreferenceInput = z.infer<typeof UpdateNotificationPreferenceSchema>
export type SendBulkNotificationInput = z.infer<typeof SendBulkNotificationSchema>
export type GenerateExpirationRemindersInput = z.infer<typeof GenerateExpirationRemindersSchema>
export type GenerateTeamSummaryInput = z.infer<typeof GenerateTeamSummarySchema>
