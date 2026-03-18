import { describe, it, expect } from 'vitest'
import {
  UpdateCourseProgressSchema,
  CreateCertificationSchema,
  RevokeCertificationSchema,
  ChangeProgressStatusSchema,
} from '../../src/validations/progress'

describe('Module H - Progress validations', () => {
  it('acepta actualización de progreso válida', () => {
    const result = UpdateCourseProgressSchema.safeParse({
      progressPercent: 60,
      timeSpent: 1200,
      status: 'IN_PROGRESS',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza progressPercent fuera de rango', () => {
    const result = UpdateCourseProgressSchema.safeParse({
      progressPercent: 101,
    })
    expect(result.success).toBe(false)
  })

  it('requiere razón al revocar certificación', () => {
    const result = RevokeCertificationSchema.safeParse({
      revocationReason: '',
    })
    expect(result.success).toBe(false)
  })

  it('valida CreateCertificationSchema con cuid válido', () => {
    const result = CreateCertificationSchema.safeParse({
      courseProgressId: 'c123456789012345678901234',
      isRecertification: true,
    })
    expect(result.success).toBe(true)
  })

  it('valida cambio de estado con enum permitido', () => {
    const result = ChangeProgressStatusSchema.safeParse({
      status: 'PASSED',
      reason: 'Aprobado en evaluación final',
    })
    expect(result.success).toBe(true)
  })
})
