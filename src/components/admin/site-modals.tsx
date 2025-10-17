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
import { useForm } from "react-hook-form"
import { z } from "zod"
import { SiteSchema } from "@/validations/sites"
import { toast } from "sonner"

interface CreateSiteDialogProps {
  onCreated: () => void
}

export function CreateSiteDialog({ onCreated }: CreateSiteDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      name: "",
      code: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof SiteSchema>) => {
    const validated = SiteSchema.parse(data)
    setLoading(true)
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error creating site")
      }
      toast.success("Sede creada exitosamente")
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
        <Button>Crear Sede</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Sede</DialogTitle>
          <DialogDescription>
            Agrega una nueva sede al sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Código
            </Label>
            <Input
              id="code"
              {...form.register("code")}
              className="col-span-3"
              placeholder="LIM"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              {...form.register("name")}
              className="col-span-3"
              placeholder="Lima"
            />
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

interface EditSiteDialogProps {
  site: { id: string; name: string; code: string }
  onEdited: () => void
}

export function EditSiteDialog({ site, onEdited }: EditSiteDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    defaultValues: {
      name: site.name,
      code: site.code,
    },
  })

  const onSubmit = async (data: z.infer<typeof SiteSchema>) => {
    const validated = SiteSchema.parse(data)
    setLoading(true)
    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error updating site")
      }
      toast.success("Sede actualizada exitosamente")
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
          <DialogTitle>Editar Sede</DialogTitle>
          <DialogDescription>
            Modifica los datos de la sede.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Código
            </Label>
            <Input
              id="code"
              {...form.register("code")}
              className="col-span-3"
            />
          </div>
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

interface DeleteSiteDialogProps {
  site: { id: string; name: string }
  onDeleted: () => void
}

export function DeleteSiteDialog({ site, onDeleted }: DeleteSiteDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error deleting site")
      }
      toast.success("Sede eliminada exitosamente")
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
          <DialogTitle>Eliminar Sede</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar la sede {site.name}? Esta acción no se puede deshacer.
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