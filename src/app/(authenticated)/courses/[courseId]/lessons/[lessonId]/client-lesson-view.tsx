"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  FileText,
  Video,
  FileCode,
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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

export function ClientLessonView({
  lesson,
  progress,
  allUnits,
  courseId,
  collaboratorId,
}: ClientLessonViewProps) {
  const router = useRouter()
  const [viewPercentage, setViewPercentage] = useState(progress?.viewPercentage || 0)
  const [isCompleted, setIsCompleted] = useState(progress?.completed || false)
  const [isUpdating, setIsUpdating] = useState(false)

  const Icon = lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons]

  // Encontrar lección anterior y siguiente
  const allLessons = allUnits.flatMap((unit) =>
    unit.lessons.map((l: any) => ({ ...l, unitId: unit.id, unitTitle: unit.title }))
  )
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id)
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Actualizar progreso automáticamente cada 30 segundos
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (!isCompleted && lesson.type === "VIDEO") {
      interval = setInterval(() => {
        setViewPercentage((prev: number) => {
          const newPercentage = Math.min(prev + 10, 100)
          if (newPercentage >= lesson.completionThreshold && !isCompleted) {
            updateProgress(newPercentage, true)
          } else if (newPercentage % 20 === 0) {
            // Actualizar cada 20%
            updateProgress(newPercentage, false)
          }
          return newPercentage
        })
      }, 30000) // 30 segundos
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCompleted, lesson.type])

  const updateProgress = async (percentage: number, completed: boolean) => {
    if (isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewPercentage: percentage,
        }),
      })

      if (response.ok) {
        if (completed && !isCompleted) {
          setIsCompleted(true)
          toast.success("¡Lección completada!")
        }
      }
    } catch (error) {
      console.error("Error updating progress:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMarkComplete = async () => {
    await updateProgress(100, true)
    setViewPercentage(100)
    setIsCompleted(true)
  }

  const handleNext = () => {
    if (nextLesson) {
      router.push(`/courses/${courseId}/lessons/${nextLesson.id}`)
    } else {
      router.push(`/courses/${courseId}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/my-courses" className="hover:text-foreground">
          Mis Cursos
        </Link>
        <span>/</span>
        <Link href={`/courses/${courseId}`} className="hover:text-foreground">
          {lesson.unit.course.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  <Icon className="h-3 w-3 mr-1" />
                  {lesson.type}
                </Badge>
                {lesson.duration && (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {lesson.duration} min
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completada
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              {lesson.description && <CardDescription className="mt-2">{lesson.description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso de visualización</span>
              <span className="font-medium">{viewPercentage}%</span>
            </div>
            <Progress value={viewPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Completa al menos el {lesson.completionThreshold}% para marcar como completada
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contenido de la lección */}
      <Card>
        <CardHeader>
          <CardTitle>Contenido de la Lección</CardTitle>
        </CardHeader>
        <CardContent>
          {lesson.type === "VIDEO" && lesson.videoUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be") ? (
                <iframe
                  src={lesson.videoUrl.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                />
              ) : (
                <video src={lesson.videoUrl} controls className="w-full h-full" />
              )}
            </div>
          )}

          {lesson.type === "PDF" && lesson.fileUrl && (
            <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              <iframe src={lesson.fileUrl} className="w-full h-full" title={lesson.title} />
            </div>
          )}

          {lesson.type === "HTML" && lesson.htmlContent && (
            <div
              className="prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg"
              dangerouslySetInnerHTML={{ __html: lesson.htmlContent }}
            />
          )}

          {lesson.type === "PPT" && lesson.fileUrl && (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Presentación</h3>
              <p className="text-sm text-muted-foreground mb-4">Descarga la presentación para visualizarla</p>
              <Button asChild>
                <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer" download>
                  Descargar Presentación
                </a>
              </Button>
            </div>
          )}

          {lesson.type === "SCORM" && lesson.fileUrl && (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe src={lesson.fileUrl} className="w-full h-full" title={lesson.title} />
            </div>
          )}

          {!lesson.videoUrl && !lesson.fileUrl && !lesson.htmlContent && (
            <div className="text-center p-8 text-muted-foreground">
              <Icon className="h-16 w-16 mx-auto mb-4" />
              <p>Contenido no disponible</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {previousLesson && (
            <Link href={`/courses/${courseId}/lessons/${previousLesson.id}`}>
              <Button variant="outline" className="w-full">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior: {previousLesson.title}
              </Button>
            </Link>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline">Volver al Curso</Button>
          </Link>

          {!isCompleted && viewPercentage >= lesson.completionThreshold && (
            <Button onClick={handleMarkComplete} disabled={isUpdating}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como Completada
            </Button>
          )}
        </div>

        <div className="flex-1 text-right">
          {nextLesson ? (
            <Button onClick={handleNext} className="w-full">
              Siguiente: {nextLesson.title}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full">
              Finalizar y Volver al Curso
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Lista de lecciones de la unidad */}
      <Card>
        <CardHeader>
          <CardTitle>Unidad: {lesson.unit.title}</CardTitle>
          <CardDescription>Lecciones de esta unidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {lesson.unit.lessons.map((l: any) => {
              const isCurrentLesson = l.id === lesson.id
              const LIcon = lessonTypeIcons[l.type as keyof typeof lessonTypeIcons]

              return (
                <Link key={l.id} href={`/courses/${courseId}/lessons/${l.id}`}>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isCurrentLesson ? "bg-primary/10 border-primary" : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LIcon className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-medium ${isCurrentLesson ? "text-primary" : ""}`}>{l.title}</span>
                    </div>
                    {l.duration && (
                      <Badge variant="outline" className="text-xs">
                        {l.duration} min
                      </Badge>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
