import { z } from "zod"

// ====================================
// J1 - Dashboard KPIs
// ====================================

export const DashboardFiltersSchema = z.object({
  startDate: z.string().optional(), // ISO date
  endDate: z.string().optional(),   // ISO date
  areaId: z.string().optional(),
  siteId: z.string().optional(),
})

export type DashboardFiltersInput = z.infer<typeof DashboardFiltersSchema>

// ====================================
// J2 - Reporte por Área
// ====================================

export const AreaReportFiltersSchema = z.object({
  areaId: z.string().optional(),
  siteId: z.string().optional(),
  positionId: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "IN_PROGRESS", "EXPIRED", "FAILED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  courseId: z.string().optional(),
})

export type AreaReportFiltersInput = z.infer<typeof AreaReportFiltersSchema>

// ====================================
// J3 - Reporte por Curso
// ====================================

export const CourseReportFiltersSchema = z.object({
  courseId: z.string().min(1, "El ID del curso es requerido"),
  versionId: z.string().optional(), // Si no se especifica, usa la versión activa
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type CourseReportFiltersInput = z.infer<typeof CourseReportFiltersSchema>

// ====================================
// J4 - Reporte de Cumplimiento
// ====================================

export const ComplianceReportFiltersSchema = z.object({
  areaId: z.string().optional(),
  siteId: z.string().optional(),
  positionId: z.string().optional(),
  criticalOnly: z.boolean().optional(), // Solo cursos críticos/obligatorios
})

export type ComplianceReportFiltersInput = z.infer<typeof ComplianceReportFiltersSchema>

// ====================================
// J5 - Trazabilidad de Evaluaciones
// ====================================

export const AuditTrailFiltersSchema = z.object({
  collaboratorId: z.string().optional(),
  courseId: z.string().optional(),
  quizId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "ABANDONED"]).optional(),
})

export type AuditTrailFiltersInput = z.infer<typeof AuditTrailFiltersSchema>

// ====================================
// Exportación de Reportes
// ====================================

export const ExportReportSchema = z.object({
  type: z.enum(["DASHBOARD", "AREA", "COURSE", "COMPLIANCE", "AUDIT_TRAIL"]),
  format: z.enum(["XLSX", "CSV", "PDF", "JSON"]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: z.record(z.string(), z.any()), // Filtros específicos de cada tipo de reporte
  name: z.string().optional(), // Nombre personalizado del reporte
})

export type ExportReportInput = z.infer<typeof ExportReportSchema>

// ====================================
// Programación de Reportes
// ====================================

export const CreateReportScheduleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(["DASHBOARD", "AREA", "COURSE", "COMPLIANCE", "AUDIT_TRAIL"]),
  format: z.enum(["XLSX", "CSV", "PDF", "JSON"]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: z.record(z.string(), z.any()),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "CUSTOM"]),
  cronExpression: z.string().optional(), // Requerido si frequency === CUSTOM
  recipients: z.array(z.string().email()).min(1, "Al menos un destinatario es requerido"),
  isActive: z.boolean().optional(),
})

export type CreateReportScheduleInput = z.infer<typeof CreateReportScheduleSchema>

export const UpdateReportScheduleSchema = CreateReportScheduleSchema.partial().extend({
  id: z.string().min(1),
})

export type UpdateReportScheduleInput = z.infer<typeof UpdateReportScheduleSchema>

// ====================================
// KPI Snapshot
// ====================================

export const CreateKPISnapshotSchema = z.object({
  // El snapshot se genera automáticamente desde los datos actuales
  // Este schema es principalmente para validar la creación manual si se requiere
})

export type CreateKPISnapshotInput = z.infer<typeof CreateKPISnapshotSchema>
