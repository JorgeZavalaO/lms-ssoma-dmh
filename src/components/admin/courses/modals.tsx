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
import { Eye, BookOpen, Clock, Users, FileText, AlertCircle, CheckCircle2 } from "lucide-react"

// Create Course Dialog
interface CreateCourseDialogProps {
  onCreated: () => void
}

export function CreateCourseDialog({ onCreated }: CreateCourseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
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
          {/* Estado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-slate-500" />
              <Label htmlFor="status" className="font-semibold">
                Estado
              </Label>
            </div>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as any)}
            >
              <SelectTrigger className="border-slate-200 focus:border-emerald-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                    Borrador
                  </span>
                </SelectItem>
                <SelectItem value="PUBLISHED">
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Publicado
                  </span>
                </SelectItem>
                <SelectItem value="ARCHIVED">
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    Archivado
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nombre */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <Label htmlFor="name" className="font-semibold">
                Nombre del Curso *
              </Label>
            </div>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ej: Seguridad Industrial Avanzada"
              className="border-slate-200 focus:border-emerald-500"
            />
          </div>

          {/* Objetivo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-500" />
              <Label htmlFor="objective" className="font-semibold">
                Objetivo
              </Label>
            </div>
            <Textarea
              id="objective"
              {...form.register("objective")}
              placeholder="¿Qué aprenderán los participantes?"
              rows={2}
              className="border-slate-200 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <Label htmlFor="description" className="font-semibold">
                Descripción
              </Label>
            </div>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Información detallada sobre el contenido del curso"
              rows={3}
              className="border-slate-200 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Grid: Duración, Modalidad, Vigencia */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <Label className="font-semibold">
                Configuración de Tiempo
              </Label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm text-slate-600">
                  Duración (horas)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  {...form.register("duration")}
                  placeholder="8"
                  className="border-slate-200 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modality" className="text-sm text-slate-600">
                  Modalidad
                </Label>
                <Select
                  value={form.watch("modality")}
                  onValueChange={(value) => form.setValue("modality", value as any)}
                >
                  <SelectTrigger className="border-slate-200 focus:border-emerald-500">
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
                <Label htmlFor="validity" className="text-sm text-slate-600">
                  Vigencia (meses)
                </Label>
                <Input
                  id="validity"
                  type="number"
                  {...form.register("validity")}
                  placeholder="12"
                  className="border-slate-200 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Requisitos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-slate-500" />
              <Label htmlFor="requirements" className="font-semibold">
                Requisitos Previos
              </Label>
            </div>
            <Textarea
              id="requirements"
              {...form.register("requirements")}
              placeholder="Conocimientos o experiencia requerida"
              rows={2}
              className="border-slate-200 focus:border-emerald-500 resize-none"
            />
          </div>

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
                  <CheckCircle2 className="h-4 w-4" />
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
          {/* Código y Estado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <Label className="font-semibold">
                Identificación del Curso
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm text-slate-600">
                  Código *
                </Label>
                <Input
                  id="code"
                  {...form.register("code")}
                  className="border-slate-200 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm text-slate-600">
                  Estado *
                </Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as any)}
                >
                  <SelectTrigger className="border-slate-200 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-400" />
                        Borrador
                      </span>
                    </SelectItem>
                    <SelectItem value="PUBLISHED">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        Publicado
                      </span>
                    </SelectItem>
                    <SelectItem value="ARCHIVED">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        Archivado
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <Label htmlFor="name" className="font-semibold">
                Nombre del Curso *
              </Label>
            </div>
            <Input
              id="name"
              {...form.register("name")}
              className="border-slate-200 focus:border-emerald-500"
            />
          </div>

          {/* Objetivo y Descripción */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-500" />
              <Label htmlFor="objective" className="font-semibold">
                Objetivo
              </Label>
            </div>
            <Textarea
              id="objective"
              {...form.register("objective")}
              rows={2}
              className="border-slate-200 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <Label htmlFor="description" className="font-semibold">
                Descripción
              </Label>
            </div>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={3}
              className="border-slate-200 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Grid: Duración, Modalidad, Vigencia */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <Label className="font-semibold">
                Configuración de Tiempo
              </Label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm text-slate-600">
                  Duración (horas)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  {...form.register("duration")}
                  className="border-slate-200 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modality" className="text-sm text-slate-600">
                  Modalidad
                </Label>
                <Select
                  value={form.watch("modality")}
                  onValueChange={(value) => form.setValue("modality", value as any)}
                >
                  <SelectTrigger className="border-slate-200 focus:border-emerald-500">
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
                <Label htmlFor="validity" className="text-sm text-slate-600">
                  Vigencia (meses)
                </Label>
                <Input
                  id="validity"
                  type="number"
                  {...form.register("validity")}
                  className="border-slate-200 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Requisitos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-slate-500" />
              <Label htmlFor="requirements" className="font-semibold">
                Requisitos Previos
              </Label>
            </div>
            <Textarea
              id="requirements"
              {...form.register("requirements")}
              rows={2}
              className="border-slate-200 focus:border-emerald-500 resize-none"
            />
          </div>

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
