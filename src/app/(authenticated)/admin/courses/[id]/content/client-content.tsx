"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, FileText, Video, File, Code, Package, GripVertical, AlertCircle, Trophy, Pencil, Trash2 } from "lucide-react"
import { CreateUnitDialog, EditUnitDialog, DeleteUnitDialog, CreateQuizUnitDialog } from "@/components/admin/courses/units/modals"
import { CreateLessonDialog, EditLessonDialog, DeleteLessonDialog } from "@/components/admin/lessons/modals"
import { LessonPreviewDialog } from "@/components/admin/lessons/preview-dialog"
import { QuizForm } from "@/app/(authenticated)/admin/quizzes/quiz-form"
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
  quizzes: Quiz[]
  _count: {
    lessons: number
    quizzes: number
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

interface Quiz {
  id: string
  title: string
  description: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  passingScore: number
  maxAttempts: number | null
  timeLimit: number | null
  order: number | null
  quizQuestions: Array<{ questionId: string }>
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
  courseId,
  refreshUnits 
}: { 
  unit: Unit; 
  courseId: string;
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

  // Unidad de evaluación: sin lecciones y con al menos un quiz
  const isEvaluationUnit = unit._count.lessons === 0 && unit._count.quizzes > 0

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
                  <GripVertical className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                </div>
                {isEvaluationUnit ? (
                  <Badge variant="outline" className="font-mono bg-amber-50 text-amber-700 border-amber-200">
                    <Trophy className="h-3 w-3 mr-1" />
                    Evaluación
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
                    U{unit.order}
                  </Badge>
                )}
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">{unit.title}</h3>
                  {unit.description && (
                    <p className="text-sm text-slate-600">
                      {unit.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEvaluationUnit && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {unit._count.lessons} lección{unit._count.lessons !== 1 ? "es" : ""}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {unit._count.quizzes} quiz{unit._count.quizzes !== 1 ? "zes" : ""}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <CardContent className="pt-4">
              {!isEvaluationUnit && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-slate-900">Lecciones</h4>
                    <div className="flex gap-2">
                      <CreateLessonDialog unitId={unit.id} onCreated={refreshUnits} />
                      <EditUnitDialog unit={unit} onEdited={refreshUnits} />
                      <DeleteUnitDialog unitId={unit.id} onDeleted={refreshUnits} />
                    </div>
                  </div>
                  {unit.lessons.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                      <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">
                        No hay lecciones en esta unidad
                      </p>
                    </div>
                  ) : (
                    <LessonsList
                      lessons={unit.lessons}
                      refreshUnits={refreshUnits}
                    />
                  )}
                </>
              )}

              {isEvaluationUnit && (
                <div className="flex justify-end gap-2 mb-4">
                  <EditUnitDialog unit={unit} onEdited={refreshUnits} />
                  <DeleteUnitDialog unitId={unit.id} onDeleted={refreshUnits} />
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-slate-900">Quizzes de la unidad</h4>
                  <div className="flex gap-2">
                    <LinkExistingQuizDialog
                      courseId={courseId}
                      unitId={unit.id}
                      existingQuizIds={unit.quizzes.map((q) => q.id)}
                      onLinked={refreshUnits}
                    />
                    <CreateOrEditQuizDialog
                      triggerLabel="Nuevo Quiz"
                      courseId={courseId}
                      unitId={unit.id}
                      onSuccess={refreshUnits}
                    />
                  </div>
                </div>

                {unit.quizzes.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/30">
                    <Trophy className="h-8 w-8 mx-auto text-purple-300 mb-2" />
                    <p className="text-sm text-slate-500">
                      No hay quizzes en esta unidad
                    </p>
                  </div>
                ) : (
                  <QuizzesList
                    quizzes={unit.quizzes}
                    courseId={courseId}
                    unitId={unit.id}
                    refreshUnits={refreshUnits}
                  />
                )}
              </div>
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
      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-slate-400 hover:text-slate-600" />
        </div>
        <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
          L{lesson.order}
        </Badge>
        <Icon className="h-4 w-4 text-slate-500 flex-shrink-0" />
        <div className="min-w-0">
          <div className="font-medium text-slate-900 truncate">{lesson.title}</div>
          <div className="text-sm text-slate-600 truncate">
            {lessonTypeLabels[lesson.type as keyof typeof lessonTypeLabels]}
            {lesson.duration && ` • ${lesson.duration} min`}
            {`• ${lesson.completionThreshold}% completado`}
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
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

function CreateOrEditQuizDialog({
  triggerLabel,
  courseId,
  unitId,
  quiz,
  onSuccess,
}: {
  triggerLabel: string
  courseId: string
  unitId: string
  quiz?: Quiz
  onSuccess: () => void
}) {
  const [open, setOpen] = React.useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {quiz ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto !max-w-[1100px]">
        <DialogHeader>
          <DialogTitle>{quiz ? "Editar Quiz" : "Nuevo Quiz"}</DialogTitle>
        </DialogHeader>
        <QuizForm
          quiz={quiz}
          fixedCourseId={courseId}
          fixedUnitId={unitId}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

function LinkExistingQuizDialog({
  courseId,
  unitId,
  existingQuizIds,
  onLinked,
}: {
  courseId: string
  unitId: string
  existingQuizIds: string[]
  onLinked: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [selectedQuizId, setSelectedQuizId] = React.useState("")
  const [availableQuizzes, setAvailableQuizzes] = React.useState<Quiz[]>([])

  React.useEffect(() => {
    if (!open) return

    const fetchQuizzes = async () => {
      try {
        const res = await fetch("/api/quizzes")
        if (!res.ok) throw new Error("No se pudieron cargar los quizzes")
        const data: Quiz[] = await res.json()
        const filtered = data.filter((quiz) => !existingQuizIds.includes(quiz.id))
        setAvailableQuizzes(filtered)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al cargar quizzes")
      }
    }

    fetchQuizzes()
  }, [open, existingQuizIds])

  const handleLink = async () => {
    if (!selectedQuizId) {
      toast.error("Selecciona un quiz para vincular")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/quizzes/${selectedQuizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          unitId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "No se pudo vincular el quiz")
      }

      toast.success("Quiz vinculado a la unidad")
      setSelectedQuizId("")
      setOpen(false)
      onLinked()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al vincular quiz")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Vincular existente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Vincular examen existente</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Examen disponible</Label>
            <Select value={selectedQuizId || "NONE"} onValueChange={(value) => setSelectedQuizId(value === "NONE" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un examen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Seleccionar...</SelectItem>
                {availableQuizzes.map((quiz) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableQuizzes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay exámenes disponibles para vincular en esta unidad.
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleLink} disabled={loading || !selectedQuizId}>
              {loading ? "Vinculando..." : "Vincular examen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SortableQuiz({
  quiz,
  courseId,
  unitId,
  refreshUnits,
}: {
  quiz: Quiz
  courseId: string
  unitId: string
  refreshUnits: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quiz.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este quiz?")) return

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "No se pudo eliminar el quiz")
      }
      toast.success("Quiz eliminado")
      refreshUnits()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar quiz")
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border border-purple-200 rounded-lg hover:bg-purple-50/40 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-slate-400 hover:text-slate-600" />
        </div>
        <Badge variant="outline" className="font-mono bg-purple-50 text-purple-700 border-purple-200 flex-shrink-0">
          Q{quiz.order ?? "-"}
        </Badge>
        <Trophy className="h-4 w-4 text-purple-600 flex-shrink-0" />
        <div className="min-w-0">
          <div className="font-medium text-slate-900 truncate">{quiz.title}</div>
          <div className="text-sm text-slate-600 truncate">
            {quiz.quizQuestions.length} pregunta{quiz.quizQuestions.length !== 1 ? "s" : ""}
            {` • Nota mínima ${quiz.passingScore}%`}
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <CreateOrEditQuizDialog
          triggerLabel="Editar"
          courseId={courseId}
          unitId={unitId}
          quiz={quiz}
          onSuccess={refreshUnits}
        />
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function QuizzesList({
  quizzes,
  courseId,
  unitId,
  refreshUnits,
}: {
  quizzes: Quiz[]
  courseId: string
  unitId: string
  refreshUnits: () => void
}) {
  const [localQuizzes, setLocalQuizzes] = React.useState(quizzes)

  React.useEffect(() => {
    setLocalQuizzes(quizzes)
  }, [quizzes])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localQuizzes.findIndex((q) => q.id === active.id)
      const newIndex = localQuizzes.findIndex((q) => q.id === over.id)

      const newQuizzes = arrayMove(localQuizzes, oldIndex, newIndex)
      setLocalQuizzes(newQuizzes)

      try {
        const res = await fetch("/api/quizzes/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizIds: newQuizzes.map((q) => q.id) }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.details || data.error || "Error reordenando quizzes")
        }

        toast.success("Quizzes reordenados")
        refreshUnits()
      } catch (error) {
        console.error("Error al reordenar quizzes:", error)
        toast.error("Error al reordenar quizzes")
        setLocalQuizzes(quizzes)
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
        items={localQuizzes.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {localQuizzes.map((quiz) => (
            <SortableQuiz
              key={quiz.id}
              quiz={quiz}
              courseId={courseId}
              unitId={unitId}
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
    <div className="space-y-4">
      {/* Info Card */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-emerald-800">
            <span className="font-semibold">Tip:</span> Usa el icono de agarre para reordenar unidades y lecciones.
          </div>
        </div>
      </div>
      
      {/* Create Unit Buttons */}
      <div className="flex justify-end gap-2">
        <CreateQuizUnitDialog courseId={courseId} onCreated={refreshUnits} />
        <CreateUnitDialog courseId={courseId} onCreated={refreshUnits} />
      </div>

      {/* Units List */}
      {units.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Package className="h-16 w-16 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No hay unidades</h3>
                <p className="text-sm text-slate-600">
                  Comienza creando la primera unidad del curso
                </p>
              </div>
              <CreateUnitDialog courseId={courseId} onCreated={refreshUnits} />
              <CreateQuizUnitDialog courseId={courseId} onCreated={refreshUnits} />
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
            <Accordion type="single" collapsible className="space-y-3">
              {units.map((unit) => (
                <SortableUnit 
                  key={unit.id} 
                  unit={unit} 
                  courseId={courseId}
                  refreshUnits={refreshUnits}
                />
              ))}
            </Accordion>
          </SortableContext>
        </DndContext>
      ) : (
        // Fallback SSR sin DnD para evitar hydration mismatch
        <Accordion type="single" collapsible className="space-y-3">
          {units.map((unit) => (
            <AccordionItem key={unit.id} value={unit.id} className="border rounded-lg">
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-slate-400" />
                      <Badge variant="outline" className="font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
                        U{unit.order}
                      </Badge>
                      <div className="text-left">
                        <h3 className="font-semibold text-slate-900">{unit.title}</h3>
                        {unit.description && (
                          <p className="text-sm text-slate-600">
                            {unit.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {unit._count.lessons} lección{unit._count.lessons !== 1 ? "es" : ""}
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {unit._count.quizzes} quiz{unit._count.quizzes !== 1 ? "zes" : ""}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-slate-900">Lecciones</h4>
                      <div className="flex gap-2">
                        <CreateLessonDialog unitId={unit.id} onCreated={refreshUnits} />
                        <EditUnitDialog unit={unit} onEdited={refreshUnits} />
                        <DeleteUnitDialog unitId={unit.id} onDeleted={refreshUnits} />
                      </div>
                    </div>

                    {unit.lessons.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                        <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">
                          No hay lecciones en esta unidad
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {unit.lessons.map((lesson) => {
                          const Icon = lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons] || FileText
                          return (
                            <div key={lesson.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
                                  L{lesson.order}
                                </Badge>
                                <Icon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">{lesson.title}</div>
                                  <div className="text-sm text-slate-600 truncate">
                                    {lessonTypeLabels[lesson.type as keyof typeof lessonTypeLabels]}
                                    {lesson.duration && ` • ${lesson.duration} min`}
                                    {` • ${lesson.completionThreshold}% completado`}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
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
