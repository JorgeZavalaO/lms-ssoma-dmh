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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { UserPlus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Collaborator {
  id: string
  dni: string
  fullName: string
  email: string
}

interface EnrollToCourseDialogProps {
  courseId: string
  courseName: string
  onEnrolled?: () => void
}

export function EnrollToCourseDialog({ courseId, courseName, onEnrolled }: EnrollToCourseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [collaborators, setCollaborators] = React.useState<Collaborator[]>([])
  const [selectedCollaborators, setSelectedCollaborators] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchLoading, setSearchLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      notes: "",
    },
  })

  // Usar useRef para evitar que loadCollaborators cause re-renders infinitos
  const loadCollaboratorsRef = React.useRef<(query?: string) => Promise<void>>(async () => {})
  
  loadCollaboratorsRef.current = async (query = "") => {
    setSearchLoading(true)
    try {
      const params = new URLSearchParams({
        includeUser: "0",
        pageSize: "100",
        status: "ACTIVE",
      })
      
      if (query.trim()) {
        params.set("q", query.trim())
      }

      const res = await fetch(`/api/collaborators?${params}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      if (data.items) {
        setCollaborators(data.items)
      }
    } catch (error) {
      console.error("Error loading collaborators:", error)
      toast.error("Error al cargar colaboradores: " + (error instanceof Error ? error.message : "Error desconocido"))
    } finally {
      setSearchLoading(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      loadCollaboratorsRef.current?.()
    } else {
      // Limpiar estado cuando se cierra el modal
      setCollaborators([])
      setSelectedCollaborators([])
      setSearchQuery("")
    }
  }, [open])

  // Búsqueda con debounce - solo cuando hay búsqueda activa
  React.useEffect(() => {
    if (!open || searchQuery === "") {
      return
    }

    const timer = setTimeout(() => {
      loadCollaboratorsRef.current?.(searchQuery)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [open, searchQuery])

  const setCollaboratorSelection = React.useCallback((collaboratorId: string, isSelected: boolean) => {
    setSelectedCollaborators((prev) => {
      if (isSelected) {
        if (prev.includes(collaboratorId)) {
          return prev
        }
        return [...prev, collaboratorId]
      }
      return prev.filter((id) => id !== collaboratorId)
    })
  }, [])

  const toggleAll = () => {
    if (selectedCollaborators.length === collaborators.length) {
      setSelectedCollaborators([])
    } else {
      setSelectedCollaborators(collaborators.map((c) => c.id))
    }
  }

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
          courseId,
          collaboratorIds: selectedCollaborators,
          notes: data.notes || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al inscribir colaboradores")
      }

      const result = await res.json()
      toast.success(result.message)
      setOpen(false)
      form.reset()
      setSelectedCollaborators([])
      setSearchQuery("")
      onEnrolled?.()
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
          <UserPlus className="h-4 w-4 mr-1" />
          Inscribir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Inscribir Colaboradores</DialogTitle>
          <DialogDescription>
            Inscribe colaboradores al curso: {courseName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="search">Buscar colaboradores activos</Label>
              {searchLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search"
                placeholder="Buscar por nombre, DNI o email..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchQuery(value)

                  if (value.trim() === "") {
                    loadCollaboratorsRef.current?.()
                  }
                }}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Solo se muestran colaboradores con estado activo
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>
                Colaboradores activos ({selectedCollaborators.length} de {collaborators.length} seleccionados)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleAll}
                disabled={searchLoading || collaborators.length === 0}
              >
                {selectedCollaborators.length === collaborators.length && collaborators.length > 0
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </Button>
            </div>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {searchLoading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  Buscando colaboradores...
                </div>
              ) : collaborators.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchQuery ? "No se encontraron colaboradores con esa búsqueda" : "No hay colaboradores activos"}
                </div>
              ) : (
                <div className="divide-y">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedCollaborators.includes(collaborator.id)}
                        onCheckedChange={(checked) =>
                          setCollaboratorSelection(collaborator.id, checked === true)
                        }
                      />
                      <div className="flex-1">
                        <div className="font-medium">{collaborator.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {collaborator.dni} • {collaborator.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Agregar notas sobre esta inscripción..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || selectedCollaborators.length === 0}
            >
              {loading
                ? "Inscribiendo..."
                : `Inscribir ${selectedCollaborators.length} colaborador${
                    selectedCollaborators.length !== 1 ? "es" : ""
                  }`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
