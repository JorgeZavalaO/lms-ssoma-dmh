"use client"

import * as React from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { BookOpen } from "lucide-react"
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

interface CreateCourseDialogProps {
  onCreated: () => void
}

export function CreateCourseDialog({ onCreated }: CreateCourseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm<CourseFormData>({
    defaultValues: {
      name: "",
      description: "",
      objective: "",
      duration: undefined,
      modality: "ASYNCHRONOUS",
      validity: undefined,
      requirements: "",
      status: "DRAFT",
    },
  })

  const normalizeNumber = (value: number | undefined) =>
    Number.isFinite(value) ? value : undefined

  const onSubmit: SubmitHandler<CourseFormData> = async (rawData) => {
    setLoading(true)
    try {
      const data: CourseFormData = {
        ...rawData,
        duration: normalizeNumber(rawData.duration),
        validity: normalizeNumber(rawData.validity),
      }

      const validated = CourseSchema.parse(data)

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || "Error al crear el curso")
      }

      toast.success("Curso creado exitosamente")
      setOpen(false)
      form.reset()
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <BookOpen className="h-4 w-4" />
          Crear Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Crear Nuevo Curso
          </DialogTitle>
          <DialogDescription>
            Completa la información del curso. El código se generará automáticamente (CRS-XXX).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CourseDetailsFields
            form={form}
            placeholders={{
              name: "Ej: Seguridad Industrial Avanzada",
              objective: "¿Qué aprenderán los participantes?",
              description: "Información detallada sobre el contenido del curso",
              requirements: "Conocimientos o experiencia requerida",
              duration: "8",
              validity: "12",
            }}
          />

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
                  Creando...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4" />
                  Crear Curso
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
