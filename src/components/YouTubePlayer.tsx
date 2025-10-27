// src/components/YouTubePlayer.tsx
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
  const lastSent = useRef<number>(0)
  const lastReportedTime = useRef<number>(0)

  // Extrae videoId de distintas urls
  const extractId = (url: string) => {
    if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0]
    if (url.includes("v=")) return url.split("v=")[1].split("&")[0]
    // fallback: last segment
    return url.split("/").pop()
  }

  useEffect(() => {
    const id = extractId(videoUrl)
    if (!id) return

    // cargar script YT si no existe
    if (typeof (window as any).YT === "undefined") {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.body.appendChild(tag)
    }

    const onAPILoad = () => {
      if (!containerRef.current) return
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
          onStateChange: (e: any) => {
            // Si empieza a reproducir arrancamos polling
            // (no hacemos heavy work aquí)
          },
        },
      })
    }

    // YouTube API define window.onYouTubeIframeAPIReady
    if ((window as any).YT && (window as any).YT.Player) {
      onAPILoad()
    } else {
      ;(window as any).onYouTubeIframeAPIReady = onAPILoad
    }

    // polling para currentTime mientras reproduciendo
    let pollHandle: number | undefined
    const startPolling = () => {
      if (pollHandle) return
      pollHandle = window.setInterval(() => {
        const p = playerRef.current
        if (!p || typeof p.getPlayerState !== "function") return
        const state = p.getPlayerState()
        // 1 = playing
        if (state === 1) {
          const currentTime = Math.floor(p.getCurrentTime() || 0)
          const duration = Math.floor(p.getDuration() || 0) || 1
          const percent = Math.round((currentTime / duration) * 100)
          const now = Date.now()
          const timeDelta = currentTime - (lastReportedTime.current || 0)
          // decide si enviar: umbral o tiempo
          if (percent - (lastSent.current || 0) >= 5 || now - (lastSent.current || 0) > 10000) {
            lastSent.current = percent
            lastReportedTime.current = currentTime
            onProgress({ percentage: percent, currentTime, duration, completed: percent >= completionThreshold, timeDeltaSeconds: Math.max(0, timeDelta) })
          }
        }
      }, pollIntervalMs)
    }

    // Observamos play/pause para empezar/stop polling
    const checkStateLoop = setInterval(() => {
      const p = playerRef.current
      if (!p || typeof p.getPlayerState !== "function") return
      const st = p.getPlayerState()
      if (st === 1) startPolling()
      else if (st === 2 && pollHandle) { // paused
        clearInterval(pollHandle); pollHandle = undefined
      }
    }, 1000)

    return () => {
      if (pollHandle) clearInterval(pollHandle)
      clearInterval(checkStateLoop)
      try { playerRef.current?.destroy() } catch {}
    }
  }, [videoUrl, onProgress, pollIntervalMs, completionThreshold])

  return <div ref={containerRef} id={`yt-player-${extractId(videoUrl)}`} style={{ width: "100%", height: "100%" }} />
}
