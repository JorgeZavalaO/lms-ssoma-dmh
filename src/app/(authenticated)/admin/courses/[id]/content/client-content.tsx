"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Video, File, Code, Package } from "lucide-react"
import { CreateUnitDialog, EditUnitDialog, DeleteUnitDialog } from "@/components/admin/content-modals"
import { CreateLessonDialog, EditLessonDialog, DeleteLessonDialog } from "@/components/admin/lesson-modals"
import { LessonPreviewDialog } from "@/components/admin/lesson-preview-dialog"

interface Unit {
  id: string
  title: string
  description: string | null
  order: number
  lessons: Lesson[]
  _count: {
    lessons: number
  }
}

interface Lesson {
  id: string
  title: string
  description: string | null
  type: string
  order: number
  duration: number | null
  completionThreshold: number
  videoUrl: string | null
  fileUrl: string | null
  htmlContent: string | null
}

interface ClientCourseContentProps {
  courseId: string
  initialUnits: Unit[]
}

const lessonTypeIcons = {
  VIDEO: Video,
  PDF: File,
  PPT: FileText,
  HTML: Code,
  SCORM: Package,
}

const lessonTypeLabels = {
  VIDEO: "Video",
  PDF: "PDF",
  PPT: "Presentación",
  HTML: "HTML",
  SCORM: "SCORM",
}

export default function ClientCourseContent({ courseId, initialUnits }: ClientCourseContentProps) {
  const [units, setUnits] = React.useState<Unit[]>(initialUnits)

  const refreshUnits = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/units`)
      if (res.ok) {
        const data = await res.json()
        setUnits(data)
      }
    } catch (error) {
      console.error("Error refreshing units:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Unidades y Lecciones</h2>
          <p className="text-sm text-muted-foreground">
            Organiza el contenido del curso en unidades y lecciones
          </p>
        </div>
        <CreateUnitDialog courseId={courseId} onCreated={refreshUnits} />
      </div>

      {/* Units List */}
      {units.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay unidades</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comienza creando la primera unidad del curso
              </p>
              <CreateUnitDialog courseId={courseId} onCreated={refreshUnits} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {units.map((unit) => (
            <AccordionItem key={unit.id} value={unit.id} className="border rounded-lg">
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono">
                        U{unit.order}
                      </Badge>
                      <div className="text-left">
                        <h3 className="font-semibold">{unit.title}</h3>
                        {unit.description && (
                          <p className="text-sm text-muted-foreground">
                            {unit.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {unit._count.lessons} lección{unit._count.lessons !== 1 ? "es" : ""}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium">Lecciones</h4>
                      <div className="flex gap-2">
                        <CreateLessonDialog unitId={unit.id} onCreated={refreshUnits} />
                        <EditUnitDialog unit={unit} onEdited={refreshUnits} />
                        <DeleteUnitDialog unitId={unit.id} onDeleted={refreshUnits} />
                      </div>
                    </div>

                    {unit.lessons.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No hay lecciones en esta unidad
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {unit.lessons.map((lesson) => {
                          const Icon = lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons] || FileText
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-mono w-12">
                                  L{lesson.order}
                                </Badge>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{lesson.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {lessonTypeLabels[lesson.type as keyof typeof lessonTypeLabels]}
                                    {lesson.duration && ` • ${lesson.duration} min`}
                                    {` • ${lesson.completionThreshold}% completado`}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <LessonPreviewDialog lesson={lesson} />
                                <EditLessonDialog lesson={lesson} onEdited={refreshUnits} />
                                <DeleteLessonDialog lessonId={lesson.id} onDeleted={refreshUnits} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
