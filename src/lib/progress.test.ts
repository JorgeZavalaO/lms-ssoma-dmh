import { describe, it, expect } from 'vitest'
import { capLessonProgress } from './progress'

describe('capLessonProgress', () => {
  it('permite avance proporcional con duración conocida', () => {
    const prev = 0
    const requested = 15
    const duration = 200 // s
    const serverDelta = 20 // s
    const clientDelta = 20 // s
    const { cappedView, allowedDeltaPct } = capLessonProgress(prev, requested, serverDelta, clientDelta, duration)
    // allowed = ceil((20/200)*100*1.6) = ceil(16) = 16
    expect(allowedDeltaPct).toBe(16)
    expect(cappedView).toBe(15)
  })

  it('cap al máximo permitido cuando requested supera lo permitido', () => {
    const prev = 0
    const requested = 50
    const duration = 200
    const serverDelta = 10
    const clientDelta = 100 // cliente reporta más, pero servidor limita
    const { cappedView, allowedDeltaPct } = capLessonProgress(prev, requested, serverDelta, clientDelta, duration)
    // effectiveDelta = min(100, 10+3) = 13 => allowed = ceil((13/200)*100*1.6)=ceil(10.4)=11
    expect(allowedDeltaPct).toBe(11)
    expect(cappedView).toBe(11)
  })

  it('fallback sin duración: 5% por cada 30s', () => {
    const prev = 0
    const requested = 50
    const duration = undefined
    const serverDelta = 60
    const clientDelta = 60
    const { cappedView, allowedDeltaPct } = capLessonProgress(prev, requested, serverDelta, clientDelta, duration)
    // allowed = ceil((60/30)*5) = 10
    expect(allowedDeltaPct).toBe(10)
    expect(cappedView).toBe(10)
  })

  it('no reduce progreso: requested menor que previo mantiene previo', () => {
    const prev = 40
    const requested = 30
    const { cappedView } = capLessonProgress(prev, requested, 10, 10, 200)
    expect(cappedView).toBe(40)
  })

  it('si hay delta efectivo > 0, al menos 1%', () => {
    const prev = 0
    const requested = 0 // aunque cliente pida 0, si hubo delta>0 el allowed >=1 pero cap mantiene prev
    const { allowedDeltaPct, cappedView } = capLessonProgress(prev, requested, 1, 1, 10000)
    expect(allowedDeltaPct).toBeGreaterThanOrEqual(1)
    expect(cappedView).toBe(0)
  })

  it('nunca supera 100%', () => {
    const prev = 95
    const requested = 200
    const { cappedView } = capLessonProgress(prev, requested, 500, 500, 100)
    expect(cappedView).toBeLessThanOrEqual(100)
  })
})
