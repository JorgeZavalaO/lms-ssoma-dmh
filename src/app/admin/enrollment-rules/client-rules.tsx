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
import { Plus, Pencil, Trash2, Settings2 } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useForm } from "react-hook-form"

interface EnrollmentRule {
  id: string
  courseId: string
  siteId: string | null
  areaId: string | null
  positionId: string | null
  isActive: boolean
  createdAt: Date
  course: {
    id: string
    code: string
    name: string
  }
}

interface Course {
  id: string
  code: string
  name: string
}

interface Site {
  id: string
  code: string
  name: string
}

interface Area {
  id: string
  code: string
  name: string
}

interface Position {
  id: string
  name: string
  areaId: string
  area: {
    name: string
  }
}

interface ClientEnrollmentRulesProps {
  initialRules: EnrollmentRule[]
  courses: Course[]
  sites: Site[]
  areas: Area[]
  positions: Position[]
}

export default function ClientEnrollmentRules({
  initialRules,
  courses,
  sites,
  areas,
  positions,
}: ClientEnrollmentRulesProps) {
  const [rules, setRules] = React.useState<EnrollmentRule[]>(initialRules)

  const refreshRules = async () => {
    try {
      const res = await fetch("/api/enrollment-rules")
      if (res.ok) {
        const data = await res.json()
        setRules(data)
      }
    } catch (error) {
      console.error("Error refreshing rules:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de crear */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Reglas Activas</h2>
          <p className="text-sm text-muted-foreground">
            {rules.length} regla{rules.length !== 1 ? "s" : ""} configurada{rules.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateRuleDialog
          courses={courses}
          sites={sites}
          areas={areas}
          positions={positions}
          onCreated={refreshRules}
        />
      </div>

      {/* Tabla de reglas */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas de Inscripción</CardTitle>
          <CardDescription>
            Gestiona las reglas para asignar cursos automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <Settings2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay reglas configuradas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crea una regla para asignar cursos automáticamente
              </p>
              <CreateRuleDialog
                courses={courses}
                sites={sites}
                areas={areas}
                positions={positions}
                onCreated={refreshRules}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Criterios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="font-medium">{rule.course.name}</div>
                      <div className="text-sm text-muted-foreground">{rule.course.code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.siteId && (
                          <Badge variant="outline">
                            Sede: {sites.find((s) => s.id === rule.siteId)?.name}
                          </Badge>
                        )}
                        {rule.areaId && (
                          <Badge variant="outline">
                            Área: {areas.find((a) => a.id === rule.areaId)?.name}
                          </Badge>
                        )}
                        {rule.positionId && (
                          <Badge variant="outline">
                            Puesto: {positions.find((p) => p.id === rule.positionId)?.name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <ToggleRuleButton rule={rule} onToggled={refreshRules} />
                        <DeleteRuleButton ruleId={rule.id} onDeleted={refreshRules} />
                      </div>
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

// Dialog para crear regla
interface CreateRuleDialogProps {
  courses: Course[]
  sites: Site[]
  areas: Area[]
  positions: Position[]
  onCreated: () => void
}

function CreateRuleDialog({ courses, sites, areas, positions, onCreated }: CreateRuleDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      courseId: "",
      siteId: "",
      areaId: "",
      positionId: "",
    },
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const payload = {
        courseId: data.courseId,
        siteId: data.siteId === "__all__" || data.siteId === "" ? null : data.siteId,
        areaId: data.areaId === "__all__" || data.areaId === "" ? null : data.areaId,
        positionId: data.positionId === "__all__" || data.positionId === "" ? null : data.positionId,
      }

      const res = await fetch("/api/enrollment-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear regla")
      }

      toast.success("Regla creada y aplicada exitosamente")
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
          Nueva Regla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Regla de Inscripción</DialogTitle>
          <DialogDescription>
            Define los criterios para asignar un curso automáticamente
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
            <Label htmlFor="siteId">Sede (opcional)</Label>
            <Select
              value={form.watch("siteId")}
              onValueChange={(value) => form.setValue("siteId", value as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las sedes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="areaId">Área (opcional)</Label>
            <Select
              value={form.watch("areaId")}
              onValueChange={(value) => form.setValue("areaId", value as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionId">Puesto (opcional)</Label>
            <Select
              value={form.watch("positionId")}
              onValueChange={(value) => form.setValue("positionId", value as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los puestos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.name} ({position.area.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !form.watch("courseId")}>
              {loading ? "Creando..." : "Crear Regla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Botón para activar/desactivar regla
interface ToggleRuleButtonProps {
  rule: EnrollmentRule
  onToggled: () => void
}

function ToggleRuleButton({ rule, onToggled }: ToggleRuleButtonProps) {
  const [loading, setLoading] = React.useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/enrollment-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al actualizar regla")
      }

      toast.success(rule.isActive ? "Regla desactivada" : "Regla activada")
      onToggled()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {rule.isActive ? "Desactivar" : "Activar"}
    </Button>
  )
}

// Botón para eliminar regla
interface DeleteRuleButtonProps {
  ruleId: string
  onDeleted: () => void
}

function DeleteRuleButton({ ruleId, onDeleted }: DeleteRuleButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/enrollment-rules/${ruleId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar regla")
      }

      toast.success("Regla eliminada exitosamente")
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
          <DialogTitle>Eliminar Regla</DialogTitle>
          <DialogDescription>
            ¿Estás seguro? Esta acción cancelará las inscripciones automáticas asociadas.
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
