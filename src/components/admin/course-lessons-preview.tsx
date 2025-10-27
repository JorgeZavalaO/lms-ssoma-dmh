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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Video } from "lucide-react"
import { LessonPreviewDialog } from "./lesson-preview-dialog"
import { toast } from "sonner"

interface CourseLessonsPreviewProps {
  courseId: string
  courseName: string
}

interface Lesson {
  id: string
  title: string
  description?: string | null
  type: string
  order: number
  duration?: number | null
  completionThreshold: number
  videoUrl?: string | null
  fileUrl?: string | null
  htmlContent?: string | null
}

interface Unit {
  id: string
  title: string
  description?: string | null
  order: number
  lessons: Lesson[]
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

export function CourseLessonsPreviewDialog({ courseId, courseName }: CourseLessonsPreviewProps) {
  const [open, setOpen] = React.useState(false)
  const [units, setUnits] = React.useState<Unit[]>([])
  const [loading, setLoading] = React.useState(false)

  const loadUnits = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/courses/${courseId}/units`)
      if (res.ok) {
        const data = await res.json()
        setUnits(data)
      } else {
        toast.error("Error al cargar las unidades")
      }
    } catch (error) {
      console.error("Error loading units:", error)
      toast.error("Error al cargar las unidades")
    } finally {
      setLoading(false)
    }
  }, [courseId])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      loadUnits()
    }
  }

  const totalLessons = units.reduce((acc, unit) => acc + unit.lessons.length, 0)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
        title="Ver contenido de lecciones del curso"
      >
        <Video className="h-4 w-4 mr-1" />
        Ver Lecciones
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lecciones del Curso: {courseName}</DialogTitle>
            <DialogDescription>
              {units.length} unidades • {totalLessons} lecciones
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando lecciones...
            </div>
          ) : units.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay unidades en este curso
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {units.map((unit) => (
                <AccordionItem key={unit.id} value={unit.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex flex-1 items-center justify-between gap-2 text-left">
                      <div className="flex-1">
                        <h3 className="font-medium">
                          Unidad {unit.order}: {unit.title}
                        </h3>
                        {unit.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {unit.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {unit.lessons.length} lecciones
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-2">
                    <div className="space-y-2">
                      {unit.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="bg-muted/50 p-3 rounded-lg border space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                Lección {lesson.order}: {lesson.title}
                              </h4>
                              {lesson.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            <Badge 
                              variant="outline"
                              className={lessonTypeColors[lesson.type]}
                            >
                              {lessonTypeLabels[lesson.type] || lesson.type}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {lesson.duration && (
                              <span>⏱️ {lesson.duration} min</span>
                            )}
                            <span>📊 {lesson.completionThreshold}% para completar</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <LessonPreviewDialog lesson={lesson} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
