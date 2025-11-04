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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { PositionSchema } from "@/validations/positions"
import { toast } from "sonner"

type Area = { id: string; code: string; name: string }

interface CreatePositionDialogProps {
  onCreated: () => void
}

export function CreatePositionDialog({ onCreated }: CreatePositionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [areas, setAreas] = React.useState<Area[]>([])
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      name: "",
      areaId: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      fetch("/api/areas").then(r => r.json()).then(setAreas)
    }
  }, [open])

  const onSubmit = async (data: z.infer<typeof PositionSchema>) => {
    const validated = PositionSchema.parse(data)
    setLoading(true)
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error creating position")
      }
      toast.success("Puesto creado exitosamente")
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
        <Button>Crear Puesto</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Puesto</DialogTitle>
          <DialogDescription>
            Agrega un nuevo puesto al sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              {...form.register("name")}
              className="col-span-3"
              placeholder="Gerente"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="areaId" className="text-right">
              Área
            </Label>
            <Select onValueChange={(value) => form.setValue("areaId", value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar área" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.code} - {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditPositionDialogProps {
  position: { id: string; name: string; area: { id: string; code: string; name: string } }
  onEdited: () => void
}

export function EditPositionDialog({ position, onEdited }: EditPositionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [areas, setAreas] = React.useState<Area[]>([])
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      name: position.name,
      areaId: position.area.id,
    },
  })

  React.useEffect(() => {
    if (open) {
      fetch("/api/areas").then(r => r.json()).then(setAreas)
    }
  }, [open])

  const onSubmit = async (data: z.infer<typeof PositionSchema>) => {
    const validated = PositionSchema.parse(data)
    setLoading(true)
    try {
      const res = await fetch(`/api/positions/${position.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error updating position")
      }
      toast.success("Puesto actualizado exitosamente")
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Puesto</DialogTitle>
          <DialogDescription>
            Modifica los datos del puesto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              {...form.register("name")}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="areaId" className="text-right">
              Área
            </Label>
            <Select value={form.watch("areaId")} onValueChange={(value) => form.setValue("areaId", value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.code} - {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

interface DeletePositionDialogProps {
  position: { id: string; name: string }
  onDeleted: () => void
}

export function DeletePositionDialog({ position, onDeleted }: DeletePositionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/positions/${position.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error deleting position")
      }
      toast.success("Puesto eliminado exitosamente")
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
          <DialogTitle>Eliminar Puesto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar el puesto {position.name}? Esta acción no se puede deshacer.
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
