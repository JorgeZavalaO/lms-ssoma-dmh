"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, UserPlus, Users, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useForm } from "react-hook-form"

interface Enrollment {
  id: string
  courseId: string
  collaboratorId: string
  type: string
  status: string
  enrolledAt: Date
  progressPercent: number
  course: {
    id: string
    code: string
    name: string
  }
  collaborator: {
    id: string
    dni: string
    fullName: string
    email: string
    area: { name: string } | null
    position: { name: string } | null
    site: { name: string } | null
  }
}

interface Course {
  id: string
  code: string
  name: string
}

interface Collaborator {
  id: string
  dni: string
  fullName: string
  email: string
  area: { id: string; name: string } | null
  position: { id: string; name: string } | null
  site: { id: string; name: string } | null
}

interface Site {
  id: string
  name: string
}

interface Area {
  id: string
  name: string
}

interface Position {
  id: string
  name: string
}

interface ClientEnrollmentsProps {
  initialEnrollments: Enrollment[]
  courses: Course[]
  collaborators: Collaborator[]
  sites: Site[]
  areas: Area[]
  positions: Position[]
}

export default function ClientEnrollments({
  initialEnrollments,
  courses,
  collaborators,
  sites,
  areas,
  positions,
}: ClientEnrollmentsProps) {
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>(initialEnrollments)
  const [filter, setFilter] = React.useState<string>("all")

  const refreshEnrollments = async () => {
    try {
      const res = await fetch("/api/enrollments")
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data)
      }
    } catch (error) {
      console.error("Error refreshing enrollments:", error)
    }
  }

  const filteredEnrollments = enrollments.filter((e) => {
    if (filter === "all") return true
    if (filter === "manual") return e.type === "MANUAL"
    if (filter === "automatic") return e.type === "AUTOMATIC"
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Inscripciones</h2>
          <p className="text-sm text-muted-foreground">
            {enrollments.length} inscripción{enrollments.length !== 1 ? "es" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <EnrollIndividualDialog
            courses={courses}
            collaborators={collaborators}
            onCreated={refreshEnrollments}
          />
          <EnrollBulkDialog
            courses={courses}
            sites={sites}
            areas={areas}
            positions={positions}
            onCreated={refreshEnrollments}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          Todas
        </Button>
        <Button
          variant={filter === "manual" ? "default" : "outline"}
          onClick={() => setFilter("manual")}
          size="sm"
        >
          Manuales
        </Button>
        <Button
          variant={filter === "automatic" ? "default" : "outline"}
          onClick={() => setFilter("automatic")}
          size="sm"
        >
          Automáticas
        </Button>
      </div>

      {/* Tabla de inscripciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Inscripciones</CardTitle>
          <CardDescription>
            Gestiona las inscripciones de colaboradores a cursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay inscripciones</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Inscribe colaboradores a cursos de forma individual o masiva
              </p>
              <div className="flex gap-2 justify-center">
                <EnrollIndividualDialog
                  courses={courses}
                  collaborators={collaborators}
                  onCreated={refreshEnrollments}
                />
                <EnrollBulkDialog
                  courses={courses}
                  sites={sites}
                  areas={areas}
                  positions={positions}
                  onCreated={refreshEnrollments}
                />
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="font-medium">{enrollment.collaborator.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {enrollment.collaborator.dni}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{enrollment.course.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {enrollment.course.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={enrollment.type === "MANUAL" ? "default" : "secondary"}>
                        {enrollment.type === "MANUAL" ? "Manual" : "Automática"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          enrollment.status === "COMPLETED"
                            ? "default"
                            : enrollment.status === "ACTIVE"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {enrollment.status === "COMPLETED"
                          ? "Completado"
                          : enrollment.status === "ACTIVE"
                          ? "Activo"
                          : enrollment.status === "PENDING"
                          ? "Pendiente"
                          : "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{enrollment.progressPercent}%</TableCell>
                    <TableCell className="text-right">
                      {enrollment.type === "MANUAL" && (
                        <DeleteEnrollmentButton
                          enrollmentId={enrollment.id}
                          onDeleted={refreshEnrollments}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Dialog para inscripción individual
interface EnrollIndividualDialogProps {
  courses: Course[]
  collaborators: Collaborator[]
  onCreated: () => void
}

function EnrollIndividualDialog({
  courses,
  collaborators,
  onCreated,
}: EnrollIndividualDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [selectedCollaborators, setSelectedCollaborators] = React.useState<string[]>([])

  const form = useForm({
    defaultValues: {
      courseId: "",
      notes: "",
    },
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    if (selectedCollaborators.length === 0) {
      toast.error("Debe seleccionar al menos un colaborador")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: data.courseId,
          collaboratorIds: selectedCollaborators,
          notes: data.notes || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear inscripciones")
      }

      const result = await res.json()
      toast.success(result.message)
      setOpen(false)
      form.reset()
      setSelectedCollaborators([])
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
          <UserPlus className="h-4 w-4 mr-2" />
          Inscripción Individual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inscripción Individual</DialogTitle>
          <DialogDescription>
            Selecciona uno o más colaboradores para inscribir al curso
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseId">Curso *</Label>
            <Select
              value={form.watch("courseId")}
              onValueChange={(value) => form.setValue("courseId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Colaboradores *</Label>
            <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={collaborator.id}
                    checked={selectedCollaborators.includes(collaborator.id)}
                    onCheckedChange={(checked) => {
                      setSelectedCollaborators(
                        checked
                          ? [...selectedCollaborators, collaborator.id]
                          : selectedCollaborators.filter((id) => id !== collaborator.id)
                      )
                    }}
                  />
                  <label
                    htmlFor={collaborator.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {collaborator.fullName} ({collaborator.dni})
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedCollaborators.length} seleccionado{selectedCollaborators.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Comentarios adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || !form.watch("courseId") || selectedCollaborators.length === 0}
            >
              {loading ? "Inscribiendo..." : `Inscribir ${selectedCollaborators.length} colaborador${selectedCollaborators.length !== 1 ? "es" : ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Dialog para inscripción masiva por filtros
interface EnrollBulkDialogProps {
  courses: Course[]
  sites: Site[]
  areas: Area[]
  positions: Position[]
  onCreated: () => void
}

function EnrollBulkDialog({
  courses,
  sites,
  areas,
  positions,
  onCreated,
}: EnrollBulkDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [selectedSites, setSelectedSites] = React.useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>([])
  const [selectedPositions, setSelectedPositions] = React.useState<string[]>([])

  const form = useForm({
    defaultValues: {
      courseId: "",
      notes: "",
    },
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!data.courseId) {
      toast.error("Debes seleccionar un curso")
      return
    }

    if (selectedSites.length === 0 && selectedAreas.length === 0 && selectedPositions.length === 0) {
      toast.error("Debes seleccionar al menos una sede, área o puesto")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/enrollments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: data.courseId,
          filters: {
            siteIds: selectedSites.length > 0 ? selectedSites : undefined,
            areaIds: selectedAreas.length > 0 ? selectedAreas : undefined,
            positionIds: selectedPositions.length > 0 ? selectedPositions : undefined,
          },
          notes: data.notes || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear inscripciones masivas")
      }

      const result = await res.json()
      toast.success(result.message)
      setOpen(false)
      form.reset()
      setSelectedSites([])
      setSelectedAreas([])
      setSelectedPositions([])
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
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Inscripción Masiva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inscripción Masiva</DialogTitle>
          <DialogDescription>
            Inscribe colaboradores en masa usando filtros por sede, área o puesto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseId">Curso *</Label>
            <Select
              value={form.watch("courseId")}
              onValueChange={(value) => form.setValue("courseId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 border rounded-md p-4 bg-muted/50">
            <div className="text-sm font-medium">Filtros de Colaboradores *</div>
            <p className="text-xs text-muted-foreground">
              Selecciona al menos una opción de sede, área o puesto
            </p>

            {/* Sedes */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Sedes</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {sites.map((site) => (
                  <div key={site.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`site-${site.id}`}
                      checked={selectedSites.includes(site.id)}
                      onCheckedChange={(checked) => {
                        setSelectedSites(
                          checked
                            ? [...selectedSites, site.id]
                            : selectedSites.filter((id) => id !== site.id)
                        )
                      }}
                    />
                    <label
                      htmlFor={`site-${site.id}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {site.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Áreas */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Áreas</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {areas.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area.id}`}
                      checked={selectedAreas.includes(area.id)}
                      onCheckedChange={(checked) => {
                        setSelectedAreas(
                          checked
                            ? [...selectedAreas, area.id]
                            : selectedAreas.filter((id) => id !== area.id)
                        )
                      }}
                    />
                    <label
                      htmlFor={`area-${area.id}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {area.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Puestos */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Puestos</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {positions.map((position) => (
                  <div key={position.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`position-${position.id}`}
                      checked={selectedPositions.includes(position.id)}
                      onCheckedChange={(checked) => {
                        setSelectedPositions(
                          checked
                            ? [...selectedPositions, position.id]
                            : selectedPositions.filter((id) => id !== position.id)
                        )
                      }}
                    />
                    <label
                      htmlFor={`position-${position.id}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {position.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-notes">Notas (opcional)</Label>
            <Textarea
              id="bulk-notes"
              {...form.register("notes")}
              placeholder="Comentarios adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                loading ||
                !form.watch("courseId") ||
                (selectedSites.length === 0 && selectedAreas.length === 0 && selectedPositions.length === 0)
              }
            >
              {loading ? "Inscribiendo..." : "Inscribir Colaboradores"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Botón para eliminar inscripción manual
interface DeleteEnrollmentButtonProps {
  enrollmentId: string
  onDeleted: () => void
}

function DeleteEnrollmentButton({ enrollmentId, onDeleted }: DeleteEnrollmentButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar inscripción")
      }

      toast.success("Inscripción eliminada exitosamente")
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
          <DialogTitle>Eliminar Inscripción</DialogTitle>
          <DialogDescription>
            ¿Estás seguro? Esta acción eliminará la inscripción de forma permanente.
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
