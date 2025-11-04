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
import { LearningPathSchema } from "@/validations/courses"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ListOrdered, Plus, Trash2, Search, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

// Create Learning Path Dialog
interface CreateLearningPathDialogProps {
  onCreated: () => void
}

export function CreateLearningPathDialog({ onCreated }: CreateLearningPathDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      status: "DRAFT" as const,
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const validated = LearningPathSchema.parse(data)
      
      const res = await fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error creating learning path")
      }
      
      toast.success("Ruta de aprendizaje creada exitosamente")
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
        <Button>Crear Ruta</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Ruta de Aprendizaje</DialogTitle>
          <DialogDescription>
            Crea un itinerario de cursos con secuencia y prerequisitos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="PATH-001"
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
              placeholder="Nombre de la ruta"
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

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Ruta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Learning Path Dialog
interface EditLearningPathDialogProps {
  path: any
  onEdited: () => void
}

export function EditLearningPathDialog({ path, onEdited }: EditLearningPathDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      code: path.code,
      name: path.name,
      description: path.description || "",
      status: path.status,
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/learning-paths/${path.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error updating learning path")
      }
      
      toast.success("Ruta actualizada exitosamente")
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
          <DialogTitle>Editar Ruta de Aprendizaje</DialogTitle>
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
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Learning Path Dialog
interface DeleteLearningPathDialogProps {
  path: { id: string; name: string }
  onDeleted: () => void
}

export function DeleteLearningPathDialog({ path, onDeleted }: DeleteLearningPathDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/learning-paths/${path.id}`, {
        method: "DELETE",
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error deleting learning path")
      }
      
      toast.success("Ruta eliminada exitosamente")
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
          <DialogTitle>Eliminar Ruta</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar la ruta {path.name}?
            Esta acción eliminará todos los cursos asociados de la ruta.
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

// Manage Courses Dialog
interface ManageCoursesDialogProps {
  pathId: string
  courses: any[]
  onRefresh: () => void
}

export function ManageCoursesDialog({ pathId, courses, onRefresh }: ManageCoursesDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [availableCourses, setAvailableCourses] = React.useState<any[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [order, setOrder] = React.useState(courses.length + 1)
  const [isRequired, setIsRequired] = React.useState(true)
  const [prerequisiteId, setPrerequisiteId] = React.useState("none")

  React.useEffect(() => {
    if (open) {
      fetchAvailableCourses()
    }
  }, [open])

  const fetchAvailableCourses = async () => {
    try {
      const res = await fetch("/api/courses?status=PUBLISHED")
      if (res.ok) {
        const data = await res.json()
        setAvailableCourses(data)
      }
    } catch (error) {
      toast.error("Error al cargar cursos")
    }
  }

  const addCourse = async () => {
    if (selectedCourseIds.length === 0) {
      toast.error("Selecciona al menos un curso")
      return
    }

    setLoading(true)
    try {
      // Agregar todos los cursos seleccionados
      let currentOrder = order
      for (const courseId of selectedCourseIds) {
        const res = await fetch(`/api/learning-paths/${pathId}/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: courseId,
            order: currentOrder,
            isRequired,
            prerequisiteId: prerequisiteId === "none" ? undefined : prerequisiteId,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Error adding course")
        }
        currentOrder++
      }

      toast.success(`${selectedCourseIds.length} curso(s) agregado(s) a la ruta`)
      setSelectedCourseIds([])
      setOrder(currentOrder)
      setPrerequisiteId("none")
      onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const filteredCourses = availableCourses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const removeCourse = async (courseId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/learning-paths/${pathId}/courses?courseId=${courseId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error removing course")
      }

      toast.success("Curso eliminado de la ruta")
      onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const totalDuration = courses.reduce((sum, pc) => sum + (pc.course?.duration || 0), 0)
  const requiredCount = courses.filter(pc => pc.isRequired).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListOrdered className="h-4 w-4 mr-1" />
          Gestionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Cursos de la Ruta</DialogTitle>
          <DialogDescription>
            Agrega, ordena y configura prerequisitos de cursos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total de cursos:</span>
              <Badge>{courses.length}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cursos obligatorios:</span>
              <Badge>{requiredCount}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Duración total:</span>
              <Badge>{totalDuration}h</Badge>
            </div>
          </div>

          {/* Agregar curso */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">Agregar Curso(s)</h3>
            
            <div className="space-y-2">
              <Label>Seleccionar Cursos (múltiple)</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-background">
                <ScrollArea className="h-[200px] w-full">
                  {filteredCourses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {availableCourses.length === 0
                        ? "No hay cursos disponibles"
                        : "No se encontraron cursos"}
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {filteredCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => toggleCourseSelection(course.id)}
                        >
                          <Checkbox
                            id={`course-${course.id}`}
                            checked={selectedCourseIds.includes(course.id)}
                            onCheckedChange={() => toggleCourseSelection(course.id)}
                          />
                          <label
                            htmlFor={`course-${course.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="font-medium">{course.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {course.code} • {course.duration || 0}h
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              {selectedCourseIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedCourseIds.length} curso(s) seleccionado(s)
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orden Inicial</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Prerequisito</Label>
                <Select value={prerequisiteId} onValueChange={setPrerequisiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin prerequisito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin prerequisito</SelectItem>
                    {courses.map((pc) => (
                      <SelectItem key={pc.id} value={pc.id}>
                        {pc.order}. {pc.course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
              <Label htmlFor="required">Cursos obligatorios</Label>
            </div>

            <Button onClick={addCourse} disabled={loading || selectedCourseIds.length === 0} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar {selectedCourseIds.length > 0 ? `${selectedCourseIds.length} Curso(s)` : "Curso(s)"}
            </Button>
          </div>

          {/* Lista de cursos */}
          <div className="space-y-2">
            <h3 className="font-medium">Cursos en la Ruta</h3>
            {courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay cursos en esta ruta
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((pc) => (
                  <div
                    key={pc.id}
                    className="border rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{pc.order}</Badge>
                      <div>
                        <div className="font-medium">{pc.course.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pc.course.code} • {pc.course.duration || 0}h
                          {pc.prerequisite && (
                            <span> • Prerequisito: {pc.prerequisite.course.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pc.isRequired && (
                        <Badge variant="secondary">Obligatorio</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourse(pc.courseId)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
