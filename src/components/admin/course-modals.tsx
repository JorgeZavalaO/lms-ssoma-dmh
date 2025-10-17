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
import { CourseSchema, CourseFormData } from "@/validations/courses"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"

// Create Course Dialog
interface CreateCourseDialogProps {
  onCreated: () => void
}

export function CreateCourseDialog({ onCreated }: CreateCourseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      objective: "",
      duration: undefined as number | undefined,
      modality: "ASYNCHRONOUS" as const,
      validity: undefined as number | undefined,
      requirements: "",
      status: "DRAFT" as const,
    },
  })

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true)
    try {
      const validated = CourseSchema.parse({
        ...data,
        duration: data.duration ? Number(data.duration) : undefined,
        validity: data.validity ? Number(data.validity) : undefined,
      })
      
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error creating course")
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
        <Button>Crear Curso</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Curso</DialogTitle>
          <DialogDescription>
            Completa los datos del curso. Se creará la versión 1 automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="CRS-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="PUBLISHED">Publicado</SelectItem>
                  <SelectItem value="ARCHIVED">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Nombre del curso"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">Objetivo</Label>
            <Textarea
              id="objective"
              {...form.register("objective")}
              placeholder="Objetivo del curso"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descripción detallada"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (horas)</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration")}
                placeholder="8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Select
                value={form.watch("modality")}
                onValueChange={(value) => form.setValue("modality", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASYNCHRONOUS">Asíncrono</SelectItem>
                  <SelectItem value="SYNCHRONOUS">Síncrono</SelectItem>
                  <SelectItem value="BLENDED">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity">Vigencia (meses)</Label>
              <Input
                id="validity"
                type="number"
                {...form.register("validity")}
                placeholder="12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requisitos</Label>
            <Textarea
              id="requirements"
              {...form.register("requirements")}
              placeholder="Requisitos previos"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Course Dialog
interface EditCourseDialogProps {
  course: any
  onEdited: () => void
}

export function EditCourseDialog({ course, onEdited }: EditCourseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      code: course.code,
      name: course.name,
      description: course.description || "",
      objective: course.objective || "",
      duration: course.duration,
      modality: course.modality,
      validity: course.validity,
      requirements: course.requirements || "",
      status: course.status,
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const validated = {
        ...data,
        duration: data.duration ? Number(data.duration) : undefined,
        validity: data.validity ? Number(data.validity) : undefined,
      }
      
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error updating course")
      }
      
      const result = await res.json()
      const versionChanged = result.currentVersion > course.currentVersion
      
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
        <Button variant="outline" size="sm">Editar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
          <DialogDescription>
            Los cambios significativos crearán una nueva versión automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                {...form.register("code")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="PUBLISHED">Publicado</SelectItem>
                  <SelectItem value="ARCHIVED">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              {...form.register("name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">Objetivo</Label>
            <Textarea
              id="objective"
              {...form.register("objective")}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (horas)</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Select
                value={form.watch("modality")}
                onValueChange={(value) => form.setValue("modality", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASYNCHRONOUS">Asíncrono</SelectItem>
                  <SelectItem value="SYNCHRONOUS">Síncrono</SelectItem>
                  <SelectItem value="BLENDED">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity">Vigencia (meses)</Label>
              <Input
                id="validity"
                type="number"
                {...form.register("validity")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requisitos</Label>
            <Textarea
              id="requirements"
              {...form.register("requirements")}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Course Dialog
interface DeleteCourseDialogProps {
  course: { id: string; name: string }
  onDeleted: () => void
}

export function DeleteCourseDialog({ course, onDeleted }: DeleteCourseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error deleting course")
      }
      
      toast.success("Curso eliminado exitosamente")
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
        <Button variant="destructive" size="sm">Eliminar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar Curso</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar el curso {course.name}? 
            Esta acción no se puede deshacer y eliminará todas las versiones.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// View Versions Dialog
interface ViewVersionsDialogProps {
  courseId: string
}

export function ViewVersionsDialog({ courseId }: ViewVersionsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [versions, setVersions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      toast.error("Error al cargar versiones")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      fetchVersions()
    }
  }, [open])

  const statusLabels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicado",
    ARCHIVED: "Archivado",
  }

  const modalityLabels: Record<string, string> = {
    ASYNCHRONOUS: "Asíncrono",
    SYNCHRONOUS: "Síncrono",
    BLENDED: "Mixto",
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2">
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historial de Versiones</DialogTitle>
          <DialogDescription>
            Todas las versiones del curso con sus cambios
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">Cargando versiones...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay versiones disponibles
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {versions.map((version) => (
              <div
                key={version.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{version.version}</Badge>
                    <Badge variant="secondary">
                      {statusLabels[version.status]}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div>
                  <div className="font-medium">{version.name}</div>
                  {version.objective && (
                    <div className="text-sm text-muted-foreground">
                      {version.objective}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duración:</span>{" "}
                    {version.duration ? `${version.duration}h` : "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modalidad:</span>{" "}
                    {modalityLabels[version.modality]}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vigencia:</span>{" "}
                    {version.validity ? `${version.validity}m` : "-"}
                  </div>
                </div>
                
                {version.description && (
                  <div className="text-sm text-muted-foreground">
                    {version.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
