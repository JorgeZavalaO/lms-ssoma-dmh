"use client"
import React, { useEffect, useRef } from "react"

type Props = {
  videoUrl: string
  onProgress: (data: { percentage: number; currentTime: number; duration: number; completed: boolean; timeDeltaSeconds: number }) => void
  pollIntervalMs?: number
  completionThreshold?: number // default 80
}

export function YouTubePlayer({ videoUrl, onProgress, pollIntervalMs = 2000, completionThreshold = 80 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  // Mantener referencias separadas para porcentaje enviado y timestamp del último envío
  const lastPercentSentRef = useRef<number>(0)
  const lastSentAtMsRef = useRef<number>(0)
  const lastReportedTime = useRef<number>(0)
  // Guardar props variables en refs para evitar re-crear el player o efectos pesados
  const onProgressRef = useRef(onProgress)
  const completionThresholdRef = useRef(completionThreshold)
  const pollIntervalMsRef = useRef(pollIntervalMs)

  // Extrae videoId de distintas urls
  const extractId = (url: string) => {
    if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0]
    if (url.includes("v=")) return url.split("v=")[1].split("&")[0]
    // fallback: last segment
    return url.split("/").pop()
  }

  // Mantener refs sincronizadas con props sin forzar re-creación del player
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => { completionThresholdRef.current = completionThreshold }, [completionThreshold])
  useEffect(() => { pollIntervalMsRef.current = pollIntervalMs }, [pollIntervalMs])

  // Crear y (solo) volver a crear el player cuando cambie el videoUrl
  useEffect(() => {
    const id = extractId(videoUrl)
    if (!id) return

    // Reset de estado de envío al cambiar de video
    lastPercentSentRef.current = 0
    lastSentAtMsRef.current = 0
    lastReportedTime.current = 0

    // cargar script YT si no existe
    if (typeof (window as any).YT === "undefined" || !(window as any).YT.Player) {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]') as HTMLScriptElement | null
      if (!existingScript) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        document.body.appendChild(tag)
      }
    }

    const onAPILoad = () => {
      if (!containerRef.current) return
      try {
        playerRef.current = new (window as any).YT.Player(containerRef.current, {
          height: "100%",
          width: "100%",
          videoId: id,
          playerVars: {
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
          },
          events: {
            onStateChange: () => {
             },
          },
        })
      } catch {}
    }

    if ((window as any).YT && (window as any).YT.Player) {
      onAPILoad()
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady
      ;(window as any).onYouTubeIframeAPIReady = () => {
        try { prev?.() } catch {}
        onAPILoad()
      }
    }

    return () => {
      try { playerRef.current?.destroy() } catch {}
      playerRef.current = null
    }
  }, [videoUrl])

  // Polling liviano que no re-crea el player al cambiar onProgress o thresholds
  useEffect(() => {
    const loop = () => {
      const p = playerRef.current
      if (!p || typeof p.getPlayerState !== "function") return
      const state = p.getPlayerState()
      // Solo enviar mientras está reproduciendo (1 = playing)
      if (state === 1) {
        const currentTime = Math.floor(p.getCurrentTime() || 0)
        const duration = Math.floor(p.getDuration() || 0) || 1
        const percent = Math.round((currentTime / duration) * 100)
        const now = Date.now()
        const timeDelta = currentTime - (lastReportedTime.current || 0)

        const shouldSendByStep = percent - (lastPercentSentRef.current || 0) >= 5
        const shouldSendByTime = now - (lastSentAtMsRef.current || 0) > 10000
        if (shouldSendByStep || shouldSendByTime) {
          lastPercentSentRef.current = percent
          lastSentAtMsRef.current = now
          lastReportedTime.current = currentTime
          const completed = percent >= (completionThresholdRef.current || 80)
          try {
            onProgressRef.current?.({
              percentage: percent,
              currentTime,
              duration,
              completed,
              timeDeltaSeconds: Math.max(0, timeDelta),
            })
          } catch {}
        }
      }
    }

  const intervalId = window.setInterval(loop, Math.max(500, pollIntervalMsRef.current || 2000))

    return () => {
      clearInterval(intervalId)
    }
  }, [videoUrl])

  return <div ref={containerRef} id={`yt-player-${extractId(videoUrl)}`} style={{ width: "100%", height: "100%" }} />
}
