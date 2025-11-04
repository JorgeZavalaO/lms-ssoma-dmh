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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

// Create Lesson Dialog
interface CreateLessonDialogProps {
  unitId: string
  onCreated: () => void
}

export function CreateLessonDialog({ unitId, onCreated }: CreateLessonDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [lessonType, setLessonType] = React.useState<string>("VIDEO")

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      type: "VIDEO",
      videoUrl: "",
      fileUrl: "",
      htmlContent: "",
      completionThreshold: 80,
      duration: 0,
    },
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/units/${unitId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error creating lesson")
      }

      toast.success("Lección creada exitosamente")
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
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Lección
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Lección</DialogTitle>
          <DialogDescription>
            Agrega una nueva lección. El orden se asignará automáticamente al final.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Título de la lección"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => {
                  form.setValue("type", value)
                  setLessonType(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="PPT">Presentación</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="SCORM">SCORM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descripción de la lección"
              rows={2}
            />
          </div>

          {/* Campos condicionales según el tipo */}
          {lessonType === "VIDEO" && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL del Video (YouTube/Vimeo)</Label>
              <Input
                id="videoUrl"
                {...form.register("videoUrl")}
                placeholder="https://www.youtube.com/watch?v=..."
                type="url"
              />
            </div>
          )}

          {(lessonType === "PDF" || lessonType === "PPT" || lessonType === "SCORM") && (
            <div className="space-y-2">
              <Label htmlFor="fileUrl">URL del Archivo</Label>
              <Input
                id="fileUrl"
                {...form.register("fileUrl")}
                placeholder="https://..."
                type="url"
              />
            </div>
          )}

          {lessonType === "HTML" && (
            <div className="space-y-2">
              <Label htmlFor="htmlContent">Contenido HTML</Label>
              <Textarea
                id="htmlContent"
                {...form.register("htmlContent")}
                placeholder="<h1>Contenido...</h1>"
                rows={4}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration", { valueAsNumber: true })}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completionThreshold">% Completado</Label>
              <Input
                id="completionThreshold"
                type="number"
                {...form.register("completionThreshold", { valueAsNumber: true })}
                min={0}
                max={100}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Lección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Lesson Dialog
interface EditLessonDialogProps {
  lesson: {
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
  onEdited: () => void
}

export function EditLessonDialog({ lesson, onEdited }: EditLessonDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [lessonType, setLessonType] = React.useState<string>(lesson.type)

  const form = useForm({
    defaultValues: {
      title: lesson.title,
      description: lesson.description || "",
      type: lesson.type,
      duration: lesson.duration || 0,
      completionThreshold: lesson.completionThreshold,
      videoUrl: lesson.videoUrl || "",
      fileUrl: lesson.fileUrl || "",
      htmlContent: lesson.htmlContent || "",
    },
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, order: lesson.order }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error updating lesson")
      }

      toast.success("Lección actualizada exitosamente")
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lección</DialogTitle>
          <DialogDescription>
            Modifica los datos de la lección. Usa el arrastre para cambiar el orden.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Título de la lección"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => {
                  form.setValue("type", value)
                  setLessonType(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="PPT">Presentación</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="SCORM">SCORM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descripción de la lección"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration", { valueAsNumber: true })}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completionThreshold">% Completado</Label>
              <Input
                id="completionThreshold"
                type="number"
                {...form.register("completionThreshold", { valueAsNumber: true })}
                min={0}
                max={100}
              />
            </div>
          </div>

          {lessonType === "VIDEO" && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL del Video</Label>
              <Input
                id="videoUrl"
                {...form.register("videoUrl")}
                placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                type="url"
              />
            </div>
          )}

          {(lessonType === "PDF" || lessonType === "PPT" || lessonType === "SCORM") && (
            <div className="space-y-2">
              <Label htmlFor="fileUrl">URL del Archivo</Label>
              <Input
                id="fileUrl"
                {...form.register("fileUrl")}
                placeholder="https://..."
                type="url"
              />
            </div>
          )}

          {lessonType === "HTML" && (
            <div className="space-y-2">
              <Label htmlFor="htmlContent">Contenido HTML</Label>
              <Textarea
                id="htmlContent"
                {...form.register("htmlContent")}
                placeholder="<h1>Contenido...</h1>"
                rows={4}
              />
            </div>
          )}

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

// Delete Lesson Dialog
interface DeleteLessonDialogProps {
  lessonId: string
  onDeleted: () => void
}

export function DeleteLessonDialog({ lessonId, onDeleted }: DeleteLessonDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error deleting lesson")
      }

      toast.success("Lección eliminada exitosamente")
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
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Lección</DialogTitle>
          <DialogDescription>
            ¿Estás seguro? Esta acción eliminará la lección de forma permanente.
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
