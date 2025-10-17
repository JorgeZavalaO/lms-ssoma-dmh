import { z } from 'zod'

/**
 * K1 - Generación de certificado PDF
 */
export const GenerateCertificateSchema = z.object({
  certificationId: z.string().cuid(),
})

export type GenerateCertificateInput = z.infer<typeof GenerateCertificateSchema>

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
