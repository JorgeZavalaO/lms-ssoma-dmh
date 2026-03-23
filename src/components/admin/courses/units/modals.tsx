"use client"

import * as React from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Trash2, Trophy } from "lucide-react"
import { QuizForm } from "@/app/(authenticated)/admin/quizzes/quiz-form"

// Create Unit Dialog
interface CreateUnitDialogProps {
  courseId: string
  onCreated: () => void
}

export function CreateUnitDialog({ courseId, onCreated }: CreateUnitDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error creating unit")
      }

      toast.success("Unidad creada exitosamente")
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Unidad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Unidad</DialogTitle>
          <DialogDescription>
            Crea una nueva unidad didáctica. El orden se asignará automáticamente al final.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Introducción al tema"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descripción de la unidad"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Unidad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Unit Dialog
interface EditUnitDialogProps {
  unit: {
    id: string
    title: string
    description: string | null
    order: number
  }
  onEdited: () => void
}

export function EditUnitDialog({ unit, onEdited }: EditUnitDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      title: unit.title,
      description: unit.description || "",
    },
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, order: unit.order }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error updating unit")
      }

      toast.success("Unidad actualizada exitosamente")
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
        <Button variant="outline" size="sm">Editar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Unidad</DialogTitle>
          <DialogDescription>
            Modifica los datos de la unidad. Usa el arrastre para cambiar el orden.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Introducción al tema"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descripción de la unidad"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Unit Dialog
interface DeleteUnitDialogProps {
  unitId: string
  onDeleted: () => void
}

export function DeleteUnitDialog({ unitId, onDeleted }: DeleteUnitDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/units/${unitId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error deleting unit")
      }

      toast.success("Unidad eliminada exitosamente")
      setOpen(false)
      onDeleted()
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
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Unidad</DialogTitle>
          <DialogDescription>
            ¿Estás seguro? Esta acción eliminará la unidad y todas sus lecciones de forma permanente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Create Quiz Unit Dialog — crea una unidad de evaluación en 2 pasos
interface CreateQuizUnitDialogProps {
  courseId: string
  onCreated: () => void
}

export function CreateQuizUnitDialog({ courseId, onCreated }: CreateQuizUnitDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<"unit" | "quiz">("unit")
  const [loading, setLoading] = React.useState(false)
  const [createdUnitId, setCreatedUnitId] = React.useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Resetear al cerrar
      setStep("unit")
      setCreatedUnitId(null)
      form.reset()
    }
    setOpen(next)
  }

  const onSubmitUnit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear la unidad")
      }

      const unit = await res.json()
      setCreatedUnitId(unit.id)
      setStep("quiz")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleQuizSuccess = () => {
    toast.success("Unidad de evaluación creada exitosamente")
    setOpen(false)
    setStep("unit")
    setCreatedUnitId(null)
    form.reset()
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Trophy className="h-4 w-4 mr-2" />
          Nueva Evaluación
        </Button>
      </DialogTrigger>
      <DialogContent className={step === "quiz" ? "max-h-[90vh] overflow-y-auto !max-w-[1100px]" : "sm:max-w-[500px]"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            {step === "unit" ? "Nueva Unidad de Evaluación (1/2)" : "Configurar Examen (2/2)"}
          </DialogTitle>
          <DialogDescription>
            {step === "unit"
              ? "Define el nombre de la unidad. A continuación podrás crear el examen."
              : "Configura el examen que formará esta unidad de evaluación."}
          </DialogDescription>
        </DialogHeader>

        {step === "unit" && (
          <form onSubmit={form.handleSubmit(onSubmitUnit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-unit-title">Título de la evaluación *</Label>
              <Input
                id="quiz-unit-title"
                {...form.register("title", { required: true })}
                placeholder="Examen Final del Módulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-unit-desc">Descripción</Label>
              <Textarea
                id="quiz-unit-desc"
                {...form.register("description")}
                placeholder="Descripción de la evaluación"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Continuar →"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "quiz" && createdUnitId && (
          <QuizForm
            fixedCourseId={courseId}
            fixedUnitId={createdUnitId}
            onSuccess={handleQuizSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
