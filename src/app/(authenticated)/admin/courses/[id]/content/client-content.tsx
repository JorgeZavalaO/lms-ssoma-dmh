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
import { Plus, FileText, Video, File, Code, Package, GripVertical } from "lucide-react"
import { CreateUnitDialog, EditUnitDialog, DeleteUnitDialog } from "@/components/admin/content-modals"
import { CreateLessonDialog, EditLessonDialog, DeleteLessonDialog } from "@/components/admin/lesson-modals"
import { LessonPreviewDialog } from "@/components/admin/lesson-preview-dialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"

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

// Sortable Unit Component
function SortableUnit({ 
  unit, 
  refreshUnits 
}: { 
  unit: Unit; 
  refreshUnits: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: unit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem value={unit.id} className="border rounded-lg">
        <Card>
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center justify-between w-full mr-4">
              <div className="flex items-center gap-4">
                <div
                  className="cursor-grab active:cursor-grabbing touch-none"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </div>
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
                <LessonsList 
                  lessons={unit.lessons} 
                  refreshUnits={refreshUnits}
                />
              )}
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </div>
  )
}

// Sortable Lesson Component
function SortableLesson({ 
  lesson, 
  refreshUnits 
}: { 
  lesson: Lesson; 
  refreshUnits: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const Icon = lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons] || FileText

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </div>
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
}

// Lessons List with DnD
function LessonsList({ 
  lessons, 
  refreshUnits 
}: { 
  lessons: Lesson[]; 
  refreshUnits: () => void;
}) {
  const [localLessons, setLocalLessons] = React.useState(lessons)

  React.useEffect(() => {
    setLocalLessons(lessons)
  }, [lessons])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localLessons.findIndex((l) => l.id === active.id)
      const newIndex = localLessons.findIndex((l) => l.id === over.id)

      const newLessons = arrayMove(localLessons, oldIndex, newIndex)
      setLocalLessons(newLessons)

      try {
        const res = await fetch("/api/lessons/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonIds: newLessons.map((l) => l.id) }),
        })

        const data = await res.json()
        
        if (!res.ok) {
          console.error("Error response:", data)
          throw new Error(data.details || data.error || "Error reordenando lecciones")
        }

        toast.success("Lecciones reordenadas")
        refreshUnits()
      } catch (error) {
        console.error("Error al reordenar lecciones:", error)
        toast.error("Error al reordenar lecciones")
        setLocalLessons(lessons)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localLessons.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {localLessons.map((lesson) => (
            <SortableLesson 
              key={lesson.id} 
              lesson={lesson} 
              refreshUnits={refreshUnits}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default function ClientCourseContent({ courseId, initialUnits }: ClientCourseContentProps) {
  const [units, setUnits] = React.useState<Unit[]>(initialUnits)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = units.findIndex((u) => u.id === active.id)
      const newIndex = units.findIndex((u) => u.id === over.id)

      const newUnits = arrayMove(units, oldIndex, newIndex)
      setUnits(newUnits)

      try {
        const res = await fetch("/api/units/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unitIds: newUnits.map((u) => u.id) }),
        })

        const data = await res.json()
        
        if (!res.ok) {
          console.error("Error response:", data)
          throw new Error(data.details || data.error || "Error reordenando unidades")
        }

        toast.success("Unidades reordenadas")
        refreshUnits()
      } catch (error) {
        console.error("Error al reordenar unidades:", error)
        toast.error("Error al reordenar unidades")
        setUnits(units)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Unidades y Lecciones</h2>
          <p className="text-sm text-muted-foreground">
            Organiza el contenido del curso en unidades y lecciones. Arrastra para reordenar.
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
      ) : mounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={units.map((u) => u.id)}
            strategy={verticalListSortingStrategy}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {units.map((unit) => (
                <SortableUnit 
                  key={unit.id} 
                  unit={unit} 
                  refreshUnits={refreshUnits}
                />
              ))}
            </Accordion>
          </SortableContext>
        </DndContext>
      ) : (
        // Fallback SSR sin DnD para evitar hydration mismatch
        <Accordion type="single" collapsible className="space-y-4">
          {units.map((unit) => (
            <AccordionItem key={unit.id} value={unit.id} className="border rounded-lg">
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
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
                            <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
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
