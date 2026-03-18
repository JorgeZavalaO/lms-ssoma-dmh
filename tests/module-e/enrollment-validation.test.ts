import { describe, it, expect } from 'vitest'
import {
  EnrollmentRuleSchema,
  ManualEnrollmentSchema,
  BulkEnrollmentSchema,
} from '../../src/validations/enrollment'

describe('Module E - Enrollment validations', () => {
  it('falla regla si no tiene curso/ruta', () => {
    const result = EnrollmentRuleSchema.safeParse({
      siteId: 'site-1',
    })
    expect(result.success).toBe(false)
  })

  it('falla regla si no tiene criterio de sede/área/puesto', () => {
    const result = EnrollmentRuleSchema.safeParse({
      courseId: 'course-1',
    })
    expect(result.success).toBe(false)
  })

  it('valida inscripción manual con ruta y colaboradores', () => {
    const result = ManualEnrollmentSchema.safeParse({
      learningPathId: 'lp-1',
      collaboratorIds: ['c1', 'c2'],
    })
    expect(result.success).toBe(true)
  })

  it('valida inscripción bulk con curso y filtros opcionales', () => {
    const result = BulkEnrollmentSchema.safeParse({
      courseId: 'course-1',
      filters: {
        siteIds: ['site-1'],
      },
    })
    expect(result.success).toBe(true)
  })
})
