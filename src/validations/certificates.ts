import { z } from 'zod'

/**
 * K1 - Generación de certificado PDF
 */
export const GenerateCertificateSchema = z.object({
  certificationId: z.string().cuid(),
})

export type GenerateCertificateInput = z.infer<typeof GenerateCertificateSchema>

const DemoCertificateBaseSchema = z.object({
  courseId: z.string().cuid(),
  score: z.coerce.number().min(0).max(100).default(100),
})

/**
 * Generacion temporal de certificado demo.
 * No crea registros de progreso, certificacion ni artefactos persistidos.
 */
export const DemoCertificateSchema = z.discriminatedUnion('recipientMode', [
  DemoCertificateBaseSchema.extend({
    recipientMode: z.literal('manual'),
    collaboratorName: z.string().trim().min(3),
    collaboratorDni: z.string().trim().min(8).max(15),
  }),
  DemoCertificateBaseSchema.extend({
    recipientMode: z.literal('existing'),
    collaboratorId: z.string().cuid(),
  }),
])

export type DemoCertificateInput = z.infer<typeof DemoCertificateSchema>

/**
 * K2 - Verificación de certificado
 */
export const VerifyCertificateSchema = z.object({
  code: z.string().min(1, 'El código de verificación es requerido'),
})

export type VerifyCertificateInput = z.infer<typeof VerifyCertificateSchema>

/**
 * Filtros para listar certificados
 */
export const CertificateFiltersSchema = z.object({
  collaboratorId: z.string().cuid().optional(),
  courseId: z.string().cuid().optional(),
  isValid: z.boolean().optional(),
  hasVerificationCode: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type CertificateFilters = z.infer<typeof CertificateFiltersSchema>
