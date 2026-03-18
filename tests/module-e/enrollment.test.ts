import { vi, describe, it, expect, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock de Prisma — vi.hoisted garantiza que las referencias estén disponibles
// cuando vi.mock() construye el módulo sustituto.
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    collaborator: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    enrollmentRule: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    enrollment: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    courseProgress: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  return { mockPrisma }
})

vi.mock('../../src/lib/prisma', () => ({ prisma: mockPrisma }))

import {
  applyAutoEnrollmentRules,
  removeInvalidAutoEnrollments,
  applyEnrollmentRule,
} from '../../src/lib/enrollment'

// ---------------------------------------------------------------------------
// Datos de utilidad
// ---------------------------------------------------------------------------
const ACTIVE_COLLABORATOR = {
  id: 'c1',
  siteId: 'site-A',
  areaId: 'area-X',
  positionId: 'pos-1',
  status: 'ACTIVE',
}

// ---------------------------------------------------------------------------
// applyAutoEnrollmentRules
// ---------------------------------------------------------------------------
describe('applyAutoEnrollmentRules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // La transacción interactiva simplemente ejecuta el callback con mockPrisma como tx
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma)
    )
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'enroll-1' })
    mockPrisma.courseProgress.upsert.mockResolvedValue({})
  })

  it('retorna error si el colaborador no existe', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(null)

    const result = await applyAutoEnrollmentRules('nonexistent')

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/no encontrado/i)
  })

  it('retorna error si el colaborador está inactivo', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue({
      ...ACTIVE_COLLABORATOR,
      status: 'INACTIVE',
    })

    const result = await applyAutoEnrollmentRules('c1')

    expect(result.success).toBe(false)
    expect(mockPrisma.enrollmentRule.findMany).not.toHaveBeenCalled()
  })

  it('retorna éxito con enrollments vacíos si no hay reglas aplicables', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    mockPrisma.enrollmentRule.findMany.mockResolvedValue([])

    const result = await applyAutoEnrollmentRules('c1')

    expect(result.success).toBe(true)
    expect(result.enrollments).toHaveLength(0)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('crea inscripción AUTOMATIC + CourseProgress NOT_STARTED para regla de curso', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    mockPrisma.enrollmentRule.findMany.mockResolvedValue([
      { id: 'rule-1', courseId: 'course-1', learningPathId: null, learningPath: null },
    ])
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'enroll-new' })

    const result = await applyAutoEnrollmentRules('c1')

    expect(result.success).toBe(true)
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()

    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          courseId: 'course-1',
          collaboratorId: 'c1',
          type: 'AUTOMATIC',
          status: 'ACTIVE',
          ruleId: 'rule-1',
        }),
      })
    )
    expect(mockPrisma.courseProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          collaboratorId: 'c1',
          courseId: 'course-1',
          status: 'NOT_STARTED',
        }),
      })
    )
  })

  it('vincula CourseProgress al enrollmentId devuelto por el upsert', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    mockPrisma.enrollmentRule.findMany.mockResolvedValue([
      { id: 'rule-1', courseId: 'course-1', learningPathId: null, learningPath: null },
    ])
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'returned-enroll-id' })

    await applyAutoEnrollmentRules('c1')

    expect(mockPrisma.courseProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ enrollmentId: 'returned-enroll-id' }),
      })
    )
  })

  it('crea inscripción LP + por cada curso + CourseProgress para regla de ruta', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    mockPrisma.enrollmentRule.findMany.mockResolvedValue([
      {
        id: 'rule-lp',
        courseId: null,
        learningPathId: 'lp-1',
        learningPath: {
          id: 'lp-1',
          courses: [{ courseId: 'course-A' }, { courseId: 'course-B' }],
        },
      },
    ])
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'e-x' })

    const result = await applyAutoEnrollmentRules('c1')

    expect(result.success).toBe(true)
    // 1 LP + 2 cursos = 3 upsert de enrollment
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledTimes(3)
    // Solo los cursos individuales producen CourseProgress (no la inscripción de LP)
    expect(mockPrisma.courseProgress.upsert).toHaveBeenCalledTimes(2)

    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ learningPathId: 'lp-1', collaboratorId: 'c1' }),
      })
    )
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ courseId: 'course-A', collaboratorId: 'c1' }),
      })
    )
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ courseId: 'course-B', collaboratorId: 'c1' }),
      })
    )
  })

  it('incluye enrollments devueltos en el resultado final', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    mockPrisma.enrollmentRule.findMany.mockResolvedValue([
      { id: 'rule-1', courseId: 'course-1', learningPathId: null, learningPath: null },
    ])
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'enroll-ret' })

    const result = await applyAutoEnrollmentRules('c1')

    expect(result.enrollments).toHaveLength(1)
    expect(result.enrollments[0]).toEqual({ id: 'enroll-ret' })
  })
})

