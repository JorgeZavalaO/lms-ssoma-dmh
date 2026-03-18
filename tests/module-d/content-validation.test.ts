import { describe, it, expect } from 'vitest'
import { LessonSchema, LessonProgressSchema } from '../../src/validations/content'

describe('Module D - Content validations', () => {
  it('requiere videoUrl para lecciones VIDEO', () => {
    const result = LessonSchema.safeParse({
      title: 'Lección video',
      type: 'VIDEO',
      order: 1,
      videoUrl: '',
    })
    expect(result.success).toBe(false)
  })

  it('requiere fileUrl .pdf para lecciones PDF', () => {
    const invalid = LessonSchema.safeParse({
      title: 'Lección PDF',
      type: 'PDF',
      order: 1,
      fileUrl: 'https://example.com/file.docx',
    })
    expect(invalid.success).toBe(false)

    const valid = LessonSchema.safeParse({
      title: 'Lección PDF',
      type: 'PDF',
      order: 1,
      fileUrl: 'https://example.com/manual.pdf',
    })
    expect(valid.success).toBe(true)
  })

  it('requiere htmlContent para lecciones HTML', () => {
    const result = LessonSchema.safeParse({
      title: 'Lección HTML',
      type: 'HTML',
      order: 1,
      htmlContent: '',
    })
    expect(result.success).toBe(false)
  })

  it('valida límites de LessonProgressSchema', () => {
    const invalid = LessonProgressSchema.safeParse({
      viewPercentage: 150,
    })
    expect(invalid.success).toBe(false)

    const valid = LessonProgressSchema.safeParse({
      viewPercentage: 80,
      timeDeltaSeconds: 25,
      duration: 300,
      completed: true,
    })
    expect(valid.success).toBe(true)
  })
})
