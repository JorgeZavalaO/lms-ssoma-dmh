/**
 * Cálculo de avance permitido y valor capado para progreso de lecciones (anti-salto).
 *
 * Contrato:
 * - prevView: porcentaje previo persistido [0..100]
 * - requestedView: porcentaje solicitado por el cliente [0..100]
 * - serverDeltaSec: segundos transcurridos desde el último update medidos por el servidor (puede ser undefined si no hay lastViewedAt)
 * - clientDeltaSec: segundos reportados por el cliente reproducidos desde el último update (puede ser 0 o undefined)
 * - durationSec: duración total del recurso en segundos (opcional, para cálculo más preciso)
 *
 * Retorna:
 * - cappedView: porcentaje final a persistir tras aplicar límites [prevView..100]
 * - allowedDeltaPct: incremento máximo permitido para este update, en porcentaje
 */
export function capLessonProgress(
  prevView: number,
  requestedView: number,
  serverDeltaSec: number | undefined,
  clientDeltaSec: number | undefined,
  durationSec?: number | null
): { cappedView: number; allowedDeltaPct: number } {
  const safePrev = clamp(prevView, 0, 100)
  const safeRequested = clamp(requestedView, 0, 100)

  const clientDelta = Math.max(0, clientDeltaSec ?? 0)
  const effectiveDeltaSec = serverDeltaSec !== undefined
    ? Math.max(0, Math.min(clientDelta, serverDeltaSec + 3)) // tolerancia 3s
    : clientDelta

  let allowedDeltaPct = 0
  if (durationSec && durationSec > 0) {
    // Permitir hasta 1.6x del tiempo reproducido real vs. duración total (en %)
    allowedDeltaPct = Math.ceil((effectiveDeltaSec / durationSec) * 100 * 1.6)
    if (effectiveDeltaSec > 0) allowedDeltaPct = Math.max(1, allowedDeltaPct)
  } else {
    // Fallback cuando no hay duración: 5% por cada 30s efectivos
    allowedDeltaPct = Math.ceil((effectiveDeltaSec / 30) * 5)
    if (effectiveDeltaSec > 0) allowedDeltaPct = Math.max(1, allowedDeltaPct)
  }

  const maxAllowed = Math.min(100, safePrev + allowedDeltaPct)
  const cappedView = clamp(Math.max(safePrev, Math.min(safeRequested, maxAllowed)), safePrev, 100)

  return { cappedView, allowedDeltaPct }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