// ---------------------------------------------------------------------------
// removeInvalidAutoEnrollments
// ---------------------------------------------------------------------------
describe('removeInvalidAutoEnrollments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.enrollment.updateMany.mockResolvedValue({ count: 0 })
    mockPrisma.enrollment.update.mockResolvedValue({})
  })

  it('retorna error si el colaborador no existe', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(null)

    const result = await removeInvalidAutoEnrollments('nonexistent')

    expect(result.success).toBe(false)
    expect(mockPrisma.enrollment.findMany).not.toHaveBeenCalled()
  })

  it('retorna 0 cancelaciones cuando no hay inscripciones automáticas activas', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    mockPrisma.enrollment.findMany
      .mockResolvedValueOnce([]) // course enrollments
      .mockResolvedValueOnce([]) // LP enrollments

    const result = await removeInvalidAutoEnrollments('c1')

    expect(result.success).toBe(true)
    expect(result.cancelled).toBe(0)
    expect(mockPrisma.enrollment.updateMany).not.toHaveBeenCalled()
    expect(mockPrisma.enrollment.update).not.toHaveBeenCalled()
  })

  it('NO cancela inscripción de curso cuando su regla directa sigue aplicando', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    // Regla con siteId=site-A → coincide con el colaborador
    mockPrisma.enrollment.findMany
      .mockResolvedValueOnce([
        {
          id: 'enroll-ok',
          courseId: 'course-1',
          course: {
            enrollmentRules: [{ siteId: 'site-A', areaId: null, positionId: null }],
            pathCourses: [],
          },
        },
      ])
      .mockResolvedValueOnce([])

    const result = await removeInvalidAutoEnrollments('c1')

    expect(result.cancelled).toBe(0)
    expect(mockPrisma.enrollment.updateMany).not.toHaveBeenCalled()
  })

  it('cancela inscripción de curso cuando ninguna regla directa ni de LP coincide', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    // Regla con siteId=site-B → NO coincide con site-A del colaborador
    mockPrisma.enrollment.findMany
      .mockResolvedValueOnce([
        {
          id: 'enroll-bad',
          courseId: 'course-1',
          course: {
            enrollmentRules: [{ siteId: 'site-B', areaId: null, positionId: null }],
            pathCourses: [],
          },
        },
      ])
      .mockResolvedValueOnce([])

    const result = await removeInvalidAutoEnrollments('c1')

    expect(result.success).toBe(true)
    expect(result.cancelled).toBe(1)
    expect(mockPrisma.enrollment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['enroll-bad'] } }),
        data: { status: 'CANCELLED' },
      })
    )
  })

  it('NO cancela inscripción de curso cuando una regla de LP sigue aplicando', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    // Sin regla directa, pero la ruta tiene una regla que coincide
    mockPrisma.enrollment.findMany
      .mockResolvedValueOnce([
        {
          id: 'enroll-via-lp',
          courseId: 'course-1',
          course: {
            enrollmentRules: [],
            pathCourses: [
              {
                path: {
                  enrollmentRules: [{ siteId: 'site-A', areaId: null, positionId: null }],
                },
              },
            ],
          },
        },
      ])
      .mockResolvedValueOnce([])

    const result = await removeInvalidAutoEnrollments('c1')

    expect(result.cancelled).toBe(0)
    expect(mockPrisma.enrollment.updateMany).not.toHaveBeenCalled()
  })

  it('cancela inscripción LP y sus cursos asociados cuando la regla LP ya no aplica', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    // Regla de LP con siteId=site-B → NO coincide con site-A
    mockPrisma.enrollment.findMany
      .mockResolvedValueOnce([]) // no hay course enrollments directos
      .mockResolvedValueOnce([
        {
          id: 'enroll-lp',
          learningPathId: 'lp-1',
          ruleId: 'rule-lp',
          learningPath: {
            enrollmentRules: [{ siteId: 'site-B', areaId: null, positionId: null }],
            courses: [{ courseId: 'course-A' }, { courseId: 'course-B' }],
          },
        },
      ])
    mockPrisma.enrollment.updateMany.mockResolvedValue({ count: 2 })

    const result = await removeInvalidAutoEnrollments('c1')

    expect(result.success).toBe(true)
    expect(result.cancelled).toBe(3) // 2 cursos (updateMany count) + 1 LP (update)

    expect(mockPrisma.enrollment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          courseId: { in: ['course-A', 'course-B'] },
          status: 'ACTIVE',
        }),
        data: { status: 'CANCELLED' },
      })
    )
    expect(mockPrisma.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'enroll-lp' },
        data: { status: 'CANCELLED' },
      })
    )
  })

  it('NO cancela inscripción LP cuando su regla sigue siendo válida', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    // Regla con siteId=site-A → coincide
    mockPrisma.enrollment.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'enroll-lp',
          learningPathId: 'lp-1',
          ruleId: 'rule-lp',
          learningPath: {
            enrollmentRules: [{ siteId: 'site-A', areaId: null, positionId: null }],
            courses: [{ courseId: 'course-A' }],
          },
        },
      ])

    const result = await removeInvalidAutoEnrollments('c1')

    expect(result.cancelled).toBe(0)
    expect(mockPrisma.enrollment.update).not.toHaveBeenCalled()
    expect(mockPrisma.enrollment.updateMany).not.toHaveBeenCalled()
  })

  it('cancela solo cursos del LP invalidado, no los de otro LP que sigue activo', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(ACTIVE_COLLABORATOR)
    mockPrisma.enrollment.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'enroll-lp-bad',
          learningPathId: 'lp-bad',
          ruleId: 'rule-bad',
          learningPath: {
            enrollmentRules: [{ siteId: 'site-B', areaId: null, positionId: null }], // no coincide
            courses: [{ courseId: 'course-X' }],
          },
        },
        {
          id: 'enroll-lp-ok',
          learningPathId: 'lp-ok',
          ruleId: 'rule-ok',
          learningPath: {
            enrollmentRules: [{ siteId: 'site-A', areaId: null, positionId: null }], // coincide
            courses: [{ courseId: 'course-Y' }],
          },
        },
      ])
    mockPrisma.enrollment.updateMany.mockResolvedValue({ count: 1 })

    const result = await removeInvalidAutoEnrollments('c1')

    expect(result.cancelled).toBe(2) // 1 curso + 1 LP del ruleId="rule-bad"
    // Solo se cancela el LP malo
    expect(mockPrisma.enrollment.update).toHaveBeenCalledTimes(1)
    expect(mockPrisma.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'enroll-lp-bad' } })
    )
    // No el bueno
    expect(mockPrisma.enrollment.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'enroll-lp-ok' } })
    )
  })
})

