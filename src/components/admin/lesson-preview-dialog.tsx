"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, AlertCircle } from "lucide-react"

interface LessonPreviewDialogProps {
  lesson: {
    id: string
    title: string
    description?: string | null
    type: string
    duration?: number | null
    completionThreshold: number
    videoUrl?: string | null
    fileUrl?: string | null
    htmlContent?: string | null
  }
}

const lessonTypeLabels: Record<string, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  PPT: "Presentación",
  HTML: "HTML",
  SCORM: "SCORM",
}

const lessonTypeColors: Record<string, string> = {
  VIDEO: "bg-red-500/10 text-red-500 border-red-500/20",
  PDF: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PPT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  HTML: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  SCORM: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
}

export function LessonPreviewDialog({ lesson }: LessonPreviewDialogProps) {
  const [open, setOpen] = React.useState(false)

  const isYoutubeUrl = lesson.videoUrl && 
    (lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be"))
  
  const isVimeoUrl = lesson.videoUrl && lesson.videoUrl.includes("vimeo.com")

  // Extraer ID de YouTube
  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = ""
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0]
    } else if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1].split("&")[0]
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  // Extraer ID de Vimeo
  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.split("vimeo.com/")[1].split("?")[0]
    return `https://player.vimeo.com/video/${videoId}`
  }

  const embedUrl = isYoutubeUrl 
    ? getYoutubeEmbedUrl(lesson.videoUrl!)
    : isVimeoUrl
    ? getVimeoEmbedUrl(lesson.videoUrl!)
    : null

  const canPreview = 
    lesson.type === "VIDEO" && embedUrl

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!canPreview}
        title={!canPreview ? "No se puede previsualizar este tipo de contenido" : "Ver previsualización"}
      >
        <Eye className="h-4 w-4 mr-1" />
        Previsualizar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lesson.title}</DialogTitle>
            <DialogDescription>
              Previsualización de la lección
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Metadata */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
                <Badge 
                  variant="outline" 
                  className={lessonTypeColors[lesson.type]}
                >
                  {lessonTypeLabels[lesson.type] || lesson.type}
                </Badge>
              </div>
              
              {lesson.duration && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Duración:</span>
                  <span className="text-sm">{lesson.duration} minutos</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Umbral de completado:</span>
                <span className="text-sm">{lesson.completionThreshold}%</span>
              </div>

              {lesson.description && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Descripción:</span>
                  <p className="text-sm text-foreground">{lesson.description}</p>
                </div>
              )}
            </div>

            {/* Video Preview */}
            {lesson.type === "VIDEO" && embedUrl ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Vista Previa del Video</h3>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title={lesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            ) : lesson.type === "VIDEO" && lesson.videoUrl ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Video URL</h3>
                <div className="bg-muted/50 p-3 rounded-lg break-all text-sm">
                  {lesson.videoUrl}
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    Este video no es de YouTube ni Vimeo. Por favor, verifica la URL manualmente.
                  </div>
                </div>
              </div>
            ) : lesson.type === "HTML" && lesson.htmlContent ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Contenido HTML</h3>
                <div className="bg-muted/50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: lesson.htmlContent }}
                  />
                </div>
              </div>
            ) : lesson.fileUrl ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Archivo</h3>
                <div className="bg-muted/50 p-3 rounded-lg break-all text-sm">
                  {lesson.fileUrl}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(lesson.fileUrl!, "_blank")}
                >
                  Descargar/Abrir archivo
                </Button>
              </div>
            ) : (
              <div className="bg-muted/50 p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  No hay contenido disponible para previsualizar
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
