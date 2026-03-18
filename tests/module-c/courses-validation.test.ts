import { describe, it, expect } from 'vitest'
import {
  CourseSchema,
  LearningPathSchema,
  LearningPathCourseSchema,
} from '../../src/validations/courses'

describe('Module C - Course validations', () => {
  it('aplica valores por defecto en CourseSchema', () => {
    const result = CourseSchema.parse({ name: 'Curso SSOMA' })
    expect(result.modality).toBe('ASYNCHRONOUS')
    expect(result.status).toBe('DRAFT')
  })

  it('falla cuando el nombre de curso es muy corto', () => {
    const result = CourseSchema.safeParse({ name: 'A' })
    expect(result.success).toBe(false)
  })

  it('falla cuando order no es positivo en LearningPathCourseSchema', () => {
    const result = LearningPathCourseSchema.safeParse({
      courseId: 'course-1',
      order: 0,
      isRequired: true,
    })
    expect(result.success).toBe(false)
  })

  it('valida creación de ruta de aprendizaje mínima', () => {
    const result = LearningPathSchema.parse({
      code: 'LP-SSOMA',
      name: 'Ruta inicial',
    })
    expect(result.status).toBe('DRAFT')
  })
})