// ---------------------------------------------------------------------------
// applyEnrollmentRule
// ---------------------------------------------------------------------------
describe('applyEnrollmentRule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma)
    )
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'e-new' })
    mockPrisma.courseProgress.upsert.mockResolvedValue({})
  })

  it('no hace nada si la regla no existe', async () => {
    mockPrisma.enrollmentRule.findUnique.mockResolvedValue(null)

    await applyEnrollmentRule('nonexistent')

    expect(mockPrisma.collaborator.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('no hace nada si la regla está inactiva', async () => {
    mockPrisma.enrollmentRule.findUnique.mockResolvedValue({
      id: 'r1',
      isActive: false,
      courseId: 'c1',
      learningPathId: null,
      learningPath: null,
      siteId: null,
      areaId: null,
      positionId: null,
    })

    await applyEnrollmentRule('r1')

    expect(mockPrisma.collaborator.findMany).not.toHaveBeenCalled()
  })

  it('no crea inscripciones si ningún colaborador cumple los criterios', async () => {
    mockPrisma.enrollmentRule.findUnique.mockResolvedValue({
      id: 'r1',
      isActive: true,
      courseId: 'course-X',
      learningPathId: null,
      learningPath: null,
      siteId: 'site-Z',
      areaId: null,
      positionId: null,
    })
    mockPrisma.collaborator.findMany.mockResolvedValue([])

    await applyEnrollmentRule('r1')

    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('filtra colaboradores por todos los criterios de la regla (sede + área + puesto)', async () => {
    mockPrisma.enrollmentRule.findUnique.mockResolvedValue({
      id: 'r1',
      isActive: true,
      courseId: 'course-X',
      learningPathId: null,
      learningPath: null,
      siteId: 'site-A',
      areaId: 'area-B',
      positionId: 'pos-C',
    })
    mockPrisma.collaborator.findMany.mockResolvedValue([])

    await applyEnrollmentRule('r1')

    expect(mockPrisma.collaborator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          siteId: 'site-A',
          areaId: 'area-B',
          positionId: 'pos-C',
        }),
      })
    )
  })

  it('crea enrollment AUTOMATIC + CourseProgress para cada colaborador (regla de curso)', async () => {
    mockPrisma.enrollmentRule.findUnique.mockResolvedValue({
      id: 'r1',
      isActive: true,
      courseId: 'course-X',
      learningPathId: null,
      learningPath: null,
      siteId: 'site-A',
      areaId: null,
      positionId: null,
    })
    mockPrisma.collaborator.findMany.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'e-new' })

    await applyEnrollmentRule('r1')

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
    // 2 colaboradores × 1 curso = 2 enrollment upsert + 2 courseProgress upsert
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledTimes(2)
    expect(mockPrisma.courseProgress.upsert).toHaveBeenCalledTimes(2)
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          courseId: 'course-X',
          type: 'AUTOMATIC',
          status: 'ACTIVE',
          ruleId: 'r1',
        }),
      })
    )
  })

  it('crea LP + por-curso enrollments + CourseProgress para regla de ruta', async () => {
    mockPrisma.enrollmentRule.findUnique.mockResolvedValue({
      id: 'r-lp',
      isActive: true,
      courseId: null,
      learningPathId: 'lp-1',
      siteId: null,
      areaId: 'area-A',
      positionId: null,
      learningPath: {
        id: 'lp-1',
        courses: [{ courseId: 'c-A' }, { courseId: 'c-B' }],
      },
    })
    mockPrisma.collaborator.findMany.mockResolvedValue([{ id: 'collab-1' }])
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'e-new' })

    await applyEnrollmentRule('r-lp')

    // 1 collab: 1 LP + 2 cursos = 3 enrollment upsert; solo 2 cursos producen CourseProgress
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledTimes(3)
    expect(mockPrisma.courseProgress.upsert).toHaveBeenCalledTimes(2)

    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          learningPathId: 'lp-1',
          collaboratorId: 'collab-1',
          ruleId: 'r-lp',
        }),
      })
    )
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ courseId: 'c-A', collaboratorId: 'collab-1' }),
      })
    )
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ courseId: 'c-B', collaboratorId: 'collab-1' }),
      })
    )
  })

  it('crea inscripciones independientes para múltiples colaboradores en regla de LP', async () => {
    mockPrisma.enrollmentRule.findUnique.mockResolvedValue({
      id: 'r-lp',
      isActive: true,
      courseId: null,
      learningPathId: 'lp-1',
      siteId: 'site-A',
      areaId: null,
      positionId: null,
      learningPath: {
        id: 'lp-1',
        courses: [{ courseId: 'c-1' }],
      },
    })
    mockPrisma.collaborator.findMany.mockResolvedValue([{ id: 'x1' }, { id: 'x2' }])
    mockPrisma.enrollment.upsert.mockResolvedValue({ id: 'e-new' })

    await applyEnrollmentRule('r-lp')

    // 2 collabs × (1 LP + 1 curso) = 4 enrollment upsert; 2 courseProgress (1 por collab por curso)
    expect(mockPrisma.enrollment.upsert).toHaveBeenCalledTimes(4)
    expect(mockPrisma.courseProgress.upsert).toHaveBeenCalledTimes(2)
  })

  it('no crea nada cuando la regla activa no tiene courseId ni learningPathId', async () => {
    mockPrisma.enrollmentRule.findUnique.mockResolvedValue({
      id: 'r-empty',
      isActive: true,
      courseId: null,
      learningPathId: null,
      learningPath: null,
      siteId: null,
      areaId: null,
      positionId: null,
    })
    mockPrisma.collaborator.findMany.mockResolvedValue([{ id: 'c1' }])

    await applyEnrollmentRule('r-empty')

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
    expect(mockPrisma.enrollment.upsert).not.toHaveBeenCalled()
    expect(mockPrisma.courseProgress.upsert).not.toHaveBeenCalled()
  })
})
