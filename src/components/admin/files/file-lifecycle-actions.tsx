"use client"

import * as React from "react"
import { ArchiveX, EyeOff, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { FileInventoryItem } from "@/lib/file-inventory"

type LifecycleAction = "DISABLE" | "DELETE"

type Props = {
  file: Pick<FileInventoryItem, "id" | "name" | "lifecycleStatus" | "canDisable" | "canRestore" | "canDelete" | "deleteBlockers">
  onCompleted?: () => void
}

export function FileLifecycleActions({ file, onCompleted }: Props) {
  const [dialogAction, setDialogAction] = React.useState<LifecycleAction | null>(null)
  const [reason, setReason] = React.useState("")
  const [processing, setProcessing] = React.useState(false)
  const [restoreOpen, setRestoreOpen] = React.useState(false)

  const closeActionDialog = () => {
    if (processing) return
    setDialogAction(null)
    setReason("")
  }

  const handleDisable = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISABLE", reason }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json.error || "No se pudo deshabilitar el archivo")
      }

      toast.success("Archivo deshabilitado para uso operativo")
      closeActionDialog()
      onCompleted?.()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "No se pudo deshabilitar el archivo")
    } finally {
      setProcessing(false)
    }
  }

  const handleRestore = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESTORE" }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json.error || "No se pudo reactivar el archivo")
      }

      toast.success("Archivo reactivado")
      setRestoreOpen(false)
      onCompleted?.()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "No se pudo reactivar el archivo")
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/files/${file.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json.error || "No se pudo eliminar el archivo")
      }

      toast.success("Blob eliminado y registro marcado como histórico")
      closeActionDialog()
      onCompleted?.()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el archivo")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {file.canDisable ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setDialogAction("DISABLE")}>
            <EyeOff className="h-4 w-4" /> Deshabilitar
          </Button>
        ) : null}

        {file.canRestore ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setRestoreOpen(true)}>
            <RotateCcw className="h-4 w-4" /> Reactivar
          </Button>
        ) : null}

        {file.lifecycleStatus !== "DELETED" ? (
          <Button variant="destructive" size="sm" className="gap-2" onClick={() => setDialogAction("DELETE")}>
            <ArchiveX className="h-4 w-4" /> Eliminar blob
          </Button>
        ) : null}
      </div>

      <Dialog open={dialogAction !== null} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "DISABLE" ? "Deshabilitar archivo" : "Eliminar archivo de forma segura"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "DISABLE"
                ? "El archivo dejará de aparecer en los listados operativos, pero conservará su blob y su trazabilidad."
                : "La eliminación física solo se habilita cuando el archivo ya está deshabilitado y no existen referencias detectadas."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-slate-50/70 p-3 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Archivo:</span> {file.name}
            </div>

            {dialogAction === "DELETE" && file.deleteBlockers.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="font-medium">Bloqueos detectados</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {file.deleteBlockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="file-lifecycle-reason">Motivo *</Label>
              <Textarea
                id="file-lifecycle-reason"
                rows={4}
                placeholder={dialogAction === "DISABLE"
                  ? "Ej: se reemplazó por una nueva versión y ya no debe seguir disponible en formularios."
                  : "Ej: archivo obsoleto, sin referencias y validado manualmente para eliminación física."}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <p className="text-xs text-slate-500">Mínimo 10 caracteres para dejar trazabilidad operativa.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog} disabled={processing}>
              Cancelar
            </Button>
            <Button
              variant={dialogAction === "DELETE" ? "destructive" : "default"}
              onClick={dialogAction === "DISABLE" ? handleDisable : handleDelete}
              disabled={processing || reason.trim().length < 10 || (dialogAction === "DELETE" && !file.canDelete)}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {dialogAction === "DISABLE" ? "Confirmar deshabilitado" : "Eliminar del blob"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivar archivo</AlertDialogTitle>
            <AlertDialogDescription>
              El archivo volverá a estar disponible en los listados operativos y podrá reutilizarse desde el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}