"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Video,
  FileCode,
  BookOpen,
  PlayCircle,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { YouTubePlayer } from "@/components/media/YouTubePlayer"
import { ContentProgressTracker } from "@/components/learning/ContentProgressTracker"

interface ClientLessonViewProps {
  lesson: any
  progress: any
  allUnits: any[]
  courseId: string
  collaboratorId: string
}

const lessonTypeIcons = {
  VIDEO: Video,
  PDF: FileText,
  PPT: FileText,
  HTML: FileCode,
  SCORM: BookOpen,
}

const lessonTypeLabels = {
  VIDEO: "Video",
  PDF: "PDF",
  PPT: "Presentación",
  HTML: "Contenido",
  SCORM: "SCORM",
}

export function ClientLessonView({
  lesson,
  progress,
  allUnits,
  courseId,
}: ClientLessonViewProps) {
  const [viewPercentage, setViewPercentage] = useState(progress?.viewPercentage || 0)
  const [isCompleted, setIsCompleted] = useState(progress?.completed || false)
  // Tiempo activo en el documento (para no-video), en segundos
  const [docElapsedSeconds, setDocElapsedSeconds] = useState<number>(0)

  // Calcular lecciones completadas
  const totalLessons = allUnits.reduce((acc, unit) => acc + unit.lessons.length, 0)
  const completedLessons = allUnits.reduce((acc, unit) => {
    return acc + unit.lessons.filter((l: any) => l.id === lesson.id && isCompleted ? 1 : 0).length
  }, 0)

  // Encontrar lección siguiente
  const allLessons = allUnits.flatMap((unit) =>
    unit.lessons.map((l: any) => ({ ...l, unitId: unit.id, unitTitle: unit.title }))
  )
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id)
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Callback para actualizar progreso desde YouTubePlayer
  const handleProgressCallback = async ({
    percentage,
    currentTime,
    duration,
    completed,
    timeDeltaSeconds,
    manualComplete,
  }: {
    percentage: number
    currentTime: number
    duration: number
    completed: boolean
    timeDeltaSeconds: number
    manualComplete?: boolean
  }) => {
    // Para lecciones que no son video, aprovechar el tiempo acumulado del tracker
    if (lesson.type !== "VIDEO") {
      setDocElapsedSeconds(currentTime)
    }
    // Evitar retroceso de porcentaje (debounce en cliente)
    if (percentage < viewPercentage && !completed) {
      return // No enviar si el porcentaje retrocede
    }

    // Actualizar estado local inmediatamente
    setViewPercentage(percentage)
    if (completed && !isCompleted) {
      setIsCompleted(true)
    }

    // Enviar al API
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewPercentage: percentage,
          // Soporte anti-salto en servidor
          duration,
          timeDeltaSeconds,
          completed,
          // Marcación manual solo aplica a no-video
          manualComplete,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (completed && !isCompleted) {
          toast.success("¡Lección completada!")
        }
        return data
      } else {
        console.error("Error updating progress:", response.status)
      }
    } catch (error) {
      console.error("Error updating lesson progress:", error)
    }
  }

  const handleMarkComplete = async () => {
    const isVideo = lesson.type === "VIDEO"
    await handleProgressCallback({
      percentage: 100,
      currentTime: isVideo ? 0 : docElapsedSeconds,
      duration: isVideo ? 0 : (lesson.duration ? lesson.duration * 60 : 0),
      completed: true,
      timeDeltaSeconds: 0,
      manualComplete: !isVideo, // para no-video forzamos completado en servidor
    })
  }

  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.split("vimeo.com/")[1].split("?")[0]
    return `https://player.vimeo.com/video/${videoId}`
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar izquierda */}
      <aside className="w-80 border-r bg-card flex flex-col">
        {/* Header del curso */}
        <div className="p-4 border-b">
          <Link 
            href={`/courses/${courseId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Volver al curso</span>
          </Link>
          <h2 className="font-semibold text-sm line-clamp-2">{lesson.unit.course.name}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {lesson.unit.course.code}
          </p>
        </div>

        {/* Progreso general */}
        <div className="p-4 border-b">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progreso</span>
              <span className="text-sm text-muted-foreground">
                {completedLessons}/{totalLessons} lecciones
              </span>
            </div>
            <Progress value={(completedLessons / totalLessons) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round((completedLessons / totalLessons) * 100)}% completo
            </p>
          </div>
        </div>

        {/* Lista de unidades y lecciones */}
        <div className="flex-1 overflow-y-auto">
          <Accordion type="multiple" defaultValue={allUnits.map((u) => u.id)} className="w-full">
            {allUnits.map((unit, unitIndex) => (
              <AccordionItem key={unit.id} value={unit.id} className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline text-left">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">
                        {unitIndex + 1}. {unit.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {unit.lessons.length} lección{unit.lessons.length !== 1 ? "es" : ""}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-0">
                  <div className="space-y-0.5">
                    {unit.lessons.map((l: any, lessonIndex: number) => {
                      const isCurrentLesson = l.id === lesson.id
                      const Icon = lessonTypeIcons[l.type as keyof typeof lessonTypeIcons] || FileText
                      const isLessonCompleted = l.id === lesson.id && isCompleted

                      return (
                        <Link
                          key={l.id}
                          href={`/courses/${courseId}/lessons/${l.id}`}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 transition-colors",
                            isCurrentLesson
                              ? "bg-primary/10 text-primary border-l-2 border-primary"
                              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="shrink-0">
                            {isLessonCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : isCurrentLesson ? (
                              <PlayCircle className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-sm line-clamp-2",
                              isCurrentLesson && "font-medium"
                            )}>
                              {lessonIndex + 1}. {l.title}
                            </div>
                            {l.duration && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Icon className="h-3 w-3" />
                                <span>{l.duration} min</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </aside>

      {/* Área principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Video/Contenido principal */}
        <div className="bg-black flex items-center justify-center" style={{ height: "calc(100vh - 300px)" }}>
          {lesson.type === "VIDEO" && lesson.videoUrl && (
            <>
              {lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be") ? (
                <YouTubePlayer
                  videoUrl={lesson.videoUrl}
                  completionThreshold={lesson.completionThreshold}
                  onProgress={async ({ percentage, currentTime, duration, completed, timeDeltaSeconds }) => {
                    // Envío eficiente: solo enviar si hay cambios significativos
                    await handleProgressCallback({
                      percentage,
                      currentTime,
                      duration,
                      completed,
                      timeDeltaSeconds,
                    })
                  }}
                  pollIntervalMs={2000}
                />
              ) : lesson.videoUrl.includes("vimeo.com") ? (
                <iframe
                  src={getVimeoEmbedUrl(lesson.videoUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                />
              ) : (
                <video src={lesson.videoUrl} controls className="w-full h-full" />
              )}
            </>
          )}

          {lesson.type === "PDF" && lesson.fileUrl && (
            <>
              <iframe src={lesson.fileUrl} className="w-full h-full" title={lesson.title} />
              <ContentProgressTracker
                lessonType="PDF"
                estimatedDurationMinutes={lesson.duration || 10}
                onProgress={handleProgressCallback}
                pollIntervalMs={30000}
                completionThreshold={lesson.completionThreshold}
                autoStart={true}
              />
            </>
          )}

          {lesson.type === "HTML" && lesson.htmlContent && (
            <>
              <div className="w-full h-full overflow-auto bg-white p-8">
                <div
                  className="prose prose-sm max-w-4xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: lesson.htmlContent }}
                />
              </div>
              <ContentProgressTracker
                lessonType="HTML"
                estimatedDurationMinutes={lesson.duration || 10}
                onProgress={handleProgressCallback}
                pollIntervalMs={30000}
                completionThreshold={lesson.completionThreshold}
                autoStart={true}
              />
            </>
          )}

          {lesson.type === "PPT" && lesson.fileUrl && (
            <>
              <div className="text-center p-8 text-white">
                <FileText className="h-16 w-16 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Presentación</h3>
                <p className="text-sm mb-4 text-gray-300">Descarga la presentación para visualizarla</p>
                <Button asChild variant="secondary">
                  <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer" download>
                    Descargar Presentación
                  </a>
                </Button>
              </div>
              <ContentProgressTracker
                lessonType="PPT"
                estimatedDurationMinutes={lesson.duration || 10}
                onProgress={handleProgressCallback}
                pollIntervalMs={30000}
                completionThreshold={lesson.completionThreshold}
                autoStart={true}
              />
            </>
          )}

          {lesson.type === "SCORM" && lesson.fileUrl && (
            <>
              <iframe src={lesson.fileUrl} className="w-full h-full" title={lesson.title} />
              <ContentProgressTracker
                lessonType="SCORM"
                estimatedDurationMinutes={lesson.duration || 10}
                onProgress={handleProgressCallback}
                pollIntervalMs={30000}
                completionThreshold={lesson.completionThreshold}
                autoStart={true}
              />
            </>
          )}

          {!lesson.videoUrl && !lesson.fileUrl && !lesson.htmlContent && (
            <div className="text-center p-8 text-gray-400">
              <Video className="h-16 w-16 mx-auto mb-4" />
              <p>Contenido no disponible</p>
            </div>
          )}
        </div>

        {/* Panel inferior */}
        <div className="flex-1 overflow-y-auto border-t bg-card">
          <div className="p-6 space-y-6">
            {/* Header de la lección */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {lessonTypeLabels[lesson.type as keyof typeof lessonTypeLabels]}
                </Badge>
                {lesson.duration && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {lesson.duration} min
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-green-500 text-white text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completada
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-muted-foreground">{lesson.description}</p>
              )}
            </div>

            <Separator />

            {/* Progreso de la lección */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progreso de visualización</span>
                <span className="text-sm text-muted-foreground">{viewPercentage}%</span>
              </div>
              <Progress value={viewPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Completa al menos el {lesson.completionThreshold}% para marcar como completada
              </p>
            </div>

            {/* Botón de marcar como completada */}
            {!isCompleted && (
              <>
                {lesson.type === "VIDEO" ? (
                  // Para video: botón habilitado al superar el umbral configurado
                  viewPercentage >= lesson.completionThreshold && (
                    <Button onClick={handleMarkComplete} className="w-full sm:w-auto" size="lg">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Completada
                    </Button>
                  )
                ) : (
                  // Para no-video: botón aparece deshabilitado hasta cumplir 3 minutos activos
                  <Button
                    onClick={handleMarkComplete}
                    className="w-full sm:w-auto"
                    size="lg"
                    disabled={docElapsedSeconds < 180}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {docElapsedSeconds < 180
                      ? "Marcar como Completada (disponible tras 3 min)"
                      : "Marcar como Completada"}
                  </Button>
                )}
              </>
            )}

            {/* Información adicional */}
            {lesson.unit.description && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Sobre esta unidad</h3>
                  <p className="text-sm text-muted-foreground">{lesson.unit.description}</p>
                </div>
              </>
            )}

            {/* Navegación siguiente lección */}
            {nextLesson && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Siguiente lección</h3>
                  <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="h-8 w-8 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">{nextLesson.title}</div>
                          {nextLesson.duration && (
                            <div className="text-xs text-muted-foreground">
                              {nextLesson.duration} minutos
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
