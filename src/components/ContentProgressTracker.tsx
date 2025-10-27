// src/components/ContentProgressTracker.tsx
"use client"
import { useEffect, useRef } from "react"

type Props = {
  lessonType: "PDF" | "PPT" | "HTML" | "SCORM"
  estimatedDurationMinutes?: number // Duración estimada en minutos
  onProgress: (data: {
    percentage: number
    currentTime: number
    duration: number
    completed: boolean
    timeDeltaSeconds: number
  }) => void
  pollIntervalMs?: number
  completionThreshold?: number
  autoStart?: boolean
}

export function ContentProgressTracker({
  lessonType,
  estimatedDurationMinutes = 10, // Por defecto 10 minutos
  onProgress,
  pollIntervalMs = 30000, // 30 segundos por defecto
  completionThreshold = 80,
  autoStart = true,
}: Props) {
  const startTimeRef = useRef<number | null>(null)
  const lastReportedTimeRef = useRef<number>(0)
  const lastSentPercentageRef = useRef<number>(0)
  const isActiveRef = useRef<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const estimatedDurationSeconds = estimatedDurationMinutes * 60

  useEffect(() => {
    if (!autoStart) return

    // Iniciar tracking
    startTimeRef.current = Date.now()
    isActiveRef.current = true

    const sendProgress = () => {
      if (!isActiveRef.current || !startTimeRef.current) return

      const now = Date.now()
      const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000)
      const timeDelta = elapsedSeconds - lastReportedTimeRef.current

      // Calcular porcentaje basado en tiempo transcurrido vs duración estimada
      const percentage = Math.min(
        100,
        Math.round((elapsedSeconds / estimatedDurationSeconds) * 100)
      )

      // Solo enviar si cambió significativamente o pasó suficiente tiempo
      const percentageChanged = percentage - lastSentPercentageRef.current >= 5
      const timeChanged = timeDelta >= 30

      if (percentageChanged || timeChanged) {
        lastSentPercentageRef.current = percentage
        lastReportedTimeRef.current = elapsedSeconds

        onProgress({
          percentage,
          currentTime: elapsedSeconds,
          duration: estimatedDurationSeconds,
          completed: percentage >= completionThreshold,
          timeDeltaSeconds: timeDelta,
        })
      }
    }

    // Enviar progreso inicial
    sendProgress()

    // Configurar intervalo
    intervalRef.current = setInterval(sendProgress, pollIntervalMs)

    // Detectar cuando el usuario está activo (movimiento del mouse, scroll, clicks)
    const handleActivity = () => {
      isActiveRef.current = true
    }

    const handleInactive = () => {
      isActiveRef.current = false
    }

    // Detectar visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false
      } else {
        isActiveRef.current = true
        // Reiniciar el contador si la página vuelve a estar visible
        if (!startTimeRef.current) {
          startTimeRef.current = Date.now()
        }
      }
    }

    // Event listeners para detectar actividad
    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("scroll", handleActivity)
    window.addEventListener("click", handleActivity)
    window.addEventListener("keydown", handleActivity)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Pausar después de 2 minutos de inactividad
    let inactivityTimer: NodeJS.Timeout
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(handleInactive, 120000) // 2 minutos
    }

    window.addEventListener("mousemove", resetInactivityTimer)
    window.addEventListener("scroll", resetInactivityTimer)
    window.addEventListener("click", resetInactivityTimer)
    window.addEventListener("keydown", resetInactivityTimer)

    resetInactivityTimer()

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      clearTimeout(inactivityTimer)
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("scroll", handleActivity)
      window.removeEventListener("click", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      window.removeEventListener("mousemove", resetInactivityTimer)
      window.removeEventListener("scroll", resetInactivityTimer)
      window.removeEventListener("click", resetInactivityTimer)
      window.removeEventListener("keydown", resetInactivityTimer)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [
    autoStart,
    estimatedDurationSeconds,
    onProgress,
    pollIntervalMs,
    completionThreshold,
  ])

  // Este componente no renderiza nada, solo hace tracking
  return null
}
