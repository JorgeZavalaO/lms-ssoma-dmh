"use client"

import * as React from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { BookOpen, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  CourseFormData,
  CourseSchema,
} from "@/validations/courses"
import { CourseDetailsFields } from "./course-details-fields"

type CourseStatus = CourseFormData["status"]
type CourseModality = CourseFormData["modality"]

export interface CourseSummary {
  id: string
  code: string | null
  name: string
  description?: string | null
  objective?: string | null
  duration?: number | null
  modality: CourseModality | string
  validity?: number | null
  requirements?: string | null
  status: CourseStatus | string
  currentVersion: number
}

interface EditCourseDialogProps {
  course: CourseSummary
  onEdited: () => void
}

export function EditCourseDialog({ course, onEdited }: EditCourseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm<CourseFormData>({
    defaultValues: {
      code: course.code ?? "",
      name: course.name,
      description: course.description ?? "",
      objective: course.objective ?? "",
      duration: course.duration ?? undefined,
      modality: course.modality as CourseModality,
      validity: course.validity ?? undefined,
      requirements: course.requirements ?? "",
      status: course.status as CourseStatus,
    },
  })

  const normalizeNumber = (value: number | undefined | null) =>
    Number.isFinite(value) ? (value as number) : undefined

  const onSubmit: SubmitHandler<CourseFormData> = async (rawData) => {
    setLoading(true)
    try {
      const data: CourseFormData = {
        ...rawData,
        duration: normalizeNumber(rawData.duration),
        validity: normalizeNumber(rawData.validity),
      }

      const validated = CourseSchema.parse(data)

      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || "Error al actualizar el curso")
      }

      const result = await res.json().catch(() => ({})) as { currentVersion?: number }
      const versionChanged = typeof result.currentVersion === "number" && result.currentVersion > course.currentVersion

      toast.success(
        versionChanged
          ? `Curso actualizado - Nueva versión ${result.currentVersion} creada`
          : "Curso actualizado exitosamente"
      )

      setOpen(false)
      onEdited()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Editar Curso
          </DialogTitle>
          <DialogDescription>
            Los cambios significativos crearán una nueva versión automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CourseDetailsFields form={form} includeCodeField />

          <DialogFooter className="gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  Actualizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Actualizar Curso
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
